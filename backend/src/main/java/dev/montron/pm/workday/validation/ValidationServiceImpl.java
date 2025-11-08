package dev.montron.pm.workday.validation;

import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ValidationServiceImpl implements ValidationService {

    private static final Logger log = LoggerFactory.getLogger(ValidationServiceImpl.class);

    @Override
    public void recalculateForWorkday(UUID workdayId) {
        log.debug("TODO: recalculate validation issues for workday {}", workdayId);
    }
}
