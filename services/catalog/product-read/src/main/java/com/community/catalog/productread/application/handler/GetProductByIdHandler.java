package com.community.catalog.productread.application.handler;

import com.community.catalog.productread.application.command.GetProductByIdQuery;
import com.community.catalog.productread.application.dto.ProductDTO;
import com.community.catalog.productread.domain.model.ProductView;
import com.community.catalog.productread.domain.repository.ProductViewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class GetProductByIdHandler {

    private final ProductViewRepository productViewRepository;

    public Optional<ProductDTO> handle(GetProductByIdQuery query) {
        Optional<ProductView> productViewOptional = productViewRepository.findById(query.getProductId());

        return productViewOptional.map(productView -> ProductDTO.builder()
                .id(productView.getId())
                .name(productView.getName())
                .description(productView.getDescription())
                .price(productView.getPrice())
                .quantity(productView.getQuantity())
                .sku(productView.getSku())
                .imageUrl(productView.getImageUrl())
                .category(productView.getCategory())
                .manufacturer(productView.getManufacturer())
                .status(productView.getStatus())
                .version(productView.getVersion())
                .createdAt(productView.getCreatedAt())
                .updatedAt(productView.getUpdatedAt())
                .build());
    }
}

