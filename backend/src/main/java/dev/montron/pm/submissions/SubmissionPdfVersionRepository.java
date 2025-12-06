package dev.montron.pm.submissions;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubmissionPdfVersionRepository extends JpaRepository<SubmissionPdfVersion, UUID> {

    /**
     * Find the latest PDF version for a submission
     */
    @Query("SELECT p FROM SubmissionPdfVersion p WHERE p.submissionId = :submissionId ORDER BY p.version DESC LIMIT 1")
    Optional<SubmissionPdfVersion> findLatestBySubmissionId(UUID submissionId);

    /**
     * Get the current version number for a submission (0 if no versions exist)
     */
    @Query("SELECT COALESCE(MAX(p.version), 1) FROM SubmissionPdfVersion p WHERE p.submissionId = :submissionId")
    Integer getCurrentVersion(UUID submissionId);
}

