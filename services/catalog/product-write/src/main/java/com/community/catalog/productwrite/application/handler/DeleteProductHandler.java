package com.community.catalog.productwrite.application.handler;

import com.community.catalog.productwrite.application.command.DeleteProductCommand;
import com.community.catalog.productwrite.application.error.ForbiddenException;
import com.community.catalog.productwrite.domain.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DeleteProductHandler {

    private final ProductRepository productRepository;
    private static final List<String> REQUIRED_ROLES = List.of("ADMIN", "PRODUCT_MANAGER");

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "products", key = "#command.productId"),
        @CacheEvict(value = "products", key = "'all'")
    })
    public void handle(DeleteProductCommand command) {
        // 1. Authorize
        if (command.getUserRoles().stream().noneMatch(REQUIRED_ROLES::contains)) {
            throw new ForbiddenException("User does not have the required role to delete a product.");
        }

        // 2. Delete
        productRepository.deleteById(java.util.UUID.fromString(command.getProductId()));
    }
}
