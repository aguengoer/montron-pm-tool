# syntax=docker/dockerfile:1
FROM openjdk:17-jdk-slim AS runtime

WORKDIR /app

COPY target/*.jar app.jar

EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8090/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
