# Stage 1: Build stage
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .

RUN mvn dependency:go-offline

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Stage 2: Production stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy the built JAR file from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Create non-root user for security
RUN addgroup -S appuser && adduser -S appuser -G appuser
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]
