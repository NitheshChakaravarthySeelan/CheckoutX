package com.community.catalog.productread.application.handler;

import com.community.catalog.productread.application.command.GetProductByIdQuery;
import com.community.catalog.productread.application.dto.ProductDTO;
import com.community.catalog.productread.domain.model.ProductView;
import com.community.catalog.productread.domain.repository.ProductViewRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Date;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetProductByIdHandlerTest {

    @Mock
    private ProductViewRepository productViewRepository;

    @InjectMocks
    private GetProductByIdHandler handler;

    @Test
    void testHandle_WhenProductExists_ShouldReturnProductDTO() {
        // Arrange
        String productId = "product-xyz-123";
        ProductView productView = ProductView.builder()
                .id(productId)
                .name("Test Product")
                .price(new BigDecimal("99.99"))
                .sku("TEST-001")
                .quantity(100)
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();

        GetProductByIdQuery query = new GetProductByIdQuery(productId);
        when(productViewRepository.findById(productId)).thenReturn(Optional.of(productView));

        // Act
        Optional<ProductDTO> result = handler.handle(query);

        // Assert
        assertTrue(result.isPresent(), "Result should not be empty");
        ProductDTO dto = result.get();
        assertEquals(productId, dto.getId());
        assertEquals("Test Product", dto.getName());
        assertEquals("TEST-001", dto.getSku());
    }

    @Test
    void testHandle_WhenProductDoesNotExist_ShouldReturnEmptyOptional() {
        // Arrange
        String productId = "product-xyz-456";
        GetProductByIdQuery query = new GetProductByIdQuery(productId);
        when(productViewRepository.findById(productId)).thenReturn(Optional.empty());

        // Act
        Optional<ProductDTO> result = handler.handle(query);

        // Assert
        assertTrue(result.isEmpty(), "Result should be empty for a non-existent product");
    }
}

