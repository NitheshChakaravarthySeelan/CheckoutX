package com.community.catalog.productread.interfaces.grpc;

import com.community.catalog.proto.Product;
import com.community.catalog.proto.product_read.GetProductDetailsRequest;
import com.community.catalog.productread.application.command.GetProductByIdQuery;
import com.community.catalog.productread.application.dto.ProductDTO;
import com.community.catalog.productread.application.mediator.Mediator;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProductReadGrpcServiceTest {

    @Mock
    private Mediator mediator;

    @Mock
    private StreamObserver<Product> responseObserver;

    @InjectMocks
    private ProductReadGrpcService productReadGrpcService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void getProductDetails_shouldReturnProduct_whenProductExists() {
        // Given
        String productId = "product-xyz-123";
        GetProductDetailsRequest request = GetProductDetailsRequest.newBuilder()
                .setProductId(productId)
                .build();
        ProductDTO productDTO = ProductDTO.builder()
                .id(productId)
                .name("Test Product")
                .description("Test Description")
                .price(BigDecimal.valueOf(10.00))
                .imageUrl("http://example.com/image.jpg")
                .build();

        when(mediator.send(any(GetProductByIdQuery.class), eq(Optional.class))).thenReturn(Optional.of(productDTO));

        // When
        productReadGrpcService.getProductDetails(request, responseObserver);

        // Then
        Product expectedProduct = Product.newBuilder()
                .setId(productDTO.getId())
                .setName(productDTO.getName())
                .setDescription(productDTO.getDescription())
                .setPrice(productDTO.getPrice().doubleValue())
                .setImageUrl(productDTO.getImageUrl())
                .build();
        verify(responseObserver).onNext(expectedProduct);
        verify(responseObserver).onCompleted();
    }

    @Test
    void getProductDetails_shouldReturnNotFound_whenProductDoesNotExist() {
        // Given
        String productId = "product-xyz-456";
        GetProductDetailsRequest request = GetProductDetailsRequest.newBuilder()
                .setProductId(productId)
                .build();

        when(mediator.send(any(GetProductByIdQuery.class), eq(Optional.class))).thenReturn(Optional.empty());

        // When
        productReadGrpcService.getProductDetails(request, responseObserver);

        // Then
        verify(responseObserver).onError(any(io.grpc.StatusRuntimeException.class));
    }
}
