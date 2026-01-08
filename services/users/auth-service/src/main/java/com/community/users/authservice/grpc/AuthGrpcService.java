package com.community.users.authservice.grpc;

import auth_service.AuthServiceGrpc;
import auth_service.AuthServiceOuterClass.ValidateTokenRequest;
import auth_service.AuthServiceOuterClass.ValidateTokenResponse;
import com.community.users.authservice.application.service.AuthService;
import com.community.users.authservice.domain.model.Role;
import com.community.users.authservice.domain.model.User;
import io.grpc.stub.StreamObserver;
import java.util.stream.Collectors;
import net.devh.boot.grpc.server.service.GrpcService;
import org.springframework.beans.factory.annotation.Autowired;

@GrpcService
public class AuthGrpcService extends AuthServiceGrpc.AuthServiceImplBase {

    private final AuthService authService;

    @Autowired
    public AuthGrpcService(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public void validateToken(
            ValidateTokenRequest request, StreamObserver<ValidateTokenResponse> responseObserver) {
        try {
            User user = authService.validateToken(request.getToken());

            ValidateTokenResponse response =
                    ValidateTokenResponse.newBuilder()
                            .setIsValid(true)
                            .setUserId(user.getId().toString())
                            .setUserName(user.getUsername())
                            .addAllRoles(
                                    user.getRoles().stream()
                                            .map(Role::name)
                                            .collect(Collectors.toList()))
                            .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();

        } catch (Exception e) {
            ValidateTokenResponse response =
                    ValidateTokenResponse.newBuilder().setIsValid(false).build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        }
    }
}
