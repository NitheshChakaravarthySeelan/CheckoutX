package com.community.catalog.productwrite.application.command;

import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@RequiredArgsConstructor
public class UpdateProductCommand {
    private final String productId;
    private final String name;
    private final String description;
    private final BigDecimal price;
    private final Integer stockQuantity;
    private final String imageUrl;
    private final String category;
    private final String manufacturer;
    private final String status;
    private final String userId;
    private final List<String> userRoles;
}
