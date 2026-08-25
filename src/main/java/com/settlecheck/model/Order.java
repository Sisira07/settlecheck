package com.settlecheck.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Internal order record. Amounts are stored in paise (integer) to avoid
 * floating point drift when summing for subset-match comparisons.
 */
@Entity
@Table(name = "orders")
public class Order {

    @Id
    private String orderId;

    private long amountPaise;

    private Instant createdAt;

    private String currency = "INR";

    /** MATCHED / UNMATCHED — updated by the matcher, never set manually. */
    private String status = "UNMATCHED";

    public Order() {}

    public Order(String orderId, long amountPaise, Instant createdAt) {
        this.orderId = orderId;
        this.amountPaise = amountPaise;
        this.createdAt = createdAt;
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public long getAmountPaise() { return amountPaise; }
    public void setAmountPaise(long amountPaise) { this.amountPaise = amountPaise; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
