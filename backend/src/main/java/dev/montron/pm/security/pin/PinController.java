package dev.montron.pm.security.pin;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

/**
 * REST controller for PIN management.
 * Users must set a PIN before they can release workdays.
 */
@RestController
@RequestMapping("/api/users/me/pin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "PIN Management", description = "User PIN setup and verification for release operations")
public class PinController {

    private final PinService pinService;

    public PinController(PinService pinService) {
        this.pinService = pinService;
    }

    /**
     * Set or update PIN for current user
     */
    @PostMapping
    @Operation(summary = "Set or update PIN", description = "Creates or updates the 4-digit PIN for the current user")
    public ResponseEntity<MessageResponse> setPin(@RequestBody SetPinRequest request) {
        try {
            pinService.setPin(request.pin());
            return ResponseEntity.ok(new MessageResponse("PIN erfolgreich gesetzt"));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(new MessageResponse(e.getReason()));
        }
    }

    /**
     * Verify PIN for current user
     */
    @PostMapping("/verify")
    @Operation(summary = "Verify PIN", description = "Verifies the provided PIN. Rate-limited: 3 attempts then 30min lock.")
    public ResponseEntity<MessageResponse> verifyPin(@RequestBody VerifyPinRequest request) {
        try {
            pinService.verifyPinForCurrentUser(request.pin());
            return ResponseEntity.ok(new MessageResponse("PIN korrekt"));
        } catch (PinService.PinLockedException e) {
            return ResponseEntity.status(HttpStatus.LOCKED)
                    .body(new MessageResponse(e.getReason(), e.getLockedUntil()));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(new MessageResponse(e.getReason()));
        }
    }

    /**
     * Get PIN status for current user
     */
    @GetMapping("/status")
    @Operation(summary = "Get PIN status", description = "Returns whether PIN is set, locked, and attempt count")
    public ResponseEntity<PinStatusResponse> getPinStatus() {
        PinService.PinStatus status = pinService.getPinStatus();
        return ResponseEntity.ok(new PinStatusResponse(
                status.isSet(),
                status.isLocked(),
                status.lockedUntil(),
                status.failedAttempts()
        ));
    }

    // Request/Response DTOs

    public record SetPinRequest(String pin) {}

    public record VerifyPinRequest(String pin) {}

    public record MessageResponse(String message, Instant lockedUntil) {
        public MessageResponse(String message) {
            this(message, null);
        }
    }

    public record PinStatusResponse(
            boolean isSet,
            boolean isLocked,
            Instant lockedUntil,
            int failedAttempts
    ) {}
}

