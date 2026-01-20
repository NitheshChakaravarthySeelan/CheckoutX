package com.community.users.authservice.config;

import com.community.users.authservice.infrastructure.security.JWTService;
import com.community.users.authservice.infrastructure.security.JwtAuthFilter;
import com.community.users.authservice.infrastructure.security.JwtGrpcAuthenticationReader;
import io.grpc.Context;
import io.grpc.Contexts;
import io.grpc.Metadata;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.ServerInterceptor;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.interceptor.GrpcGlobalServerInterceptor;
import net.devh.boot.grpc.server.security.authentication.GrpcAuthenticationReader;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.BearerTokenAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true, jsr250Enabled = true)
@RequiredArgsConstructor // For JWTService and UserDetailsService
public class GrpcSecurityConfig {

    private final UserDetailsService userDetailsService; // Assuming you have a UserDetailsService
    private final JWTService jwtService; // Your JWT Service
    private final JwtDecoder jwtDecoder; // Inject JwtDecoder
    private final JwtAuthFilter jwtAuthFilter;

    public static final Context.Key<String> GRPC_USER_ID_CONTEXT_KEY = Context.key("grpc-user-id");
    public static final Context.Key<String> GRPC_USERNAME_CONTEXT_KEY =
            Context.key("grpc-username");

    // Configure HTTP Security for REST endpoints
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable()) // Disable CSRF for API
                .authorizeHttpRequests(
                        authorize ->
                                authorize
                                        .requestMatchers("/api/auth/register", "/api/auth/login")
                                        .permitAll() // Allow unauthenticated access to register and
                                        // login
                                        .anyRequest()
                                        .authenticated() // All other requests require
                        // authentication
                        )
                .sessionManagement(
                        session ->
                                session.sessionCreationPolicy(
                                        SessionCreationPolicy
                                                .STATELESS)) // Use stateless sessions for REST
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        // APIs
        return http.build();
    }

    // --- gRPC Security Configuration ---

    // Define the JwtGrpcAuthenticationReader (as discussed previously)
    @Bean
    public GrpcAuthenticationReader grpcAuthenticationReader() {
        return new JwtGrpcAuthenticationReader();
    }

    // Custom AuthenticationProvider for JWT validation in gRPC context
    // This uses your existing JWTService to validate the token
    @Bean
    public AuthenticationManager grpcAuthenticationManager() {
        return authentication -> {
            if (authentication instanceof BearerTokenAuthenticationToken) {
                String token = ((BearerTokenAuthenticationToken) authentication).getToken();
                try {
                    String username = jwtService.extractUsername(token);
                    if (username != null) {
                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                        if (jwtService.isTokenValid(token, userDetails)) {
                            return new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                        }
                    }
                } catch (UsernameNotFoundException | io.jsonwebtoken.JwtException e) {
                    throw new AuthenticationException("Invalid or expired JWT") {};
                }
                throw new AuthenticationException("Authentication failed") {};
            }
            return null; // Let other providers handle other authentication types
        };
    }

    @GrpcGlobalServerInterceptor
    public ServerInterceptor grpcContextInterceptor(
            AuthenticationManager grpcAuthenticationManager) {
        return new ServerInterceptor() {
            @Override
            public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
                    ServerCall<ReqT, RespT> call,
                    Metadata headers,
                    ServerCallHandler<ReqT, RespT> next) {

                // The JwtGrpcAuthenticationReader will have already extracted the token
                // and Spring Security will have attempted authentication.
                // We just need to check if it succeeded and populate the gRPC context.

                Authentication authentication =
                        SecurityContextHolder.getContext().getAuthentication();

                if (authentication != null && authentication.isAuthenticated()) {
                    UserDetails userDetails = (UserDetails) authentication.getPrincipal();

                    Context newContext =
                            Context.current()
                                    .withValue(GRPC_USER_ID_CONTEXT_KEY, userDetails.getUsername())
                                    .withValue(
                                            GRPC_USERNAME_CONTEXT_KEY, userDetails.getUsername());

                    return Contexts.interceptCall(newContext, call, headers, next);
                } else {
                    // If not authenticated, proceed without authentication context
                    return Contexts.interceptCall(Context.current(), call, headers, next);
                }
            }
        };
    }
}
