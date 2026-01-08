package com.community.users.authservice.interfaces.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
/** Login Status and the JWT */
public class LoginResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private UserResponse user;
}
