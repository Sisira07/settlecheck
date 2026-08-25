package com.settlecheck.service;

import com.settlecheck.model.Order;
import com.settlecheck.model.Settlement;
import com.settlecheck.repository.OrderRepository;
import com.settlecheck.repository.SettlementRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Generates a synthetic batch that deliberately includes the three cases
 * the engine needs to prove itself against:
 *   - clean 1:1 matches (Pass 1 should catch these)
 *   - split settlements: one order paid out across 2-3 settlements
 *   - merged batches: 2-3 orders paid out in a single settlement
 *   - a few genuinely broken records (no match should exist)
 */
@Service
public class DataGeneratorService {

    private final OrderRepository orderRepo;
    private final SettlementRepository settlementRepo;
    private final Random random = new Random(42); // fixed seed for reproducible demo runs

    public DataGeneratorService(OrderRepository orderRepo, SettlementRepository settlementRepo) {
        this.orderRepo = orderRepo;
        this.settlementRepo = settlementRepo;
    }

    public void generate(int cleanCount, int splitCount, int mergedCount, int brokenCount) {
        Instant base = Instant.now().minus(30, ChronoUnit.DAYS);
        int orderSeq = 1;
        int settlementSeq = 1;

        // 1:1 clean matches
        for (int i = 0; i < cleanCount; i++) {
            long amount = randomAmountPaise();
            long fee = feeFor(amount);
            Instant created = base.plus(i, ChronoUnit.HOURS);
            String orderId = "ORD-" + orderSeq++;
            orderRepo.save(new Order(orderId, amount, created));

            Settlement s = new Settlement("STL-" + settlementSeq++, amount - fee, fee, created.plus(2, ChronoUnit.DAYS));
            s.setLinkedOrderRef(orderId);
            settlementRepo.save(s);
        }

        // Split settlements: 1 order -> 2-3 settlements
        for (int i = 0; i < splitCount; i++) {
            long amount = randomAmountPaise();
            long fee = feeFor(amount);
            long net = amount - fee;
            Instant created = base.plus(100 + i, ChronoUnit.HOURS);
            String orderId = "ORD-" + orderSeq++;
            orderRepo.save(new Order(orderId, amount, created));

            int parts = 2 + random.nextInt(2); // 2 or 3
            long remaining = net;
            for (int p = 0; p < parts; p++) {
                long portion = (p == parts - 1) ? remaining : Math.round(net / (double) parts);
                remaining -= portion;
                Settlement s = new Settlement("STL-" + settlementSeq++, portion, fee / parts,
                        created.plus(2, ChronoUnit.DAYS).plus(p, ChronoUnit.HOURS));
                // linkedOrderRef deliberately left null on split settlements —
                // Razorpay's real settlement records don't always carry it cleanly
                settlementRepo.save(s);
            }
        }

        // Merged batches: 2-3 orders -> 1 settlement
        for (int i = 0; i < mergedCount; i++) {
            int parts = 2 + random.nextInt(2);
            List<String> ids = new ArrayList<>();
            long totalNet = 0;
            long totalFee = 0;
            Instant created = base.plus(200 + i, ChronoUnit.HOURS);
            for (int p = 0; p < parts; p++) {
                long amount = randomAmountPaise();
                long fee = feeFor(amount);
                String orderId = "ORD-" + orderSeq++;
                orderRepo.save(new Order(orderId, amount, created.plus(p, ChronoUnit.MINUTES)));
                ids.add(orderId);
                totalNet += (amount - fee);
                totalFee += fee;
            }
            Settlement s = new Settlement("STL-" + settlementSeq++, totalNet, totalFee, created.plus(2, ChronoUnit.DAYS));
            settlementRepo.save(s);
        }

        // Genuinely broken: orders with no settlement at all, and settlements with no order
        for (int i = 0; i < brokenCount; i++) {
            orderRepo.save(new Order("ORD-" + orderSeq++, randomAmountPaise(), base.plus(300 + i, ChronoUnit.HOURS)));
            settlementRepo.save(new Settlement("STL-" + settlementSeq++, randomAmountPaise(),
                    randomAmountPaise() / 50, base.plus(300 + i, ChronoUnit.HOURS).plus(2, ChronoUnit.DAYS)));
        }
    }

    private long randomAmountPaise() {
        return (500 + random.nextInt(50000)) * 100L; // ₹500 - ₹50,500
    }

    private long feeFor(long amountPaise) {
        return Math.round(amountPaise * 0.02); // 2% flat fee assumption for synthetic data
    }
}
