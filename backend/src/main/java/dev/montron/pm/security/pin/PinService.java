package dev.montron.pm.security.pin;

import dev.montron.pm.common.CurrentUser;
import dev.montron.pm.common.CurrentUserService;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PinService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(10);

    private final UserPinRepository userPinRepository;
    private final CurrentUserService currentUserService;
    private final PasswordEncoder passwordEncoder;

    public PinService(
            UserPinRepository userPinRepository,
            CurrentUserService currentUserService,
            PasswordEncoder passwordEncoder) {
        this.userPinRepository = userPinRepository;
        this.currentUserService = currentUserService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void verifyPinForCurrentUser(String pin) {
        if (pin == null || pin.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PIN is required");
        }

        CurrentUser currentUser = currentUserService.getCurrentUser();
        UUID companyId = currentUser.companyId();
        UUID userId = currentUser.userId();

        UserPinEntity userPin = userPinRepository
                .findByCompanyIdAndUserId(companyId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No PIN configured for current user"));

        Instant now = Instant.now();
        if (userPin.getLockedUntil() != null && userPin.getLockedUntil().isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.LOCKED, "PIN locked due to too many failed attempts. Try again later.");
        }

        boolean matches = passwordEncoder.matches(pin, userPin.getPinHash());
        if (!matches) {
            int failed = userPin.getFailedAttempts() + 1;
            userPin.setFailedAttempts(failed);
            if (failed >= MAX_FAILED_ATTEMPTS) {
                userPin.setLockedUntil(now.plus(LOCK_DURATION));
            }
            userPinRepository.save(userPin);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid PIN");
        }

        userPin.setFailedAttempts(0);
        userPin.setLockedUntil(null);
        userPinRepository.save(userPin);
    }
}
