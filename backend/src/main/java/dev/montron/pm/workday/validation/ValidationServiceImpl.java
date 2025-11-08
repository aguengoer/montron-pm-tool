package dev.montron.pm.workday.validation;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.montron.pm.common.CurrentUser;
import dev.montron.pm.common.CurrentUserService;
import dev.montron.pm.workday.RsEntryEntity;
import dev.montron.pm.workday.RsEntryRepository;
import dev.montron.pm.workday.StreetwatchDayEntity;
import dev.montron.pm.workday.StreetwatchDayRepository;
import dev.montron.pm.workday.StreetwatchEntryEntity;
import dev.montron.pm.workday.StreetwatchEntryRepository;
import dev.montron.pm.workday.TbEntryEntity;
import dev.montron.pm.workday.TbEntryRepository;
import dev.montron.pm.workday.WorkdayEntity;
import dev.montron.pm.workday.WorkdayRepository;
import java.time.Duration;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ValidationServiceImpl implements ValidationService {

    private static final Logger log = LoggerFactory.getLogger(ValidationServiceImpl.class);

    private final CurrentUserService currentUserService;
    private final WorkdayRepository workdayRepository;
    private final TbEntryRepository tbEntryRepository;
    private final RsEntryRepository rsEntryRepository;
    private final StreetwatchDayRepository streetwatchDayRepository;
    private final StreetwatchEntryRepository streetwatchEntryRepository;
    private final ValidationIssueRepository validationIssueRepository;
    private final ObjectMapper objectMapper;

    public ValidationServiceImpl(
            CurrentUserService currentUserService,
            WorkdayRepository workdayRepository,
            TbEntryRepository tbEntryRepository,
            RsEntryRepository rsEntryRepository,
            StreetwatchDayRepository streetwatchDayRepository,
            StreetwatchEntryRepository streetwatchEntryRepository,
            ValidationIssueRepository validationIssueRepository,
            ObjectMapper objectMapper) {
        this.currentUserService = currentUserService;
        this.workdayRepository = workdayRepository;
        this.tbEntryRepository = tbEntryRepository;
        this.rsEntryRepository = rsEntryRepository;
        this.streetwatchDayRepository = streetwatchDayRepository;
        this.streetwatchEntryRepository = streetwatchEntryRepository;
        this.validationIssueRepository = validationIssueRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void recalculateForWorkday(UUID workdayId) {
        CurrentUser user = currentUserService.getCurrentUser();
        UUID companyId = user.companyId();

        WorkdayEntity workday = workdayRepository.findByIdAndCompanyId(workdayId, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workday not found"));

        validationIssueRepository.deleteByWorkday(workday);

        Optional<TbEntryEntity> tbOpt = tbEntryRepository.findByWorkday(workday);
        Optional<RsEntryEntity> rsOpt = rsEntryRepository.findByWorkday(workday);
        Optional<StreetwatchDayEntity> swDayOpt = streetwatchDayRepository.findByWorkday(workday);
        List<StreetwatchEntryEntity> swEntries = swDayOpt
                .map(day -> streetwatchEntryRepository.findByStreetwatchDayOrderByTimeAsc(day))
                .orElse(List.of());

        tbOpt.ifPresent(tb -> validateRaster(tb.getStartTime(), "tb.startTime", workday));
        tbOpt.ifPresent(tb -> validateRaster(tb.getEndTime(), "tb.endTime", workday));
        rsOpt.ifPresent(rs -> validateRaster(rs.getStartTime(), "rs.startTime", workday));
        rsOpt.ifPresent(rs -> validateRaster(rs.getEndTime(), "rs.endTime", workday));

        if (tbOpt.isPresent() && !swEntries.isEmpty()) {
            validateTbVsStreetwatch(tbOpt.get(), swEntries, workday);
        }

        if (tbOpt.isPresent() && rsOpt.isPresent()) {
            validateTbVsRs(tbOpt.get(), rsOpt.get(), workday);
        }

        // TODO: validateAddress(tbOpt, swEntries, workday);
    }

    private void validateTbVsStreetwatch(TbEntryEntity tb, List<StreetwatchEntryEntity> streetwatchEntries, WorkdayEntity workday) {
        Integer tbMinutes = computeTbWorkMinutes(tb);
        Integer swMinutes = computeStreetwatchMinutes(streetwatchEntries);
        if (tbMinutes == null || swMinutes == null) {
            return;
        }
        int diff = Math.abs(tbMinutes - swMinutes);
        if (diff < 15) {
            return;
        }
        String severity = diff < 30 ? "WARN" : "ERROR";
        Map<String, Object> delta = Map.of(
                "tbMinutes", tbMinutes,
                "streetwatchMinutes", swMinutes,
                "differenceMinutes", diff);
        createIssue(workday,
                "TB_SW_TIME_DIFF",
                severity,
                "Difference between TB and Streetwatch working time is %d minutes".formatted(diff),
                "tb.totalTime",
                delta);
    }

    private void validateTbVsRs(TbEntryEntity tb, RsEntryEntity rs, WorkdayEntity workday) {
        if (tb.getStartTime() != null && rs.getStartTime() != null && !tb.getStartTime().equals(rs.getStartTime())) {
            Map<String, Object> delta = Map.of(
                    "tbStartTime", tb.getStartTime().toString(),
                    "rsStartTime", rs.getStartTime().toString());
            createIssue(workday,
                    "TB_RS_START_MISMATCH",
                    "WARN",
                    "TB and RS start time differ",
                    "tb.startTime",
                    delta);
        }

        if (tb.getEndTime() != null && rs.getEndTime() != null && !tb.getEndTime().equals(rs.getEndTime())) {
            Map<String, Object> delta = Map.of(
                    "tbEndTime", tb.getEndTime().toString(),
                    "rsEndTime", rs.getEndTime().toString());
            createIssue(workday,
                    "TB_RS_END_MISMATCH",
                    "WARN",
                    "TB and RS end time differ",
                    "tb.endTime",
                    delta);
        }

        if (tb.getBreakMinutes() != null && rs.getBreakMinutes() != null
                && !Objects.equals(tb.getBreakMinutes(), rs.getBreakMinutes())) {
            Map<String, Object> delta = Map.of(
                    "tbBreakMinutes", tb.getBreakMinutes(),
                    "rsBreakMinutes", rs.getBreakMinutes());
            createIssue(workday,
                    "TB_RS_BREAK_MISMATCH",
                    "WARN",
                    "TB and RS break minutes differ",
                    "tb.breakMinutes",
                    delta);
        }
    }

    private Integer computeTbWorkMinutes(TbEntryEntity tb) {
        if (tb.getStartTime() == null || tb.getEndTime() == null) {
            return null;
        }
        long minutes = Duration.between(tb.getStartTime(), tb.getEndTime()).toMinutes();
        if (tb.getBreakMinutes() != null) {
            minutes -= tb.getBreakMinutes();
        }
        if (minutes < 0) {
            return null;
        }
        return (int) minutes;
    }

    private Integer computeStreetwatchMinutes(List<StreetwatchEntryEntity> entries) {
        if (entries == null || entries.isEmpty()) {
            return null;
        }
        LocalTime first = entries.get(0).getTime();
        LocalTime last = entries.get(entries.size() - 1).getTime();
        if (first == null || last == null) {
            return null;
        }
        long minutes = Duration.between(first, last).toMinutes();
        if (minutes < 0) {
            return null;
        }
        return (int) minutes;
    }

    private void validateRaster(LocalTime time, String fieldRef, WorkdayEntity workday) {
        if (time == null) {
            return;
        }
        int minutes = time.getMinute();
        if (minutes % 15 != 0) {
            Map<String, Object> delta = Map.of(
                    "minutes", minutes,
                    "nearestQuarter", (minutes / 15) * 15);
            createIssue(workday,
                    "RASTER_MISMATCH",
                    "WARN",
                    "Time is not aligned to 15-minute raster",
                    fieldRef,
                    delta);
        }
    }

    private void createIssue(
            WorkdayEntity workday,
            String code,
            String severity,
            String message,
            String fieldRef,
            Map<String, Object> delta) {
        ValidationIssueEntity issue = new ValidationIssueEntity();
        issue.setWorkday(workday);
        issue.setCode(code);
        issue.setSeverity(severity);
        issue.setMessage(message);
        issue.setFieldRef(fieldRef);
        try {
            issue.setDelta(delta == null || delta.isEmpty() ? null : objectMapper.writeValueAsString(delta));
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize validation delta", e);
            issue.setDelta(null);
        }
        validationIssueRepository.save(issue);
    }
}
