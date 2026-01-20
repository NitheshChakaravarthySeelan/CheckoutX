package com.community.catalog.productread.interfaces.grpc;

import com.community.catalog.productread.application.command.GetProductByIdQuery;
import com.community.catalog.productread.application.dto.ProductDTO;
import com.community.catalog.productread.application.mediator.Mediator;
import io.grpc.stub.StreamObserver;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;
import com.community.catalog.proto.Product;
import com.community.catalog.proto.product_read.GetProductDetailsRequest;
import com.community.catalog.proto.product_read.ProductReadServiceGrpc;

@GrpcService
@RequiredArgsConstructor
public class ProductReadGrpcService extends ProductReadServiceGrpc.ProductReadServiceImplBase {

    private final Mediator mediator;

    @SuppressWarnings("unchecked")
    @Override
    public void getProductDetails(GetProductDetailsRequest request, StreamObserver<Product> responseObserver) {
        GetProductByIdQuery query = new GetProductByIdQuery(request.getProductId());
        Optional<ProductDTO> productDTOOptional = mediator.send(query, Optional.class);

        if (productDTOOptional.isPresent()) {
            ProductDTO dto = productDTOOptional.get();
            Product product = Product.newBuilder()
                    .setId(String.valueOf(dto.getId()))
                    .setName(dto.getName())
                    .setDescription(dto.getDescription())
                    .setPrice(dto.getPrice().doubleValue())
                    .setImageUrl(dto.getImageUrl())
                    .build();
            responseObserver.onNext(product);
            responseObserver.onCompleted();
        } else {
            // You can handle not found case by sending an error
            responseObserver.onError(io.grpc.Status.NOT_FOUND
                .withDescription("Product with ID " + request.getProductId() + " not found.")
                .asRuntimeException());
        }
    }
}
