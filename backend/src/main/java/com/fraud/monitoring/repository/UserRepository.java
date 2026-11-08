package com.fraud.monitoring.repository;

import com.fraud.monitoring.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    List<User> findAllByOrderByCreatedAtDesc();
    long countByActiveTrue();
    long countByActiveFalse();
    long countByRole(String role);
    long countByCreatedAtAfter(LocalDateTime time);
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    long countByLastActivityAtAfter(LocalDateTime time);
    long countBySessionStatus(String sessionStatus);
    long countByAccountStatus(String accountStatus);
    long countByAuthProvider(String authProvider);
    List<User> findByLastActivityAtAfterOrderByLastActivityAtDesc(LocalDateTime time);
}
