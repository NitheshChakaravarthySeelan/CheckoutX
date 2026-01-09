package com.community.cart.snapshot.application.service;

import cart_snapshot_service.CartSnapshotServiceOuterClass.CreateCartSnapshotRequest; // Import
import com.community.cart.snapshot.domain.model.UserCartSnapshot;
import com.community.cart.snapshot.domain.repository.UserCartSnapshotRepository;
import com.community.cart.snapshot.infrastructure.client.CartCrudAdapter;
import java.time.Instant;
import java.util.List; // Added missing import
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Protobuf
// message

@Service
@RequiredArgsConstructor
public class SnapshotService {
    private final UserCartSnapshotRepository userCartSnapshotRepository;
    private final CartCrudAdapter
            cartCrudAdapter; // Keep existing adapter for original method if still used elsewhere

    // Existing method - might be refactored or removed later if not used
    @Transactional
    public UserCartSnapshot createSnapshot(Long userId) {
        // call the external url
        String liverCartItemsJson = cartCrudAdapter.getLiveCart(userId);

        // Validation
        if (liverCartItemsJson == null
                || liverCartItemsJson.isEmpty()
                || liverCartItemsJson.equals("[]")) {
            throw new IllegalStateException(
                    "Cannot create a snapshot of an empty or non-existent cart.");
        }

        // Create a new snapshot entity.
        UserCartSnapshot snapshot = new UserCartSnapshot();
        snapshot.setUserId(userId);
        snapshot.setItems(liverCartItemsJson); // Assuming items are stored as JSON string
        snapshot.setCreatedAt(Instant.now()); // Set creation timestamp

        // Save the immutable snapshot to the db.
        return userCartSnapshotRepository.save(snapshot);
    }

    // New method to create snapshot directly from gRPC request data
    @Transactional
    public UserCartSnapshot createSnapshotFromRequest(CreateCartSnapshotRequest request) {
        // Basic validation
        if (request.getCartItemsList().isEmpty()) {
            throw new IllegalArgumentException("Cannot create a snapshot of an empty cart.");
        }

        UserCartSnapshot snapshot = new UserCartSnapshot();
        snapshot.setId(UUID.randomUUID()); // Generate a new UUID for the snapshot
        snapshot.setUserId(
                Long.valueOf(request.getUserId())); // Assuming userId is Long in UserCartSnapshot
        snapshot.setItems(
                convertCartItemsToJson(
                        request.getCartItemsList())); // Convert Protobuf CartItem list to JSON
        // string
        snapshot.setTotalPriceCents(request.getTotalPriceCents());
        snapshot.setTotalDiscountCents(request.getTotalDiscountCents());
        snapshot.setTotalTaxCents(request.getTotalTaxCents());
        snapshot.setShippingAddress(request.getShippingAddress());
        snapshot.setCreatedAt(Instant.now());

        return userCartSnapshotRepository.save(snapshot);
    }

    @Transactional(readOnly = true)
    public UserCartSnapshot getSnapshotById(UUID snapshotId) {
        return userCartSnapshotRepository
                .findById(snapshotId)
                .orElseThrow(
                        () ->
                                new IllegalArgumentException(
                                        "Cart snapshot not found with ID: " + snapshotId));
    }

    // Helper method to convert Protobuf CartItem list to JSON string
    private String convertCartItemsToJson(List<cart.CartOuterClass.CartItem> cartItems) {
        // This is a simple conversion. In a real app, you might use a more robust JSON serializer.
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < cartItems.size(); i++) {
            cart.CartOuterClass.CartItem item = cartItems.get(i);
            sb.append("{")
                    .append("\"productId\":\"")
                    .append(item.getProductId())
                    .append("\",")
                    .append("\"quantity\":")
                    .append(item.getQuantity())
                    .append(",")
                    .append("\"name\":\"")
                    .append(item.getName())
                    .append("\",")
                    .append("\"priceCents\":")
                    .append(item.getPriceCents())
                    .append(",")
                    .append("\"imageUrl\":\"")
                    .append(item.getImageUrl())
                    .append("\"")
                    .append("}");
            if (i < cartItems.size() - 1) {
                sb.append(",");
            }
        }
        sb.append("]");
        return sb.toString();
    }
}
