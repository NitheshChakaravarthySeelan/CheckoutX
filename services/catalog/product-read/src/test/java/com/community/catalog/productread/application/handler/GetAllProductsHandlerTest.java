package com.community.catalog.productread.application.handler;

import com.community.catalog.productread.application.command.GetAllProductsQuery; // ADD THIS IMPORT
import com.community.catalog.productread.application.dto.ProductDTO;
import com.community.catalog.productread.domain.model.ProductView;
import com.community.catalog.productread.domain.repository.ProductViewRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetAllProductsHandlerTest {

    @Mock
    private ProductViewRepository productViewRepository;

    @InjectMocks
    private GetAllProductsHandler handler;

    @Test
    void testHandle_WhenProductsExist_ShouldReturnListOfProductDTOs() {
        // Arrange
        ProductView product1 = ProductView.builder().id(UUID.fromString("1a2b3c4d-5e6f-7890-1234-567890abcdef")).name("Product 1").price(new BigDecimal("10.00")).build();
        ProductView product2 = ProductView.builder().id(UUID.fromString("fedcba98-7654-3210-fedc-ba9876543210")).name("Product 2").price(new BigDecimal("20.00")).build();
        List<ProductView> productList = List.of(product1, product2);

        GetAllProductsQuery query = new GetAllProductsQuery();
        when(productViewRepository.findAll()).thenReturn(productList);

        // Act
        List<ProductDTO> result = handler.handle(query);

        // Assert
        assertEquals(2, result.size(), "Should return two products");
        assertEquals("Product 1", result.get(0).getName());
        assertEquals("Product 2", result.get(1).getName());
    }

    @Test
    void testHandle_WhenNoProductsExist_ShouldReturnEmptyList() {
        // Arrange
        GetAllProductsQuery query = new GetAllProductsQuery();
        when(productViewRepository.findAll()).thenReturn(Collections.emptyList());

        // Act
        List<ProductDTO> result = handler.handle(query);

        // Assert
        assertTrue(result.isEmpty(), "Should return an empty list when no products are found");
    }
}
