package dev.montron.pm.workday;

import java.time.LocalTime;
import java.util.Map;

public record TbPatchRequest(
        LocalTime startTime,
        LocalTime endTime,
        Integer breakMinutes,
        Integer travelMinutes,
        String licensePlate,
        String department,
        Boolean overnight,
        Integer kmStart,
        Integer kmEnd,
        String comment,
        Map<String, Object> extra) {
}
