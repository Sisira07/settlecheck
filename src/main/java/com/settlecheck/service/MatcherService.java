package com.settlecheck.service;

import com.settlecheck.model.*;
import com.settlecheck.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;

/**
 * Reconciliation engine. Two deterministic passes, then a confidence gate.
 * No LLM anywhere in this class on purpose — matching money must be
 * provably correct, not merely plausible.
 *
 * PASS 1 — exact match: same reference, amount within fee tolerance.
 * PASS 2 — bounded subset-sum: handles split settlements (1 order -> N
 *          settlements) and merged batches (N orders -> 1 settlement).
 *          Implemented as branch-and-bound search over a small, sorted
 *          candidate window rather than a full DP table: with a max
 *          group size of MAX_GROUP_SIZE and a batch of ~50-100 records,
 *          this is fast, and the search order is easy to explain and
 *          step through by hand (each choice is "include or skip the
 *          next largest candidate, pruned once the partial sum can no
 *          longer reach the target within tolerance").
 *
 * Anything that doesn't clear the confidence threshold is NEVER
 * auto-resolved — it is written to the exceptions table instead.
 */
@Service
public class MatcherService {

    private static final int MAX_GROUP_SIZE = 4;

    private final OrderRepository orderRepo;
    private final SettlementRepository settlementRepo;
    private final MatchRecordRepository matchRepo;
    private final ExceptionRecordRepository exceptionRepo;
    private final AuditLogRepository auditRepo;

    @Value("${settlecheck.fee-tolerance-percent:2.5}")
    private double feeTolerancePercent;

    @Value("${settlecheck.settlement-window-days:5}")
    private long settlementWindowDays;

    @Value("${settlecheck.min-confidence:70}")
    private int minConfidence;

    public MatcherService(OrderRepository orderRepo, SettlementRepository settlementRepo,
                           MatchRecordRepository matchRepo, ExceptionRecordRepository exceptionRepo,
                           AuditLogRepository auditRepo) {
        this.orderRepo = orderRepo;
        this.settlementRepo = settlementRepo;
        this.matchRepo = matchRepo;
        this.exceptionRepo = exceptionRepo;
        this.auditRepo = auditRepo;
    }

    public ReconcileResult runReconciliation() {
        List<Order> unmatchedOrders = new ArrayList<>(orderRepo.findByStatus("UNMATCHED"));
        List<Settlement> unmatchedSettlements = new ArrayList<>(settlementRepo.findByStatus("UNMATCHED"));

        int exactMatches = runExactPass(unmatchedOrders, unmatchedSettlements);
        int subsetMatches = runSubsetSumPass(unmatchedOrders, unmatchedSettlements);
        int exceptionsRaised = raiseExceptionsForLeftovers(unmatchedOrders, unmatchedSettlements);

        int totalOrders = orderRepo.count() > 0 ? (int) orderRepo.count() : 0;
        return new ReconcileResult(totalOrders, exactMatches, subsetMatches, exceptionsRaised);
    }

    // ---------- PASS 1: exact match ----------

    private int runExactPass(List<Order> orders, List<Settlement> settlements) {
        int count = 0;
        Iterator<Order> orderIt = orders.iterator();
        while (orderIt.hasNext()) {
            Order order = orderIt.next();
            long tolerance = feeTolerance(order.getAmountPaise());

            Iterator<Settlement> settlementIt = settlements.iterator();
            while (settlementIt.hasNext()) {
                Settlement s = settlementIt.next();
                boolean refMatches = order.getOrderId().equals(s.getLinkedOrderRef());
                long expectedNet = order.getAmountPaise() - s.getFeePaise();
                boolean amountMatches = Math.abs(s.getAmountPaise() - expectedNet) <= tolerance;

                if (refMatches && amountMatches) {
                    persistMatch(List.of(order.getOrderId()), List.of(s.getSettlementId()), "EXACT", 100);
                    order.setStatus("MATCHED");
                    s.setStatus("MATCHED");
                    orderRepo.save(order);
                    settlementRepo.save(s);
                    settlementIt.remove();
                    count++;
                    break;
                }
            }
            if ("MATCHED".equals(order.getStatus())) {
                orderIt.remove();
            }
        }
        return count;
    }

    // ---------- PASS 2: bounded subset-sum (N:M) ----------

