package dev.montron.pm.workday.validation;

import java.util.UUID;

public interface ValidationService {

    void recalculateForWorkday(UUID workdayId);
}
