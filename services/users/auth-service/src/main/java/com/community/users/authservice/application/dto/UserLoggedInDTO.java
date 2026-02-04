package com.community.users.authservice.application.dto;

import java.util.List;
import java.util.UUID; // Add this import
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class UserLoggedInDTO {
    private String jwtToken;
    private UUID userId;
    private UserDTO userName;
    private String email;
    private List<String> roles;

    @Override
    public String toString() {
        return "UserLoggedInDTO{"
                + "jwtToken='"
                + jwtToken
                + '\''
                + ", userId="
                + userId
                + ", userName="
                + userName
                + ", email='"
                + email
                + '\''
                + ", roles="
                + roles
                + '}';
    }
}
