package com.community.catalog.productwrite.interfaces.controller;

import com.community.catalog.productwrite.application.command.CreateProductCommand;
import com.community.catalog.productwrite.application.command.DeleteProductCommand;
import com.community.catalog.productwrite.application.command.UpdateProductCommand;
import com.community.catalog.productwrite.application.mediator.Mediator;
import com.community.catalog.productwrite.domain.model.Product;
import com.community.catalog.productwrite.interfaces.dto.CreateProductRequestDTO;
import com.community.catalog.productwrite.interfaces.dto.UpdateProductRequestDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductWriteController {

    private final Mediator mediator;

    @PostMapping
    public ResponseEntity<Product> createProduct(
            @Valid @RequestBody CreateProductRequestDTO requestDTO,
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-User-Roles") String userRolesHeader) {

        List<String> userRoles = Arrays.asList(userRolesHeader.split(","));

        CreateProductCommand command = new CreateProductCommand(
                requestDTO.getName(),
                requestDTO.getDescription(),
                requestDTO.getPrice(),
                requestDTO.getStockQuantity(),
                requestDTO.getSku(),
                requestDTO.getImageUrl(),
                requestDTO.getCategory(),
                requestDTO.getManufacturer(),
                requestDTO.getStatus(),
                userId,
                userRoles
        );

        Product createdProduct = mediator.send(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdProduct);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable String id,
            @Valid @RequestBody UpdateProductRequestDTO requestDTO,
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-User-Roles") String userRolesHeader) {

        List<String> userRoles = Arrays.asList(userRolesHeader.split(","));

        UpdateProductCommand command = new UpdateProductCommand(
                id,
                requestDTO.getName(),
                requestDTO.getDescription(),
                requestDTO.getPrice(),
                requestDTO.getStockQuantity(),
                requestDTO.getImageUrl(),
                requestDTO.getCategory(),
                requestDTO.getManufacturer(),
                requestDTO.getStatus(),
                userId,
                userRoles
        );

        Product updatedProduct = mediator.send(command);
        return ResponseEntity.ok(updatedProduct);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable String id,
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-User-Roles") String userRolesHeader) {

        List<String> userRoles = Arrays.asList(userRolesHeader.split(","));

        DeleteProductCommand command = new DeleteProductCommand(id, userId, userRoles);
        mediator.send(command);

        return ResponseEntity.noContent().build();
    }
}
