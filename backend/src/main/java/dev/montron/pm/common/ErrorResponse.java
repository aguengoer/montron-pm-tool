package dev.montron.pm.common;

import java.util.List;

public record ErrorResponse(
        String type,
        String title,
        int status,
        String detail,
        List<ValidationError> errors) {

    public static ErrorResponse badRequest(String detail, List<ValidationError> errors) {
        return new ErrorResponse("about:blank", "Bad Request", 400, detail, errors);
    }

    public record ValidationError(String field, String message) {}
}
