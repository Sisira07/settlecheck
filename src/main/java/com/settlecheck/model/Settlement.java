package com.settlecheck.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * A settlement record as reported by Razorpay (test-mode API pull, or a
 * synthetic stand-in with the same shape). linkedOrderRef is deliberately
 * allowed to be null/wrong — that's what makes reconciliation necessary.
 */
@Entity
@Table(name = "settlements")
public class Settlement {

    @Id
    private String settlementId;

    private long amountPaise;

    private long feePaise;

    private Instant settledAt;

    /** May be null, stale, or point at the wrong order — not trusted as-is. */
    private String linkedOrderRef;

    private String status = "UNMATCHED";

    public Settlement() {}

    public Settlement(String settlementId, long amountPaise, long feePaise, Instant settledAt) {
        this.settlementId = settlementId;
        this.amountPaise = amountPaise;
        this.feePaise = feePaise;
        this.settledAt = settledAt;
    }

    public String getSettlementId() { return settlementId; }
    public void setSettlementId(String settlementId) { this.settlementId = settlementId; }

    public long getAmountPaise() { return amountPaise; }
    public void setAmountPaise(long amountPaise) { this.amountPaise = amountPaise; }

    public long getFeePaise() { return feePaise; }
    public void setFeePaise(long feePaise) { this.feePaise = feePaise; }

    public Instant getSettledAt() { return settledAt; }
    public void setSettledAt(Instant settledAt) { this.settledAt = settledAt; }

    public String getLinkedOrderRef() { return linkedOrderRef; }
    public void setLinkedOrderRef(String linkedOrderRef) { this.linkedOrderRef = linkedOrderRef; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
