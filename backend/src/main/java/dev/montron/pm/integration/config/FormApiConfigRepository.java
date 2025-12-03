package dev.montron.pm.integration.config;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FormApiConfigRepository extends JpaRepository<FormApiConfigEntity, UUID> {
    Optional<FormApiConfigEntity> findByCompanyId(UUID companyId);
}

