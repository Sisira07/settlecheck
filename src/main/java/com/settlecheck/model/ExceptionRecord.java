package com.settlecheck.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "exceptions")
public class ExceptionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String exceptionId;

    @ElementCollection
    private List<String> orderIds;

    @ElementCollection
    private List<String> settlementIds;

    /** AMOUNT_MISMATCH / MISSING_SETTLEMENT / MISSING_ORDER / LOW_CONFIDENCE_GROUP / DUPLICATE */
    private String reasonCode;

    @Column(length = 1000)
    private String llmExplanation;

    /** OPEN or REVIEWED — never auto-flipped by the system. */
    private String status = "OPEN";

    private Instant createdAt = Instant.now();

    public ExceptionRecord() {}

    public ExceptionRecord(List<String> orderIds, List<String> settlementIds, String reasonCode) {
        this.orderIds = orderIds;
        this.settlementIds = settlementIds;
        this.reasonCode = reasonCode;
    }

    public String getExceptionId() { return exceptionId; }
    public List<String> getOrderIds() { return orderIds; }
    public List<String> getSettlementIds() { return settlementIds; }
    public String getReasonCode() { return reasonCode; }
    public String getLlmExplanation() { return llmExplanation; }
    public void setLlmExplanation(String llmExplanation) { this.llmExplanation = llmExplanation; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
