package dev.montron.pm.storage;

import dev.montron.pm.employees.EmployeeEntity;
import dev.montron.pm.workday.AttachmentEntity;
import dev.montron.pm.workday.WorkdayEntity;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class StorageService {

    private final ExportProperties exportProperties;

    public StorageService(ExportProperties exportProperties) {
        this.exportProperties = exportProperties;
    }

    public Path exportWorkdayFiles(
            WorkdayEntity workday,
            EmployeeEntity employee,
            byte[] tbPdf,
            byte[] rsPdf,
            List<AttachmentEntity> attachments) {
        LocalDate date = workday.getWorkDate();
        String employeeDirName = sanitize(employee.getLastName() + "_" + employee.getFirstName());

        Path base = exportProperties.getBaseDirectory();
        if (base == null) {
            throw new IllegalStateException("pm.export.base-directory is not configured");
        }

        Path targetDir = base
                .resolve(workday.getCompanyId().toString())
                .resolve(employeeDirName)
                .resolve(String.valueOf(date.getYear()))
                .resolve(String.format("%02d", date.getMonthValue()))
                .resolve(date.toString());

        try {
            Files.createDirectories(targetDir);

            if (tbPdf != null) {
                Files.write(targetDir.resolve("TB_" + date + ".pdf"), tbPdf);
            }

            if (rsPdf != null) {
                Files.write(targetDir.resolve("RS_" + date + ".pdf"), rsPdf);
            }

            for (AttachmentEntity attachment : attachments) {
                String fileName = attachment.getFilename() != null ? attachment.getFilename() : attachment.getId() + ".dat";
                Path attachmentPath = targetDir.resolve(sanitize(fileName));
                String placeholder = "Attachment placeholder for S3 key: " + attachment.getS3Key();
                Files.write(attachmentPath, placeholder.getBytes(StandardCharsets.UTF_8));
            }

            return targetDir;
        } catch (IOException e) {
            throw new IllegalStateException("Failed to export workday files", e);
        }
    }

    private String sanitize(String value) {
        return value == null ? "unknown" : value.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
