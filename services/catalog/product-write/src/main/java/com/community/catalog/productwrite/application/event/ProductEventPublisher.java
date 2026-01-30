package com.community.catalog.productwrite.application.event;

import com.community.catalog.productwrite.domain.model.Product;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductEventPublisher {

    @Value("${product.events.topic}")
    private String productEventsTopic;

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishProductCreatedEvent(Product product) {
        ProductCreatedEvent event = new ProductCreatedEvent(
            product.getId(),
            product.getSku(),
            product.getName(),
            product.getPrice(),
            product.getStockQuantity() // Assuming initial stock comes from creation
        );

        // Use product ID as the key for partitioning, ensuring all events for one product go to same partition
        kafkaTemplate.send(productEventsTopic, product.getId(), event);
        log.info("Published ProductCreatedEvent for Product ID: {}", product.getId());
    }
}
