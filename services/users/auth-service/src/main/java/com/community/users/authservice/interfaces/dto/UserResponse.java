package com.community.users.authservice.interfaces.dto;

import com.community.users.authservice.domain.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserResponse {
    private String id;
    private String username;
    private String email;

    /**
     * Creates a UserResponse DTO from a User entity.
     *
     * @param user The User entity.
     * @return A new UserResponse object.
     */
    public static UserResponse fromUser(User user) {
        return new UserResponse(user.getId().toString(), user.getUsername(), user.getEmail());
    }
}
