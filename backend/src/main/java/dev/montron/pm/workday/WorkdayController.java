package dev.montron.pm.workday;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
@PreAuthorize("hasRole('ADMIN')")
public class WorkdayController {

    private final WorkdayService workdayService;
    private final ReleaseService releaseService;
    private final WorkdayPdfService workdayPdfService;

    public WorkdayController(
            WorkdayService workdayService,
            ReleaseService releaseService,
            WorkdayPdfService workdayPdfService) {
        this.workdayService = workdayService;
        this.releaseService = releaseService;
        this.workdayPdfService = workdayPdfService;
    }

    @GetMapping("/api/employees/{employeeId}/workdays")
    public List<WorkdaySummaryDto> listForEmployee(
            @PathVariable UUID employeeId,
            @RequestParam LocalDate from,
            @RequestParam LocalDate to) {
        return workdayService.getWorkdaysForEmployee(employeeId, from, to);
    }

    @GetMapping("/api/workdays/{id}")
    public WorkdayDetailDto getDetail(@PathVariable UUID id) {
        return workdayService.getWorkdayDetail(id);
    }

    @PatchMapping("/api/workdays/{id}/tb")
    public TbDto patchTb(@PathVariable UUID id, @RequestBody TbPatchRequest request) {
        return workdayService.patchTb(id, request);
    }

    @PatchMapping("/api/workdays/{id}/rs")
    public RsDto patchRs(@PathVariable UUID id, @RequestBody RsPatchRequest request) {
        return workdayService.patchRs(id, request);
    }

    @PostMapping("/api/workdays/{id}/release/confirm")
    public ReleaseResponse release(@PathVariable UUID id, @Valid @RequestBody ReleaseRequest request) {
        return releaseService.releaseWorkday(id, request);
    }

    @PostMapping("/api/workdays/{id}/pdf/tb")
    public ResponseEntity<byte[]> generateTbPdf(@PathVariable UUID id) {
        byte[] pdf = workdayPdfService.generateTbPdfForWorkday(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"tb_" + id + ".pdf\"")
                .body(pdf);
    }

    @PostMapping("/api/workdays/{id}/pdf/rs")
    public ResponseEntity<byte[]> generateRsPdf(@PathVariable UUID id) {
        byte[] pdf = workdayPdfService.generateRsPdfForWorkday(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"rs_" + id + ".pdf\"")
                .body(pdf);
    }

    @PostMapping("/api/workdays/{id}/attachments/presign-download")
    public AttachmentPresignResponse presignAttachments(
            @PathVariable UUID id,
            @RequestBody(required = false) AttachmentPresignRequest request) {
        return workdayService.presignAttachments(id, request);
    }
}
