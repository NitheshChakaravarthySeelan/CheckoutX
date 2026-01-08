import com.community.users.authservice.application.dto.UserLoggedInDTO;
import com.community.users.authservice.application.service.AuthService;
import com.community.users.authservice.domain.model.Role; // Added import
import com.community.users.authservice.domain.model.User;
import com.community.users.authservice.interfaces.dto.LoginRequest;
import com.community.users.authservice.interfaces.dto.RegisterRequest;
import com.community.users.authservice.interfaces.dto.UserValidationResponseDTO; // New import
import jakarta.validation.Valid;
import java.util.Collections; // Added import
import java.util.stream.Collectors; // New import
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority; // New import
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User newUser =
                    User.builder()
                            .username(request.getUsername()) // Assuming request has userName
                            .email(request.getEmail())
                            .password(request.getPassword())
                            .roles(Collections.singletonList(Role.USER)) // Assign default role
                            .build();
            authService.registerUser(newUser);
            return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<UserLoggedInDTO> login(@Valid @RequestBody LoginRequest request)
            throws Exception {
        UserLoggedInDTO response = authService.userLogin(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/validate")
    public ResponseEntity<UserValidationResponseDTO> validateToken(
            @RequestHeader("Authorization") String authToken) {
        try {
            if (authToken == null || !authToken.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
            }

            String token = authToken.substring(7);
            User user = authService.validateToken(token);

            // Map User to UserValidationResponseDTO
            UserValidationResponseDTO responseDTO =
                    new UserValidationResponseDTO(
                            user.getId(),
                            user.getUsername(), // Use the actual field for display name
                            user.getEmail(),
                            user.getAuthorities().stream()
                                    .map(GrantedAuthority::getAuthority)
                                    .collect(Collectors.toList()));

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }
    }
}
