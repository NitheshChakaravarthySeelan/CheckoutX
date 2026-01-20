package com.community.catalog.productwrite.application.handler;

import com.community.catalog.productwrite.application.command.DeleteProductCommand;
import com.community.catalog.productwrite.application.error.ForbiddenException;
import com.community.catalog.productwrite.domain.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeleteProductHandlerTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private DeleteProductHandler handler;

    @Test
    void testHandle_WhenUserIsAdmin_ShouldDeleteProduct() {
        // Arrange
        String productId = "a2b7e9b8-3e3c-4e8a-8f7a-9a9b9c9d9e9f";
        DeleteProductCommand command = new DeleteProductCommand(productId, "admin-user", List.of("ADMIN"));
        doNothing().when(productRepository).deleteById(productId);

        // Act
        handler.handle(command);

        // Assert
        verify(productRepository, times(1)).deleteById(productId);
    }

    @Test
    void testHandle_WhenUserLacksRole_ShouldThrowForbiddenException() {
        // Arrange
        String productId = "b3c8f0c9-4f4d-5f9b-9g8b-0a0b0c0d0e0f";
        DeleteProductCommand command = new DeleteProductCommand(productId, "normal-user", List.of("USER"));

        // Act & Assert
        assertThrows(ForbiddenException.class, () -> handler.handle(command));
        verify(productRepository, never()).deleteById(any());
    }
}
