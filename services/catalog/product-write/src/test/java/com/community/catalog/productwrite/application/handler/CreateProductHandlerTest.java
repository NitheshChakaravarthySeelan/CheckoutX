package com.community.catalog.productwrite.application.handler;

import com.community.catalog.productwrite.application.command.CreateProductCommand;
import com.community.catalog.productwrite.application.error.ForbiddenException;
import com.community.catalog.productwrite.application.error.ProductAlreadyExistsException;
import com.community.catalog.productwrite.domain.model.Product;
import com.community.catalog.productwrite.domain.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CreateProductHandlerTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private CreateProductHandler handler;

    @Test
    void testHandle_WhenCommandIsValidAndUserIsAdmin_ShouldCreateAndReturnProduct() {
        // Arrange
        CreateProductCommand command = new CreateProductCommand("New Gadget", "It's new!", new BigDecimal("199.99"), 50, "GADGET-001", "/img.png", "Electronics", "GadgetCorp", "ACTIVE", "user-123", List.of("ADMIN"));

        when(productRepository.findBySku("GADGET-001")).thenReturn(Optional.empty());
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Product result = handler.handle(command);

        // Assert
        assertNotNull(result);
        assertNotNull(result.getId());
        assertEquals("New Gadget", result.getName());
        assertEquals("ACTIVE", result.getStatus());
        verify(productRepository, times(1)).findBySku("GADGET-001");
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    void testHandle_WhenUserIsNotAuthorized_ShouldThrowForbiddenException() {
        // Arrange
        CreateProductCommand command = new CreateProductCommand("New Gadget", "desc", BigDecimal.ONE, 1, "SKU", null, null, null, null, "user-123", List.of("USER"));

        // Act & Assert
        assertThrows(ForbiddenException.class, () -> {
            handler.handle(command);
        }, "Should throw ForbiddenException for non-admin user");

        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void testHandle_WhenSkuAlreadyExists_ShouldThrowProductAlreadyExistsException() {
        // Arrange
        CreateProductCommand command = new CreateProductCommand("Another Gadget", "desc", BigDecimal.ONE, 1, "SKU-EXIST", null, null, null, null, "user-123", List.of("ADMIN"));
        when(productRepository.findBySku("SKU-EXIST")).thenReturn(Optional.of(new Product()));

        // Act & Assert
        assertThrows(ProductAlreadyExistsException.class, () -> {
            handler.handle(command);
        }, "Should throw ProductAlreadyExistsException when SKU exists");

        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void testHandle_WhenStatusCommandIsEmpty_ShouldDefaultToActive() {
        // Arrange
        CreateProductCommand command = new CreateProductCommand("Default Status Gadget", "desc", BigDecimal.TEN, 10, "DEFAULT-SKU", null, null, null, "", "user-456", List.of("PRODUCT_MANAGER"));
        ArgumentCaptor<Product> productCaptor = ArgumentCaptor.forClass(Product.class);

        when(productRepository.findBySku("DEFAULT-SKU")).thenReturn(Optional.empty());
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        handler.handle(command);

        // Assert
        verify(productRepository).save(productCaptor.capture());
        Product savedProduct = productCaptor.getValue();
        assertEquals("ACTIVE", savedProduct.getStatus(), "Status should default to ACTIVE if not provided");
    }
}
