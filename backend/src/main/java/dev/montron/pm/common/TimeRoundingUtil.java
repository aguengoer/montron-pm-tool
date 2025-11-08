package dev.montron.pm.common;

import java.time.LocalTime;

public final class TimeRoundingUtil {

    private TimeRoundingUtil() {
    }

    public static LocalTime roundTo15Minutes(LocalTime time) {
        if (time == null) {
            return null;
        }

        int totalMinutes = time.getHour() * 60 + time.getMinute();
        int roundedMinutes = (int) Math.round(totalMinutes / 15.0) * 15;
        int maxMinutes = 23 * 60 + 45;
        if (roundedMinutes > maxMinutes) {
            roundedMinutes = maxMinutes;
        }
        if (roundedMinutes < 0) {
            roundedMinutes = 0;
        }

        int hour = roundedMinutes / 60;
        int minute = roundedMinutes % 60;
        return LocalTime.of(hour, minute, 0, 0);
    }
}
