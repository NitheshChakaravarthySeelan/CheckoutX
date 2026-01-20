package com.community.catalog.productread.application.handler;

import com.community.catalog.productread.application.command.GetAllProductsQuery; // Add this import
import com.community.catalog.productread.application.dto.ProductDTO;
import com.community.catalog.productread.domain.model.ProductView;
import com.community.catalog.productread.domain.repository.ProductViewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.cache.annotation.Cacheable;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class GetAllProductsHandler {

  private final ProductViewRepository productViewRepository;

  @Cacheable(value = "products", key = "'all'")
  public List<ProductDTO> handle(GetAllProductsQuery query) {
    List<ProductView> products = productViewRepository.findAll();
    return products.stream()
        .map(this::convertToDTO)
        .collect(Collectors.toList());
  }

  private ProductDTO convertToDTO(ProductView product) {
    return ProductDTO.builder()
        .id(String.valueOf(product.getId()))
        .name(product.getName())
        .description(product.getDescription())
        .price(product.getPrice())
        .quantity(product.getQuantity())
        .sku(product.getSku())
        .imageUrl(product.getImageUrl())
        .category(product.getCategory())
        .manufacturer(product.getManufacturer())
        .status(product.getStatus())
        .version(product.getVersion())
        .createdAt(product.getCreatedAt())
        .updatedAt(product.getUpdatedAt())
        .build();
  }
}