    private int runSubsetSumPass(List<Order> orders, List<Settlement> settlements) {
        int count = 0;

        // 1 order <- subset of settlements (split settlement)
        Iterator<Order> orderIt = orders.iterator();
        while (orderIt.hasNext()) {
            Order order = orderIt.next();
            List<Settlement> window = settlementsInWindow(settlements, order.getCreatedAt());
            long target = order.getAmountPaise();
            long tolerance = feeTolerance(target);

            List<Settlement> group = findSubsetMatchingSum(window, target, tolerance);
            if (group != null) {
                int confidence = scoreConfidence(group.size(), target, sumOf(group), tolerance);
                if (confidence >= minConfidence) {
                    List<String> settlementIds = group.stream().map(Settlement::getSettlementId).toList();
                    persistMatch(List.of(order.getOrderId()), settlementIds, "SUBSET_SUM", confidence);
                    order.setStatus("MATCHED");
                    orderRepo.save(order);
                    for (Settlement s : group) {
                        s.setStatus("MATCHED");
                        settlementRepo.save(s);
                        settlements.remove(s);
                    }
                    orderIt.remove();
                    count++;
                }
            }
        }

        // N orders -> 1 settlement (merged batch)
        Iterator<Settlement> settlementIt = settlements.iterator();
        while (settlementIt.hasNext()) {
            Settlement s = settlementIt.next();
            List<Order> window = ordersInWindow(orders, s.getSettledAt());
            long target = s.getAmountPaise() + s.getFeePaise();
            long tolerance = feeTolerance(target);

            List<Order> group = findOrderSubsetMatchingSum(window, target, tolerance);
            if (group != null) {
                int confidence = scoreConfidence(group.size(), target, sumOfOrders(group), tolerance);
                if (confidence >= minConfidence) {
                    List<String> orderIds = group.stream().map(Order::getOrderId).toList();
                    persistMatch(orderIds, List.of(s.getSettlementId()), "SUBSET_SUM", confidence);
                    s.setStatus("MATCHED");
                    settlementRepo.save(s);
                    for (Order o : group) {
                        o.setStatus("MATCHED");
                        orderRepo.save(o);
                        orders.remove(o);
                    }
                    settlementIt.remove();
                    count++;
                }
            }
        }

        return count;
    }

    /**
     * Branch-and-bound search for a subset of candidates (sorted descending)
     * summing to target within tolerance, capped at MAX_GROUP_SIZE items.
     * Returns null if nothing within tolerance is found.
     */
    private List<Settlement> findSubsetMatchingSum(List<Settlement> candidates, long target, long tolerance) {
        List<Settlement> sorted = new ArrayList<>(candidates);
        sorted.sort((a, b) -> Long.compare(b.getAmountPaise(), a.getAmountPaise()));
        return search(sorted, 0, target, tolerance, new ArrayList<>(), MAX_GROUP_SIZE);
    }

    private List<Settlement> search(List<Settlement> sorted, int index, long remaining, long tolerance,
                                     List<Settlement> chosen, int budget) {
        if (Math.abs(remaining) <= tolerance && !chosen.isEmpty()) {
            return new ArrayList<>(chosen);
        }
        if (index >= sorted.size() || budget == 0 || remaining < -tolerance) {
            return null;
        }
        Settlement candidate = sorted.get(index);

        // Try including this candidate
        chosen.add(candidate);
        List<Settlement> withCandidate = search(sorted, index + 1, remaining - candidate.getAmountPaise(),
                tolerance, chosen, budget - 1);
        chosen.remove(chosen.size() - 1);
        if (withCandidate != null) return withCandidate;

        // Try skipping it
        return search(sorted, index + 1, remaining, tolerance, chosen, budget);
    }

    private List<Order> findOrderSubsetMatchingSum(List<Order> candidates, long target, long tolerance) {
        List<Order> sorted = new ArrayList<>(candidates);
        sorted.sort((a, b) -> Long.compare(b.getAmountPaise(), a.getAmountPaise()));
        return searchOrders(sorted, 0, target, tolerance, new ArrayList<>(), MAX_GROUP_SIZE);
    }

    private List<Order> searchOrders(List<Order> sorted, int index, long remaining, long tolerance,
                                     List<Order> chosen, int budget) {
        if (Math.abs(remaining) <= tolerance && !chosen.isEmpty()) {
            return new ArrayList<>(chosen);
        }
        if (index >= sorted.size() || budget == 0 || remaining < -tolerance) {
            return null;
        }
        Order candidate = sorted.get(index);

        chosen.add(candidate);
        List<Order> withCandidate = searchOrders(sorted, index + 1, remaining - candidate.getAmountPaise(),
                tolerance, chosen, budget - 1);
        chosen.remove(chosen.size() - 1);
        if (withCandidate != null) return withCandidate;

        return searchOrders(sorted, index + 1, remaining, tolerance, chosen, budget);
    }

