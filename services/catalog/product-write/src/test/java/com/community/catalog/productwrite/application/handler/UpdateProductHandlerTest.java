package com.community.catalog.productwrite.application.handler;

import com.community.catalog.productwrite.application.command.UpdateProductCommand;
import com.community.catalog.productwrite.application.error.ForbiddenException;
import com.community.catalog.productwrite.application.error.ProductNotFoundException;
import com.community.catalog.productwrite.domain.model.Product;
import com.community.catalog.productwrite.domain.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UpdateProductHandlerTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private UpdateProductHandler handler;

    @Test
    void testHandle_WhenUserIsAdmin_ShouldUpdateAndReturnProduct() {
        // Arrange
        UUID productId = UUID.fromString("a2b7e9b8-3e3c-4e8a-8f7a-9a9b9c9d9e9f");
        UpdateProductCommand command = new UpdateProductCommand(
                productId.toString(), "Updated Name", "Updated Desc", new BigDecimal("129.99"),
                150, "new.jpg", "new-cat", "new-manu", "ACTIVE",
                "admin-user-id", List.of("ADMIN")
        );

        Product existingProduct = Product.builder().id(productId).name("Old Name").build();
        when(productRepository.findById(productId)).thenReturn(Optional.of(existingProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Product updatedProduct = handler.handle(command);

        // Assert
        assertNotNull(updatedProduct);
        assertEquals("Updated Name", updatedProduct.getName());
        assertEquals(new BigDecimal("129.99"), updatedProduct.getPrice());
        verify(productRepository, times(1)).findById(productId);
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    void testHandle_WhenProductNotFound_ShouldThrowException() {
        // Arrange
        UUID productId = UUID.fromString("b3c8f0c9-4f4d-5f9b-9a8b-0a0b0c0d0e0f");
        UpdateProductCommand command = new UpdateProductCommand(
                productId.toString(), "Upd", "Upd", null, null, null, null, null, null, "user-id", List.of("ADMIN")
        );
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ProductNotFoundException.class, () -> handler.handle(command));
        verify(productRepository, times(1)).findById(productId);
        verify(productRepository, never()).save(any());
    }

    @Test
    void testHandle_WhenUserLacksRole_ShouldThrowForbiddenException() {
        // Arrange
        UUID productId = UUID.fromString("c4d9a1d0-5a5e-6a0c-0a9c-1b1c1d1e1f1a");
        UpdateProductCommand command = new UpdateProductCommand(
                productId.toString(), "Upd", "Upd", null, null, null, null, null, null, "user-id", List.of("USER")
        );

        // Act & Assert
        assertThrows(ForbiddenException.class, () -> handler.handle(command));
        verify(productRepository, never()).findById(any());
        verify(productRepository, never()).save(any());
    }
}
