package com.settlecheck.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "matches")
public class MatchRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String matchId;

    @ElementCollection
    private List<String> orderIds;

    @ElementCollection
    private List<String> settlementIds;

    /** EXACT or SUBSET_SUM */
    private String passType;

    /** 0-100. Exact matches are always 100. */
    private int confidence;

    private Instant createdAt = Instant.now();

    public MatchRecord() {}

    public MatchRecord(List<String> orderIds, List<String> settlementIds, String passType, int confidence) {
        this.orderIds = orderIds == null ? null : new java.util.ArrayList<>(orderIds);
        this.settlementIds = settlementIds == null ? null : new java.util.ArrayList<>(settlementIds);
        this.passType = passType;
        this.confidence = confidence;
    }

    public String getMatchId() { return matchId; }
    public List<String> getOrderIds() { return orderIds; }
    public List<String> getSettlementIds() { return settlementIds; }
    public String getPassType() { return passType; }
    public int getConfidence() { return confidence; }
    public Instant getCreatedAt() { return createdAt; }
}
