package com.community.catalog.productread.application.handler;

import com.community.catalog.productread.application.command.GetProductByIdQuery;
import com.community.catalog.productread.application.dto.ProductDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import product_lookup.ProductLookupGrpc;
import product_lookup.ProductLookupOuterClass;

import java.math.BigDecimal;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class GetProductByIdHandler {

    private final ProductLookupGrpc.ProductLookupBlockingStub productLookupBlockingStub;

    public Optional<ProductDTO> handle(GetProductByIdQuery query) {
        ProductLookupOuterClass.GetProductByIdRequest request = ProductLookupOuterClass.GetProductByIdRequest.newBuilder()
                .setId(query.getProductId())
                .build();

        try {
            ProductLookupOuterClass.Product product = productLookupBlockingStub.getProductById(request);

            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
            Date createdAt = null;
            Date updatedAt = null;
            try {
                createdAt = dateFormat.parse(product.getCreatedAt());
                updatedAt = dateFormat.parse(product.getUpdatedAt());
            } catch (ParseException e) {
                // Handle parsing exception
            }

            return Optional.of(ProductDTO.builder()
                    .id(product.getId())
                    .name(product.getName())
                    .description(product.getDescription())
                    .price(BigDecimal.valueOf(product.getPrice()))
                    .quantity(product.getQuantity())
                    .sku(product.getSku())
                    .imageUrl(product.getImageUrl())
                    .category(product.getCategory())
                    .manufacturer(product.getManufacturer())
                    .status(product.getStatus())
                    .version((int) product.getVersion())
                    .createdAt(createdAt)
                    .updatedAt(updatedAt)
                    .build());
        } catch (Exception e) {
            // Handle exceptions, e.g., if the product is not found or the gRPC call fails
            return Optional.empty();
        }
    }
}
