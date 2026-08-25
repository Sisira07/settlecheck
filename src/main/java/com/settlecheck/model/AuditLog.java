package com.settlecheck.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * One row per decision the engine makes (a match or an exception).
 * This is what makes the system explainable — nothing resolves silently.
 */
@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String logId;

    /** ID of the related order, settlement, match, or exception. */
    private String recordId;

    /** MATCH_EXACT / MATCH_SUBSET_SUM / EXCEPTION_RAISED */
    private String action;

    private String passUsed;

    private Integer confidence;

    @Column(length = 1000)
    private String reasoning;

    private Instant timestamp = Instant.now();

    public AuditLog() {}

    public AuditLog(String recordId, String action, String passUsed, Integer confidence, String reasoning) {
        this.recordId = recordId;
        this.action = action;
        this.passUsed = passUsed;
        this.confidence = confidence;
        this.reasoning = reasoning;
    }

    public String getLogId() { return logId; }
    public String getRecordId() { return recordId; }
    public String getAction() { return action; }
    public String getPassUsed() { return passUsed; }
    public Integer getConfidence() { return confidence; }
    public String getReasoning() { return reasoning; }
    public Instant getTimestamp() { return timestamp; }
}
