package com.community.users.authservice.application.service;

import com.community.users.authservice.application.dto.UserDTO;
import com.community.users.authservice.application.dto.UserLoggedInDTO;
import com.community.users.authservice.domain.model.Role;
import com.community.users.authservice.domain.model.User;
import com.community.users.authservice.domain.repository.UserRepository;
import com.community.users.authservice.infrastructure.security.JWTService;
import java.util.Collections;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final JWTService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final UserDetailsService userDetailsService;

    @Autowired
    public AuthService(
            UserRepository userRepository,
            JWTService jwtService,
            PasswordEncoder passwordEncoder,
            UserDetailsService userDetailsService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.userDetailsService = userDetailsService;
    }

    public UserLoggedInDTO userLogin(String email, String password) throws Exception {
        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() -> new Exception("Invalid email or password"));

        if (passwordEncoder.matches(password, user.getPassword())) {
            String jwtToken = jwtService.generateToken(user);
            UserDTO userDTO = new UserDTO(user.getUsername());

            return UserLoggedInDTO.builder()
                    .jwtToken(jwtToken)
                    .userId(user.getId())
                    .userName(userDTO)
                    .email(user.getEmail())
                    .roles(
                            user.getRoles().stream()
                                    .map(Role::name)
                                    .collect(Collectors.toList())) // Corrected to Role::name
                    .build();
        } else {
            throw new Exception("Invalid email or password");
        }
    }

    public User registerUser(User user) throws Exception {
        Optional<User> existingUser = userRepository.findByEmail(user.getEmail());
        if (existingUser.isPresent()) {
            throw new Exception("User with email " + user.getEmail() + " already exists");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        user.setRoles(
                Collections.singletonList(Role.USER)); // Corrected to use Role.USER enum constant
        return userRepository.save(user);
    }

    public User validateToken(String token) throws Exception {
        try {
            if (token == null || token.isEmpty()) {
                throw new Exception("Invalid token");
            }

            String username = jwtService.extractUsername(token);
            if (username == null) {
                throw new Exception("Invalid token");
            }

            User user = (User) userDetailsService.loadUserByUsername(username);

            if (jwtService.isTokenValid(token, user)) {
                return user;
            } else {
                throw new Exception("Invalid token");
            }
        } catch (Exception e) {
            throw new Exception(
                    "Error validating token: "
                            + e.getMessage()); // Added message for better debugging
        }
    }
}
