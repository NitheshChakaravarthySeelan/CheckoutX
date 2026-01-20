package com.community.pricing.discountengine.interfaces.dto;

import lombok.Data;

@Data
public class CartItemDTO {
    private String productId;
    private int quantity;
    private long priceCents;
}
