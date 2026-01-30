package com.community.catalog.productwrite.application.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductCreatedEvent {
    private String productId;
    private String sku;
    private String name;
    private BigDecimal price; // Include price as it's useful for inventory context (e.g., valuation)
    private Integer initialQuantity;
}
