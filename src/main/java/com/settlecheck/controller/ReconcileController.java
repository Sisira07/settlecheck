package com.settlecheck.controller;

import com.settlecheck.dto.ReportResponse;
import com.settlecheck.model.AuditLog;
import com.settlecheck.model.ExceptionRecord;
import com.settlecheck.repository.AuditLogRepository;
import com.settlecheck.repository.ExceptionRecordRepository;
import com.settlecheck.service.DataGeneratorService;
import com.settlecheck.service.ExplainerService;
import com.settlecheck.service.MatcherService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping
public class ReconcileController {

    private final DataGeneratorService dataGenerator;
    private final MatcherService matcherService;
    private final ExplainerService explainerService;
    private final ExceptionRecordRepository exceptionRepo;
    private final AuditLogRepository auditRepo;

    private MatcherService.ReconcileResult lastResult;

    public ReconcileController(DataGeneratorService dataGenerator, MatcherService matcherService,
                                ExplainerService explainerService, ExceptionRecordRepository exceptionRepo,
                                AuditLogRepository auditRepo) {
        this.dataGenerator = dataGenerator;
        this.matcherService = matcherService;
        this.explainerService = explainerService;
        this.exceptionRepo = exceptionRepo;
        this.auditRepo = auditRepo;
    }

    /** Seeds a synthetic batch. Defaults produce a mix of all four cases. */
    @PostMapping("/data/generate")
    public Map<String, String> generateData(
            @RequestParam(defaultValue = "30") int clean,
            @RequestParam(defaultValue = "10") int split,
            @RequestParam(defaultValue = "8") int merged,
            @RequestParam(defaultValue = "6") int broken) {
        dataGenerator.generate(clean, split, merged, broken);
        return Map.of("status", "generated",
                "orders", String.valueOf(clean + split + merged * 2 + broken),
                "settlements", String.valueOf(clean + split * 2 + merged + broken));
    }

    @PostMapping("/reconcile/run")
    public ReportResponse runReconciliation() {
        lastResult = matcherService.runReconciliation();
        explainerService.explainAllOpenExceptions();
        return toReport(lastResult);
    }

    @GetMapping("/reconcile/report")
    public ReportResponse getReport() {
        if (lastResult == null) {
            return new ReportResponse(0, 0, 0, 0, 0.0);
        }
        return toReport(lastResult);
    }

    @GetMapping("/reconcile/exceptions")
    public List<ExceptionRecord> getExceptions() {
        return exceptionRepo.findAll();
    }

    @GetMapping("/audit/{recordId}")
    public List<AuditLog> getAuditTrail(@PathVariable String recordId) {
        return auditRepo.findByRecordId(recordId);
    }

    private ReportResponse toReport(MatcherService.ReconcileResult r) {
        int totalProcessed = r.exactMatches() + r.subsetMatches() + r.exceptionsRaised();
        return new ReportResponse(totalProcessed, r.exactMatches(), r.subsetMatches(),
                r.exceptionsRaised(), r.matchRatePercent());
    }
}
