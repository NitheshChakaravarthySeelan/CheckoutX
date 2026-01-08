package com.community.users.authservice.interfaces.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserValidationResponseDTO {
    private Long id;
    private String userName;
    private String email;
    private List<String> roles;
}
