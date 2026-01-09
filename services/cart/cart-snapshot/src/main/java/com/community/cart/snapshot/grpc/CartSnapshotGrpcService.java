package com.community.cart.snapshot.grpc;

import cart_snapshot_service.CartSnapshotServiceGrpc;
import cart_snapshot_service.CartSnapshotServiceOuterClass.CartSnapshot;
import cart_snapshot_service.CartSnapshotServiceOuterClass.CartSnapshotResponse;
import cart_snapshot_service.CartSnapshotServiceOuterClass.CreateCartSnapshotRequest;
import cart_snapshot_service.CartSnapshotServiceOuterClass.CreateCartSnapshotResponse;
import cart_snapshot_service.CartSnapshotServiceOuterClass.GetCartSnapshotRequest;
import com.community.cart.snapshot.application.service.SnapshotService;
import com.community.cart.snapshot.domain.model.UserCartSnapshot;
import io.grpc.stub.StreamObserver;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;

@GrpcService
@RequiredArgsConstructor
public class CartSnapshotGrpcService extends CartSnapshotServiceGrpc.CartSnapshotServiceImplBase {

    private final SnapshotService snapshotService;

    @Override
    public void createCartSnapshot(
            CreateCartSnapshotRequest request,
            StreamObserver<CreateCartSnapshotResponse> responseObserver) {
        try {
            UserCartSnapshot userCartSnapshot = snapshotService.createSnapshotFromRequest(request);

            CreateCartSnapshotResponse response =
                    CreateCartSnapshotResponse.newBuilder()
                            .setSnapshotId(userCartSnapshot.getId().toString())
                            .setSuccess(true)
                            .setMessage("Cart snapshot created successfully")
                            .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(
                    io.grpc.Status.INTERNAL
                            .withDescription("Failed to create cart snapshot: " + e.getMessage())
                            .asRuntimeException());
        }
    }

    @Override
    public void getCartSnapshot(
            GetCartSnapshotRequest request, StreamObserver<CartSnapshotResponse> responseObserver) {
        try {
            UserCartSnapshot userCartSnapshot =
                    snapshotService.getSnapshotById(UUID.fromString(request.getSnapshotId()));

            CartSnapshot snapshot =
                    CartSnapshot.newBuilder()
                            .setSnapshotId(userCartSnapshot.getId().toString())
                            .setUserId(String.valueOf(userCartSnapshot.getUserId()))
                            // Assuming items are stored as JSON string and need to be parsed back
                            // to proto CartItem
                            // This is a simplified mapping, proper parsing of JSON string to
                            // List<CartItem> would be needed
                            // For now, setting a dummy list or leaving empty
                            // Example:
                            // .addAllItems(parseJsonToCartItems(userCartSnapshot.getItems()))
                            // Leaving items empty for now as it's complex to parse JSON string back
                            // to Proto in simple way
                            .setTotalPriceCents(userCartSnapshot.getTotalPriceCents())
                            .setTotalDiscountCents(userCartSnapshot.getTotalDiscountCents())
                            .setTotalTaxCents(userCartSnapshot.getTotalTaxCents())
                            .setShippingAddress(userCartSnapshot.getShippingAddress())
                            .setCreatedAt(userCartSnapshot.getCreatedAt().toString())
                            .build();

            CartSnapshotResponse response =
                    CartSnapshotResponse.newBuilder()
                            .setSnapshot(snapshot)
                            .setSuccess(true)
                            .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (IllegalArgumentException e) {
            responseObserver.onError(
                    io.grpc.Status.NOT_FOUND
                            .withDescription("Cart snapshot not found: " + e.getMessage())
                            .asRuntimeException());
        } catch (Exception e) {
            responseObserver.onError(
                    io.grpc.Status.INTERNAL
                            .withDescription("Failed to retrieve cart snapshot: " + e.getMessage())
                            .asRuntimeException());
        }
    }
    // Helper to parse JSON string to list of CartItem messages. Needs full JSON parsing.
    // For now, this is a placeholder.
    /*
    private List<cart.CartOuterClass.CartItem> parseJsonToCartItems(String jsonString) {
        // Implement JSON parsing here if needed.
        // E.g., using ObjectMapper from Jackson.
        return new ArrayList<>();
    }
    */
}
