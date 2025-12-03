package dev.montron.pm.setup;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MobileLinkRepository extends JpaRepository<MobileLink, UUID> {
    Optional<MobileLink> findByMobileCompanyId(UUID mobileCompanyId);
    boolean existsByMobileCompanyId(UUID mobileCompanyId);
}

