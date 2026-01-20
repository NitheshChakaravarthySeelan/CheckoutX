package com.community.catalog.productread.application.handler;

import com.community.catalog.productread.application.command.GetProductByIdQuery;
import com.community.catalog.productread.application.dto.ProductDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import product_lookup.ProductLookupGrpc;
import product_lookup.ProductLookupOuterClass;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetProductByIdHandlerTest {

    @Mock
    private ProductLookupGrpc.ProductLookupBlockingStub productLookupBlockingStub;

    @InjectMocks
    private GetProductByIdHandler handler;

    @Test
    void testHandle_WhenProductExists_ShouldReturnProductDTO() {
        // Arrange
        String productId = "product-xyz-123";
        ProductLookupOuterClass.Product product = ProductLookupOuterClass.Product.newBuilder()
                .setId(productId)
                .setName("Test Product")
                .setPrice(99.99)
                .setSku("TEST-001")
                .setQuantity(100)
                .setCreatedAt("2025-12-10T13:00:00.000Z")
                .setUpdatedAt("2025-12-10T13:00:00.000Z")
                .build();

        GetProductByIdQuery query = new GetProductByIdQuery(productId);
        when(productLookupBlockingStub.getProductById(any(ProductLookupOuterClass.GetProductByIdRequest.class))).thenReturn(product);

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
        when(productLookupBlockingStub.getProductById(any(ProductLookupOuterClass.GetProductByIdRequest.class))).thenThrow(new RuntimeException("Product not found"));

        // Act
        Optional<ProductDTO> result = handler.handle(query);

        // Assert
        assertTrue(result.isEmpty(), "Result should be empty for a non-existent product");
    }
}
