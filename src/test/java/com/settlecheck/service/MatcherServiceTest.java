package com.settlecheck.service;

import com.settlecheck.model.Order;
import com.settlecheck.model.Settlement;
import com.settlecheck.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;MODE=PostgreSQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class MatcherServiceTest {

    @Autowired private OrderRepository orderRepo;
    @Autowired private SettlementRepository settlementRepo;
    @Autowired private ExceptionRecordRepository exceptionRepo;
    @Autowired private MatchRecordRepository matchRepo;
    @Autowired private AuditLogRepository auditRepo;
    @Autowired private MatcherService matcherService;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        orderRepo.deleteAll();
        settlementRepo.deleteAll();
        exceptionRepo.deleteAll();
        matchRepo.deleteAll();
        auditRepo.deleteAll();
    }

    @Test
    void exactMatch_isCaughtByPassOne() {
        Instant now = Instant.now();
        orderRepo.save(new Order("ORD-1", 100_000, now)); // ₹1000.00

        Settlement s = new Settlement("STL-1", 98_000, 2_000, now.plus(1, ChronoUnit.DAYS));
        s.setLinkedOrderRef("ORD-1");
        settlementRepo.save(s);

        MatcherService.ReconcileResult result = matcherService.runReconciliation();

        assertThat(result.exactMatches()).isEqualTo(1);
        assertThat(result.subsetMatches()).isZero();
        assertThat(result.exceptionsRaised()).isZero();
    }

    @Test
    void splitSettlement_isCaughtByPassTwo() {
        Instant now = Instant.now();
        orderRepo.save(new Order("ORD-2", 100_000, now)); // ₹1000.00, no linked ref

        // Same order paid out across two unlinked settlements
        settlementRepo.save(new Settlement("STL-2A", 60_000, 1_200, now.plus(1, ChronoUnit.DAYS)));
        settlementRepo.save(new Settlement("STL-2B", 38_000, 800, now.plus(1, ChronoUnit.DAYS)));

        MatcherService.ReconcileResult result = matcherService.runReconciliation();

        assertThat(result.exactMatches()).isZero();
        assertThat(result.subsetMatches()).isEqualTo(1);
        assertThat(result.exceptionsRaised()).isZero();
    }

    @Test
    void genuinelyUnmatchable_raisesExceptionInsteadOfGuessing() {
        Instant now = Instant.now();
        orderRepo.save(new Order("ORD-3", 100_000, now));
        settlementRepo.save(new Settlement("STL-3", 15_000, 300, now.plus(1, ChronoUnit.DAYS))); // way off

        MatcherService.ReconcileResult result = matcherService.runReconciliation();

        assertThat(result.exactMatches()).isZero();
        assertThat(result.subsetMatches()).isZero();
        assertThat(result.exceptionsRaised()).isEqualTo(2); // 1 order + 1 settlement, both unresolved
    }

    @Test
    void ambiguousNearTolerance_doesNotAutoResolveBelowConfidenceGate() {
        Instant now = Instant.now();
        // Order that could almost-but-not-quite be explained by a 3-way group —
        // engine should refuse rather than force a low-confidence match.
        orderRepo.save(new Order("ORD-4", 100_000, now));
        settlementRepo.save(new Settlement("STL-4A", 40_000, 800, now.plus(1, ChronoUnit.DAYS)));
        settlementRepo.save(new Settlement("STL-4B", 30_000, 600, now.plus(1, ChronoUnit.DAYS)));
        settlementRepo.save(new Settlement("STL-4C", 20_000, 400, now.plus(1, ChronoUnit.DAYS)));
        // Sum = 90,000 vs target 100,000 — outside the 2.5% tolerance band, must NOT match.

        MatcherService.ReconcileResult result = matcherService.runReconciliation();

        assertThat(result.subsetMatches()).isZero();
        assertThat(result.exceptionsRaised()).isGreaterThan(0);
    }
}
