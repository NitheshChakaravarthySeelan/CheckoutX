package com.community.catalog.productwrite.application.command;

import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.util.List;

@Data
@RequiredArgsConstructor
public class DeleteProductCommand {
    private final String productId;
    private final String userId;
    private final List<String> userRoles;
}
