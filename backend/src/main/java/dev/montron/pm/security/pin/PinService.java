package dev.montron.pm.security.pin;

import dev.montron.pm.common.CurrentUser;
import dev.montron.pm.common.CurrentUserService;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PinService {

    private static final Logger log = LoggerFactory.getLogger(PinService.class);
    private static final int MAX_FAILED_ATTEMPTS = 3;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(30);

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
        if (pin == null || !pin.matches("^\\d{4}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PIN muss genau 4 Ziffern enthalten");
        }

        CurrentUser currentUser = currentUserService.getCurrentUser();
        UUID companyId = currentUser.companyId();
        UUID userId = currentUser.userId();

        UserPinEntity userPin = userPinRepository
                .findByCompanyIdAndUserId(companyId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kein PIN gesetzt. Bitte zuerst PIN einrichten."));

        Instant now = Instant.now();
        
        // Check if locked
        if (userPin.getLockedUntil() != null && userPin.getLockedUntil().isAfter(now)) {
            log.warn("PIN verification attempted while locked for user {}", userId);
            throw new PinLockedException("PIN gesperrt aufgrund zu vieler Fehlversuche. Bitte später erneut versuchen.", userPin.getLockedUntil());
        }

        // Clear lock if expired
        if (userPin.getLockedUntil() != null && now.isAfter(userPin.getLockedUntil())) {
            userPin.setLockedUntil(null);
            userPin.setFailedAttempts(0);
        }

        boolean matches = passwordEncoder.matches(pin, userPin.getPinHash());
        if (!matches) {
            int newAttempts = userPin.getFailedAttempts() + 1;
            userPin.setFailedAttempts(newAttempts);
            
            if (newAttempts >= MAX_FAILED_ATTEMPTS) {
                Instant lockUntil = now.plus(LOCK_DURATION);
                userPin.setLockedUntil(lockUntil);
                userPinRepository.save(userPin);
                log.warn("PIN locked for user {} until {} after {} failed attempts", userId, lockUntil, newAttempts);
                throw new PinLockedException("Zu viele Fehlversuche. PIN gesperrt für 30 Minuten.", lockUntil);
            } else {
                userPinRepository.save(userPin);
                int remainingAttempts = MAX_FAILED_ATTEMPTS - newAttempts;
                log.warn("Failed PIN verification for user {}. Remaining attempts: {}", userId, remainingAttempts);
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "PIN ungültig. Noch " + remainingAttempts + " Versuche übrig.");
            }
        }

        userPin.setFailedAttempts(0);
        userPin.setLockedUntil(null);
        userPinRepository.save(userPin);
        log.info("PIN verified successfully for user {}", userId);
    }

    /**
     * Set or update PIN for the current user
     */
    @Transactional
    public void setPin(String pin) {
        if (pin == null || !pin.matches("^\\d{4}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PIN muss genau 4 Ziffern enthalten");
        }

        CurrentUser currentUser = currentUserService.getCurrentUser();
        UUID userId = currentUser.userId();
        UUID companyId = currentUser.companyId();

        UserPinEntity userPin = userPinRepository.findByCompanyIdAndUserId(companyId, userId)
                .orElse(new UserPinEntity());

        userPin.setUserId(userId);
        userPin.setCompanyId(companyId);
        userPin.setPinHash(passwordEncoder.encode(pin));
        userPin.setFailedAttempts(0);
        userPin.setLockedUntil(null);

        userPinRepository.save(userPin);
        log.info("PIN set/updated for user {} in company {}", userId, companyId);
    }

    /**
     * Check if current user has a PIN set
     */
    @Transactional(readOnly = true)
    public PinStatus getPinStatus() {
        CurrentUser currentUser = currentUserService.getCurrentUser();
        UUID userId = currentUser.userId();
        UUID companyId = currentUser.companyId();

        UserPinEntity userPin = userPinRepository.findByCompanyIdAndUserId(companyId, userId)
                .orElse(null);

        if (userPin == null) {
            return new PinStatus(false, false, null, 0);
        }

        boolean isLocked = userPin.getLockedUntil() != null && Instant.now().isBefore(userPin.getLockedUntil());

        return new PinStatus(
                true,
                isLocked,
                userPin.getLockedUntil(),
                userPin.getFailedAttempts()
        );
    }

    // DTOs
    public record PinStatus(
            boolean isSet,
            boolean isLocked,
            Instant lockedUntil,
            int failedAttempts
    ) {}

    // Custom exception for locked PIN
    public static class PinLockedException extends ResponseStatusException {
        private final Instant lockedUntil;

        public PinLockedException(String message, Instant lockedUntil) {
            super(HttpStatus.LOCKED, message);
            this.lockedUntil = lockedUntil;
        }

        public Instant getLockedUntil() {
            return lockedUntil;
        }
    }
}
