package com.community.users.authservice.infrastructure.security;

import io.grpc.Metadata;
import io.grpc.ServerCall;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.security.authentication.GrpcAuthenticationReader;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.BearerTokenAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class JwtGrpcAuthenticationReader implements GrpcAuthenticationReader {
    private static final String AUTHORIZATION_HEADER_KEY = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    @Override
    public Authentication readAuthentication(ServerCall<?, ?> call, Metadata headers) {
        String authHeader =
                headers.get(
                        Metadata.Key.of(
                                AUTHORIZATION_HEADER_KEY, Metadata.ASCII_STRING_MARSHALLER));

        if (Objects.isNull(authHeader)) {
            log.trace("No Authorization header found in gRPC metadata");
            return null;
        }

        if (!authHeader.startsWith(BEARER_PREFIX)) {
            log.trace("Authorization header does not start with Bearer prefix.");
            return null;
        }

        String token = authHeader.substring(BEARER_PREFIX.length()).trim();
        if (token.isEmpty()) {
            log.warn("Bearer token is empty after trimming");
            return null;
        }

        log.debug("Found bearer token in gRPC metadata.");
        return new BearerTokenAuthenticationToken(token);
    }
}
