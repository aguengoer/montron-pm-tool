package dev.montron.pm.setup;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InstallationStateRepository extends JpaRepository<InstallationState, String> {
    Optional<InstallationState> findById(String id);
}

