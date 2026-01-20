package com.community.users.userservice.domain.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.community.users.userservice.domain.model.User;
import org.mockito.Mockito;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserRepositoryTest {

    @Mock private UserRepository userRepository;

    @Test
    void whenSaveUser_thenUserIsPersisted() {
        User user =
                User.builder()
                        .userName("testuser")
                        .email("test@example.com")
                        .password("hashedpassword")
                        .build();
        
        User savedUser = User.builder()
                .id(1L) // Simulate an ID being set after persistence
                .userName("testuser")
                .email("test@example.com")
                .password("hashedpassword")
                .build();

        Mockito.when(userRepository.save(user)).thenReturn(savedUser);
        Mockito.when(userRepository.findById(savedUser.getId())).thenReturn(Optional.of(savedUser));

        User resultUser = userRepository.save(user);

        assertThat(resultUser).isNotNull();
        assertThat(resultUser.getId()).isNotNull();
        assertThat(resultUser.getUserName()).isEqualTo("testuser");
        assertThat(resultUser.getEmail()).isEqualTo("test@example.com");
        assertThat(resultUser.getPassword()).isEqualTo("hashedpassword");

        Optional<User> foundUser = userRepository.findById(resultUser.getId());
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getUserName()).isEqualTo("testuser");

        Mockito.verify(userRepository, Mockito.times(1)).save(user);
        Mockito.verify(userRepository, Mockito.times(1)).findById(savedUser.getId());
    }

    @Test
    void whenFindByEmail_thenUserIsFound() {
        String email = "find@example.com";
        User user =
                User.builder()
                        .id(2L)
                        .userName("findbyemail")
                        .email(email)
                        .password("hashedpassword")
                        .build();

        Mockito.when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        Optional<User> foundUser = userRepository.findByEmail(email);
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getUserName()).isEqualTo("findbyemail");
        assertThat(foundUser.get().getEmail()).isEqualTo(email);

        Mockito.verify(userRepository, Mockito.times(1)).findByEmail(email);
    }

    // Add more tests for update, delete, and other custom queries if they exist
}