    private int scoreConfidence(int groupSize, long target, long achievedSum, long tolerance) {
        double diffRatio = tolerance == 0 ? 0 : Math.abs(target - achievedSum) / (double) Math.max(tolerance, 1);
        int base = 100 - (groupSize - 1) * 10;           // bigger groups are inherently less certain
        int diffPenalty = (int) Math.round(diffRatio * 10); // closer to tolerance edge = less certain
        return Math.max(0, Math.min(100, base - diffPenalty));
    }

    // ---------- Exceptions for anything left over ----------

    private int raiseExceptionsForLeftovers(List<Order> orders, List<Settlement> settlements) {
        int count = 0;
        for (Order o : orders) {
            String reason = settlements.isEmpty() ? "MISSING_SETTLEMENT" : "LOW_CONFIDENCE_GROUP";
            ExceptionRecord ex = new ExceptionRecord(List.of(o.getOrderId()), List.of(), reason);
            exceptionRepo.save(ex);
            String reasoning = "No settlement or settlement group matched order " + o.getOrderId()
                             + " (amount " + o.getAmountPaise() + " paise) within tolerance/group-size bounds.";
            log(ex.getExceptionId(), "EXCEPTION_RAISED", "NONE", null, reasoning);
            log(o.getOrderId(), "EXCEPTION_RAISED", "NONE", null, reasoning);
            count++;
        }
        for (Settlement s : settlements) {
            ExceptionRecord ex = new ExceptionRecord(List.of(), List.of(s.getSettlementId()), "MISSING_ORDER");
            exceptionRepo.save(ex);
            String reasoning = "Settlement " + s.getSettlementId() + " (amount " + s.getAmountPaise()
                             + " paise) has no matching order or order group.";
            log(ex.getExceptionId(), "EXCEPTION_RAISED", "NONE", null, reasoning);
            log(s.getSettlementId(), "EXCEPTION_RAISED", "NONE", null, reasoning);
            count++;
        }
        return count;
    }

    // ---------- helpers ----------

    private List<Settlement> settlementsInWindow(List<Settlement> settlements, java.time.Instant orderCreatedAt) {
        List<Settlement> out = new ArrayList<>();
        for (Settlement s : settlements) {
            if (s.getSettledAt() == null) continue;
            Duration gap = Duration.between(orderCreatedAt, s.getSettledAt());
            if (!gap.isNegative() && gap.toDays() <= settlementWindowDays) {
                out.add(s);
            }
        }
        return out;
    }

    private List<Order> ordersInWindow(List<Order> orders, java.time.Instant settledAt) {
        if (settledAt == null) return new ArrayList<>();
        List<Order> out = new ArrayList<>();
        for (Order o : orders) {
            Duration gap = Duration.between(o.getCreatedAt(), settledAt);
            if (!gap.isNegative() && gap.toDays() <= settlementWindowDays) {
                out.add(o);
            }
        }
        return out;
    }

    private long feeTolerance(long amountPaise) {
        return Math.round(amountPaise * (feeTolerancePercent / 100.0));
    }

    private long sumOf(List<Settlement> group) {
        return group.stream().mapToLong(Settlement::getAmountPaise).sum();
    }

    private long sumOfOrders(List<Order> group) {
        return group.stream().mapToLong(Order::getAmountPaise).sum();
    }

    private void persistMatch(List<String> orderIds, List<String> settlementIds, String passType, int confidence) {
        MatchRecord m = new MatchRecord(orderIds, settlementIds, passType, confidence);
        matchRepo.save(m);
        String reason = "Matched orders " + orderIds + " to settlements " + settlementIds + " with confidence " + confidence + "%.";
        log(m.getMatchId(), "MATCH_" + passType, passType, confidence, reason);
        for (String id : orderIds) log(id, "MATCH_" + passType, passType, confidence, reason);
        for (String id : settlementIds) log(id, "MATCH_" + passType, passType, confidence, reason);
    }

    private void log(String recordId, String action, String passUsed, Integer confidence, String reasoning) {
        auditRepo.save(new AuditLog(recordId, action, passUsed, confidence, reasoning));
    }

    /** Summary returned to the API layer. */
    public record ReconcileResult(int totalOrders, int exactMatches, int subsetMatches, int exceptionsRaised) {
        public double matchRatePercent() {
            int matched = exactMatches + subsetMatches;
            int total = matched + exceptionsRaised;
            return total == 0 ? 0.0 : Math.round((matched / (double) total) * 10000) / 100.0;
        }
    }
}
