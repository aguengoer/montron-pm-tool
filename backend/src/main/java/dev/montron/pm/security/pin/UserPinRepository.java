package dev.montron.pm.security.pin;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserPinRepository extends JpaRepository<UserPinEntity, UUID> {

    Optional<UserPinEntity> findByCompanyIdAndUserId(UUID companyId, UUID userId);
}
