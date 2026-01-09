package com.community.cart.snapshot.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder; // Added @Builder
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "cart_snapshots")
@Getter
@Setter
@NoArgsConstructor // Lombok will generate a no-argument constructor
@AllArgsConstructor // Lombok will generate a constructor with all fields
@Builder // Added Builder for easier creation
public class UserCartSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private Long userId;

    // LLD: Using JSONB to store a flexible, schemaless copy of the cart items array.
    // This is the core of the "snapshot" - it's the exact state of the cart at a moment in time.
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String items; // Stored as a JSON string

    @Column(nullable = false)
    private long totalPriceCents;

    @Column(nullable = false)
    private long totalDiscountCents;

    @Column(nullable = false)
    private long totalTaxCents;

    @Column(nullable = true) // Shipping address might be null initially
    private String shippingAddress;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
