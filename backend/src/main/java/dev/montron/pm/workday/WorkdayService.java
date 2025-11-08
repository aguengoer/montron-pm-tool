package dev.montron.pm.workday;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.montron.pm.audit.AuditService;
import dev.montron.pm.common.CurrentUser;
import dev.montron.pm.common.CurrentUserService;
import dev.montron.pm.common.TimeRoundingUtil;
import dev.montron.pm.employees.EmployeeEntity;
import dev.montron.pm.storage.StorageService;
import dev.montron.pm.workday.validation.ValidationIssueEntity;
import dev.montron.pm.workday.validation.ValidationIssueRepository;
import dev.montron.pm.workday.validation.ValidationService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
    private final ValidationService validationService;
    private final StorageService storageService;
    private final AuditService auditService;
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
            ValidationService validationService,
            StorageService storageService,
            AuditService auditService,
            ObjectMapper objectMapper) {
        this.currentUserService = currentUserService;
        this.workdayRepository = workdayRepository;
        this.tbEntryRepository = tbEntryRepository;
        this.rsEntryRepository = rsEntryRepository;
        this.attachmentRepository = attachmentRepository;
        this.streetwatchDayRepository = streetwatchDayRepository;
        this.streetwatchEntryRepository = streetwatchEntryRepository;
        this.validationIssueRepository = validationIssueRepository;
        this.validationService = validationService;
        this.storageService = storageService;
        this.auditService = auditService;
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

    @Transactional
    public TbDto patchTb(UUID workdayId, TbPatchRequest request) {
        CurrentUser user = currentUserService.getCurrentUser();
        UUID companyId = user.companyId();

        WorkdayEntity workday = workdayRepository.findByIdAndCompanyId(workdayId, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workday not found"));

        TbEntryEntity tb = tbEntryRepository.findByWorkday(workday)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TB entry not found"));

        boolean changed = false;

        if (request.startTime() != null) {
            LocalTime rounded = TimeRoundingUtil.roundTo15Minutes(request.startTime());
            LocalTime oldValue = tb.getStartTime();
            if (!Objects.equals(oldValue, rounded)) {
                tb.setStartTime(rounded);
                auditService.auditChange("TB", tb.getId(), "startTime", oldValue, rounded);
                changed = true;
            }
        }

        if (request.endTime() != null) {
            LocalTime rounded = TimeRoundingUtil.roundTo15Minutes(request.endTime());
            LocalTime oldValue = tb.getEndTime();
            if (!Objects.equals(oldValue, rounded)) {
                tb.setEndTime(rounded);
                auditService.auditChange("TB", tb.getId(), "endTime", oldValue, rounded);
                changed = true;
            }
        }

        if (request.breakMinutes() != null) {
            Integer oldValue = tb.getBreakMinutes();
            if (!Objects.equals(oldValue, request.breakMinutes())) {
                tb.setBreakMinutes(request.breakMinutes());
                auditService.auditChange("TB", tb.getId(), "breakMinutes", oldValue, request.breakMinutes());
                changed = true;
            }
        }

        if (request.travelMinutes() != null) {
            Integer oldValue = tb.getTravelMinutes();
            if (!Objects.equals(oldValue, request.travelMinutes())) {
                tb.setTravelMinutes(request.travelMinutes());
                auditService.auditChange("TB", tb.getId(), "travelMinutes", oldValue, request.travelMinutes());
                changed = true;
            }
        }

        if (request.licensePlate() != null) {
            String oldValue = tb.getLicensePlate();
            if (!Objects.equals(oldValue, request.licensePlate())) {
                tb.setLicensePlate(request.licensePlate());
                auditService.auditChange("TB", tb.getId(), "licensePlate", oldValue, request.licensePlate());
                changed = true;
            }
        }

        if (request.department() != null) {
            String oldValue = tb.getDepartment();
            if (!Objects.equals(oldValue, request.department())) {
                tb.setDepartment(request.department());
                auditService.auditChange("TB", tb.getId(), "department", oldValue, request.department());
                changed = true;
            }
        }

        if (request.overnight() != null) {
            Boolean oldValue = tb.getOvernight();
            if (!Objects.equals(oldValue, request.overnight())) {
                tb.setOvernight(request.overnight());
                auditService.auditChange("TB", tb.getId(), "overnight", oldValue, request.overnight());
                changed = true;
            }
        }

        if (request.kmStart() != null) {
            Integer oldValue = tb.getKmStart();
            if (!Objects.equals(oldValue, request.kmStart())) {
                tb.setKmStart(request.kmStart());
                auditService.auditChange("TB", tb.getId(), "kmStart", oldValue, request.kmStart());
                changed = true;
            }
        }

        if (request.kmEnd() != null) {
            Integer oldValue = tb.getKmEnd();
            if (!Objects.equals(oldValue, request.kmEnd())) {
                tb.setKmEnd(request.kmEnd());
                auditService.auditChange("TB", tb.getId(), "kmEnd", oldValue, request.kmEnd());
                changed = true;
            }
        }

        if (request.comment() != null) {
            String oldValue = tb.getComment();
            if (!Objects.equals(oldValue, request.comment())) {
                tb.setComment(request.comment());
                auditService.auditChange("TB", tb.getId(), "comment", oldValue, request.comment());
                changed = true;
            }
        }

        if (request.extra() != null) {
            Map<String, Object> oldValue = parseJsonMap(tb.getExtra());
            Map<String, Object> newValue = request.extra();
            if (!Objects.equals(oldValue, newValue)) {
                tb.setExtra(writeJson(newValue));
                auditService.auditChange("TB", tb.getId(), "extra", oldValue, newValue);
                changed = true;
            }
        }

        if (changed) {
            Integer currentVersion = tb.getVersion() == null ? 0 : tb.getVersion();
            tb.setVersion(currentVersion + 1);
            tbEntryRepository.save(tb);
            validationService.recalculateForWorkday(workday.getId());
        }

        return toTbDto(tb);
    }

    @Transactional
    public RsDto patchRs(UUID workdayId, RsPatchRequest request) {
        CurrentUser user = currentUserService.getCurrentUser();
        UUID companyId = user.companyId();

        WorkdayEntity workday = workdayRepository.findByIdAndCompanyId(workdayId, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workday not found"));

        RsEntryEntity rs = rsEntryRepository.findByWorkday(workday)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "RS entry not found"));

        boolean changed = false;

        if (request.startTime() != null) {
            LocalTime rounded = TimeRoundingUtil.roundTo15Minutes(request.startTime());
            LocalTime oldValue = rs.getStartTime();
            if (!Objects.equals(oldValue, rounded)) {
                rs.setStartTime(rounded);
                auditService.auditChange("RS", rs.getId(), "startTime", oldValue, rounded);
                changed = true;
            }
        }

        if (request.endTime() != null) {
            LocalTime rounded = TimeRoundingUtil.roundTo15Minutes(request.endTime());
            LocalTime oldValue = rs.getEndTime();
            if (!Objects.equals(oldValue, rounded)) {
                rs.setEndTime(rounded);
                auditService.auditChange("RS", rs.getId(), "endTime", oldValue, rounded);
                changed = true;
            }
        }

        if (request.breakMinutes() != null) {
            Integer oldValue = rs.getBreakMinutes();
            if (!Objects.equals(oldValue, request.breakMinutes())) {
                rs.setBreakMinutes(request.breakMinutes());
                auditService.auditChange("RS", rs.getId(), "breakMinutes", oldValue, request.breakMinutes());
                changed = true;
            }
        }

        if (request.customerId() != null) {
            String oldValue = rs.getCustomerId();
            if (!Objects.equals(oldValue, request.customerId())) {
                rs.setCustomerId(request.customerId());
                auditService.auditChange("RS", rs.getId(), "customerId", oldValue, request.customerId());
                changed = true;
            }
        }

        if (request.customerName() != null) {
            String oldValue = rs.getCustomerName();
            if (!Objects.equals(oldValue, request.customerName())) {
                rs.setCustomerName(request.customerName());
                auditService.auditChange("RS", rs.getId(), "customerName", oldValue, request.customerName());
                changed = true;
            }
        }

        if (request.positions() != null) {
            List<RsPositionDto> oldValue = parsePositions(rs.getPositions());
            List<RsPositionDto> newValue = request.positions();
            if (!Objects.equals(oldValue, newValue)) {
                rs.setPositions(writeJson(newValue));
                auditService.auditChange("RS", rs.getId(), "positions", oldValue, newValue);
                changed = true;
            }
        }

        if (changed) {
            Integer currentVersion = rs.getVersion() == null ? 0 : rs.getVersion();
            rs.setVersion(currentVersion + 1);
            rsEntryRepository.save(rs);
            validationService.recalculateForWorkday(workday.getId());
        }

        return toRsDto(rs);
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

    private String writeJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize value to JSON", e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payload");
        }
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

    @Transactional(readOnly = true)
    public AttachmentPresignResponse presignAttachments(UUID workdayId, AttachmentPresignRequest request) {
        CurrentUser currentUser = currentUserService.getCurrentUser();
        UUID companyId = currentUser.companyId();

        WorkdayEntity workday = workdayRepository.findByIdAndCompanyId(workdayId, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workday not found"));

        List<AttachmentEntity> attachments = attachmentRepository.findByWorkday(workday);

        HashSet<UUID> requestedIds = null;
        if (request != null && request.attachmentIds() != null && !request.attachmentIds().isEmpty()) {
            requestedIds = new HashSet<>(request.attachmentIds());
        }

        LinkedHashMap<UUID, String> urls = new LinkedHashMap<>();
        for (AttachmentEntity attachment : attachments) {
            if (requestedIds != null && !requestedIds.contains(attachment.getId())) {
                continue;
            }
            if (!StringUtils.hasText(attachment.getS3Key())) {
                continue;
            }
            String url = storageService.generatePresignedDownloadUrl(attachment.getS3Key());
            urls.put(attachment.getId(), url);
        }

        return new AttachmentPresignResponse(urls);
    }
}
