package com.community.users.authservice.config;

import com.community.users.authservice.infrastructure.security.JWTService;
import io.grpc.Context;
import io.grpc.Contexts;
import io.grpc.Metadata;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.ServerInterceptor;
import io.grpc.Status;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.interceptor.GrpcGlobalServerInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.util.StringUtils;

@Configuration
@RequiredArgsConstructor
public class GrpcSecurityConfig {

    private final UserDetailsService userDetailsService;
    private final JWTService jwtService;

    public static final Context.Key<String> GRPC_USER_ID_CONTEXT_KEY = Context.key("grpc-user-id");
    public static final Context.Key<String> GRPC_USERNAME_CONTEXT_KEY =
            Context.key("grpc-username");

    @GrpcGlobalServerInterceptor
    public ServerInterceptor grpcAuthenticationInterceptor() {
        return new ServerInterceptor() {
            @Override
            public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
                    ServerCall<ReqT, RespT> call,
                    Metadata headers,
                    ServerCallHandler<ReqT, RespT> next) {

                String authorizationHeader =
                        headers.get(
                                Metadata.Key.of("Authorization", Metadata.ASCII_STRING_MARSHALLER));

                if (!StringUtils.hasText(authorizationHeader)
                        || !authorizationHeader.startsWith("Bearer ")) {
                    // For now, allow unauthenticated access for some services, but reject
                    // explicitly for protected ones
                    // A proper security config would differentiate based on method.
                    return Contexts.interceptCall(Context.current(), call, headers, next);
                }

                String jwt = authorizationHeader.substring(7);
                try {
                    String username = jwtService.extractUsername(jwt);
                    if (username != null) {
                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                        if (jwtService.isTokenValid(jwt, userDetails)) {
                            // Authentication successful
                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(
                                            userDetails, null, userDetails.getAuthorities());
                            SecurityContextHolder.getContext().setAuthentication(authentication);

                            // Attach user info to gRPC context for downstream use
                            Context newContext =
                                    Context.current()
                                            .withValue(
                                                    GRPC_USER_ID_CONTEXT_KEY,
                                                    userDetails
                                                            .getUsername()) // Assuming username is
                                            // ID or you have
                                            // a custom UserDetails
                                            .withValue(
                                                    GRPC_USERNAME_CONTEXT_KEY,
                                                    userDetails
                                                            .getUsername()); // Assuming username is
                            // display name

                            return Contexts.interceptCall(newContext, call, headers, next);
                        }
                    }
                } catch (UsernameNotFoundException | io.jsonwebtoken.JwtException e) {
                    call.close(
                            Status.UNAUTHENTICATED.withDescription(
                                    "Invalid or expired JWT: " + e.getMessage()),
                            headers);
                    return new ServerCall.Listener<ReqT>() {}; // Return a no-op listener
                } catch (Exception e) {
                    call.close(
                            Status.INTERNAL.withDescription(
                                    "Authentication internal error: " + e.getMessage()),
                            headers);
                    return new ServerCall.Listener<ReqT>() {};
                }

                call.close(
                        Status.UNAUTHENTICATED.withDescription("Authentication failed"), headers);
                return new ServerCall.Listener<ReqT>() {};
            }
        };
    }
}
