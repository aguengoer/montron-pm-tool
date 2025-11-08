package dev.montron.pm.workday;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.montron.pm.common.CurrentUser;
import dev.montron.pm.common.CurrentUserService;
import dev.montron.pm.employees.EmployeeEntity;
import dev.montron.pm.workday.validation.ValidationIssueEntity;
import dev.montron.pm.workday.validation.ValidationIssueRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WorkdayService {

    private static final Logger log = LoggerFactory.getLogger(WorkdayService.class);

    private final CurrentUserService currentUserService;
    private final WorkdayRepository workdayRepository;
    private final TbEntryRepository tbEntryRepository;
    private final RsEntryRepository rsEntryRepository;
    private final AttachmentRepository attachmentRepository;
    private final StreetwatchDayRepository streetwatchDayRepository;
    private final StreetwatchEntryRepository streetwatchEntryRepository;
    private final ValidationIssueRepository validationIssueRepository;
    private final ObjectMapper objectMapper;

    public WorkdayService(
            CurrentUserService currentUserService,
            WorkdayRepository workdayRepository,
            TbEntryRepository tbEntryRepository,
            RsEntryRepository rsEntryRepository,
            AttachmentRepository attachmentRepository,
            StreetwatchDayRepository streetwatchDayRepository,
            StreetwatchEntryRepository streetwatchEntryRepository,
            ValidationIssueRepository validationIssueRepository,
            ObjectMapper objectMapper) {
        this.currentUserService = currentUserService;
        this.workdayRepository = workdayRepository;
        this.tbEntryRepository = tbEntryRepository;
        this.rsEntryRepository = rsEntryRepository;
        this.attachmentRepository = attachmentRepository;
        this.streetwatchDayRepository = streetwatchDayRepository;
        this.streetwatchEntryRepository = streetwatchEntryRepository;
        this.validationIssueRepository = validationIssueRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<WorkdaySummaryDto> getWorkdaysForEmployee(UUID employeeId, LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "from and to must be provided");
        }
        if (from.isAfter(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "from must be before to");
        }

        CurrentUser user = currentUserService.getCurrentUser();
        UUID companyId = user.companyId();

        List<WorkdayEntity> workdays = workdayRepository
                .findByCompanyIdAndEmployee_IdAndWorkDateBetweenOrderByWorkDateAsc(companyId, employeeId, from, to);

        return workdays.stream()
                .map(this::toSummaryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public WorkdayDetailDto getWorkdayDetail(UUID workdayId) {
        CurrentUser user = currentUserService.getCurrentUser();
        UUID companyId = user.companyId();

        WorkdayEntity workday = workdayRepository.findByIdAndCompanyId(workdayId, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workday not found"));

        WorkdayEmployeeDto employeeDto = toEmployeeDto(workday.getEmployee());
        TbDto tbDto = tbEntryRepository.findByWorkday(workday).map(this::toTbDto).orElse(null);
        RsDto rsDto = rsEntryRepository.findByWorkday(workday).map(this::toRsDto).orElse(null);
        StreetwatchDto streetwatchDto = streetwatchDayRepository.findByWorkday(workday)
                .map(day -> new StreetwatchDto(
                        day.getLicensePlate(),
                        day.getSwDate(),
                        streetwatchEntryRepository.findByStreetwatchDayOrderByTimeAsc(day).stream()
                                .map(this::toStreetwatchEntryDto)
                                .toList()))
                .orElse(null);

        List<AttachmentDto> attachments = attachmentRepository.findByWorkday(workday).stream()
                .map(this::toAttachmentDto)
                .toList();

        List<ValidationIssueDto> validationIssues = validationIssueRepository.findByWorkday(workday).stream()
                .map(this::toValidationDto)
                .toList();

        return new WorkdayDetailDto(
                workday.getId(),
                workday.getWorkDate(),
                workday.getStatus(),
                employeeDto,
                tbDto,
                rsDto,
                streetwatchDto,
                attachments,
                validationIssues);
    }

    private WorkdaySummaryDto toSummaryDto(WorkdayEntity entity) {
        return new WorkdaySummaryDto(
                entity.getId(),
                entity.getWorkDate(),
                entity.getStatus(),
                entity.isHasTb(),
                entity.isHasRs(),
                entity.isHasStreetwatch());
    }

    private WorkdayEmployeeDto toEmployeeDto(EmployeeEntity employee) {
        return new WorkdayEmployeeDto(
                employee.getId(),
                employee.getUsername(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getDepartment());
    }

    private TbDto toTbDto(TbEntryEntity tb) {
        Map<String, Object> extra = parseJsonMap(tb.getExtra());
        return new TbDto(
                tb.getId(),
                tb.getSourceSubmissionId(),
                tb.getStartTime(),
                tb.getEndTime(),
                tb.getBreakMinutes(),
                tb.getTravelMinutes(),
                tb.getLicensePlate(),
                tb.getDepartment(),
                tb.getOvernight(),
                tb.getKmStart(),
                tb.getKmEnd(),
                tb.getComment(),
                extra,
                tb.getVersion());
    }

    private RsDto toRsDto(RsEntryEntity rs) {
        List<RsPositionDto> positions = parsePositions(rs.getPositions());
        return new RsDto(
                rs.getId(),
                rs.getSourceSubmissionId(),
                rs.getCustomerId(),
                rs.getCustomerName(),
                rs.getStartTime(),
                rs.getEndTime(),
                rs.getBreakMinutes(),
                positions,
                rs.getPdfObjectKey(),
                rs.getVersion());
    }

    private StreetwatchEntryDto toStreetwatchEntryDto(StreetwatchEntryEntity entry) {
        BigDecimal lat = entry.getLat();
        BigDecimal lon = entry.getLon();
        return new StreetwatchEntryDto(entry.getTime(), entry.getKm(), lat, lon);
    }

    private AttachmentDto toAttachmentDto(AttachmentEntity attachment) {
        return new AttachmentDto(
                attachment.getId(),
                attachment.getKind(),
                attachment.getFilename(),
                attachment.getS3Key(),
                attachment.getBytes(),
                attachment.getSourceSubmissionId());
    }

    private ValidationIssueDto toValidationDto(ValidationIssueEntity issue) {
        Map<String, Object> delta = parseJsonMap(issue.getDelta());
        return new ValidationIssueDto(
                issue.getId(),
                issue.getCode(),
                issue.getSeverity(),
                issue.getMessage(),
                issue.getFieldRef(),
                delta);
    }

    private Map<String, Object> parseJsonMap(String json) {
        if (!StringUtils.hasText(json)) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception ex) {
            log.warn("Failed to parse JSON map field: {}", json, ex);
            return Collections.emptyMap();
        }
    }

    private List<RsPositionDto> parsePositions(String json) {
        if (!StringUtils.hasText(json)) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<RsPositionDto>>() {});
        } catch (Exception ex) {
            log.warn("Failed to parse RS positions JSON: {}", json, ex);
            return Collections.emptyList();
        }
    }
}
