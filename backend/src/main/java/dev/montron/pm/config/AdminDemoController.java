package dev.montron.pm.config;

import dev.montron.pm.common.CurrentUser;
import dev.montron.pm.common.CurrentUserService;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/demo")
public class AdminDemoController {

    private final CurrentUserService currentUserService;

    public AdminDemoController(CurrentUserService currentUserService) {
        this.currentUserService = currentUserService;
    }

    @GetMapping("/admin-only")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> adminOnly() {
        CurrentUser currentUser = currentUserService.getCurrentUser();
        return Map.of(
                "status", "ok",
                "userId", currentUser.userId().toString(),
                "companyId", currentUser.companyId().toString());
    }
}
