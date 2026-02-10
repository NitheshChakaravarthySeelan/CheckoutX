package com.community.catalog.productwrite.application.handler;

import com.community.catalog.productwrite.application.command.UpdateProductCommand;
import com.community.catalog.productwrite.application.error.ForbiddenException;
import com.community.catalog.productwrite.application.error.ProductNotFoundException;
import com.community.catalog.productwrite.domain.model.Product;
import com.community.catalog.productwrite.domain.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Date;
import java.util.List;

@Component
@RequiredArgsConstructor
public class UpdateProductHandler {

    private final ProductRepository productRepository;
    private static final List<String> REQUIRED_ROLES = List.of("ADMIN", "PRODUCT_MANAGER");

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "products", key = "#command.productId"),
        @CacheEvict(value = "products", key = "'all'")
    })
    public Product handle(UpdateProductCommand command) {
        // 1. Authorize
        if (command.getUserRoles().stream().noneMatch(REQUIRED_ROLES::contains)) {
            throw new ForbiddenException("User does not have the required role to update a product.");
        }

        // 2. Find existing product
        Product product = productRepository.findById(java.util.UUID.fromString(command.getProductId()))
                .orElseThrow(() -> new ProductNotFoundException("Product with ID '" + command.getProductId() + "' not found."));

        // 3. Update fields if they are provided
        if (StringUtils.hasText(command.getName())) {
            product.setName(command.getName());
        }
        if (StringUtils.hasText(command.getDescription())) {
            product.setDescription(command.getDescription());
        }
        if (command.getPrice() != null) {
            product.setPrice(command.getPrice());
        }
        if (command.getStockQuantity() != null) {
            product.setStockQuantity(command.getStockQuantity());
        }
        if (StringUtils.hasText(command.getImageUrl())) {
            product.setImageUrl(command.getImageUrl());
        }
        if (StringUtils.hasText(command.getCategory())) {
            product.setCategory(command.getCategory());
        }
        if (StringUtils.hasText(command.getManufacturer())) {
            product.setManufacturer(command.getManufacturer());
        }
        if (StringUtils.hasText(command.getStatus())) {
            product.setStatus(command.getStatus());
        }

        product.setUpdatedAt(new Date());

        // 4. Persist
        return productRepository.save(product);
    }
}
