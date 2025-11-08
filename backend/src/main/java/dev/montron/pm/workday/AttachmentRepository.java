package dev.montron.pm.workday;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttachmentRepository extends JpaRepository<AttachmentEntity, UUID> {

    void deleteByWorkdayAndSourceSubmissionId(WorkdayEntity workday, UUID sourceSubmissionId);

    List<AttachmentEntity> findByWorkday(WorkdayEntity workday);
}
