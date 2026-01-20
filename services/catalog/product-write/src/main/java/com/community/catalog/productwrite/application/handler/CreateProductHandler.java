package com.community.catalog.productwrite.application.handler;

import com.community.catalog.productwrite.application.command.CreateProductCommand;
import com.community.catalog.productwrite.application.error.ForbiddenException;
import com.community.catalog.productwrite.application.error.ProductAlreadyExistsException;
import com.community.catalog.productwrite.domain.model.Product;
import com.community.catalog.productwrite.domain.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.cache.annotation.CacheEvict; // <--- Add this import

import java.util.Date;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CreateProductHandler {

    private final ProductRepository productRepository;
    private static final List<String> REQUIRED_ROLES = List.of("ADMIN", "PRODUCT_MANAGER");

    @Transactional
    @CacheEvict(value = "products", allEntries = true) // <--- Add this annotation
    public Product handle(CreateProductCommand command) {
        // 1. Authorize
        if (command.getUserRoles().stream().noneMatch(REQUIRED_ROLES::contains)) {
            throw new ForbiddenException("User does not have the required role to create a product.");
        }

        // 2. Check for conflicts
        productRepository.findBySku(command.getSku()).ifPresent(p -> {
            throw new ProductAlreadyExistsException("Product with SKU '" + command.getSku() + "' already exists.");
        });

        // 3. Enrich and Map
        Product product = Product.builder()
                .id(UUID.randomUUID().toString())
                .name(command.getName())
                .description(command.getDescription())
                .price(command.getPrice())
                .stockQuantity(command.getStockQuantity())
                .sku(command.getSku())
                .imageUrl(command.getImageUrl())
                .category(command.getCategory())
                .manufacturer(command.getManufacturer())
                .status(StringUtils.hasText(command.getStatus()) ? command.getStatus() : "ACTIVE") // Default status
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();

        // 4. Persist
        return productRepository.save(product);
    }
}