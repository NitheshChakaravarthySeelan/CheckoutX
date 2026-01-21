package com.community.catalog.productread.application.dto;

import lombok.Builder;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

@Data
@Builder
public class ProductDTO implements Serializable {
    private String id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer quantity;
    private String sku;
    private String imageUrl;
    private String category;
    private String manufacturer;
    private String status;
    private Integer version;
    private Date createdAt;
    private Date updatedAt;
}
