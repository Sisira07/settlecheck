package com.settlecheck.dto;

public record ReportResponse(
        int totalRecordsProcessed,
        int exactMatches,
        int subsetSumMatches,
        int exceptionsRaised,
        double matchRatePercent
) {}
