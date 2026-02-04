package com.community.users.authservice.interfaces.dto;

import java.util.List;
import java.util.UUID; // Added import for UUID
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserValidationResponseDTO {
    private UUID id;
    private String userName;
    private String email;
    private List<String> roles;
}
