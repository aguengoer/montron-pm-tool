package dev.montron.pm.submissions;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubmissionFieldCorrectionRepository extends JpaRepository<SubmissionFieldCorrection, UUID> {

    /**
     * Find all corrections for a specific submission
     */
    List<SubmissionFieldCorrection> findBySubmissionId(UUID submissionId);

    /**
     * Find a specific correction for a submission and field
     */
    Optional<SubmissionFieldCorrection> findBySubmissionIdAndFieldId(UUID submissionId, String fieldId);

    /**
     * Delete all corrections for a submission
     */
    void deleteBySubmissionId(UUID submissionId);
}

