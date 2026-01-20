# Stage 1: Build the application using Maven
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
# Copy the pom.xml and download dependencies
COPY services/users/auth-service/pom.xml ./services/users/auth-service/pom.xml
# Set WORKDIR again to operate within the service's directory
WORKDIR /app/services/users/auth-service
RUN mvn dependency:go-offline -Dmaven.wagon.http.readTimeout=120000

# Copy the rest of the source code and build the application
COPY services/users/auth-service/src ./src
RUN mvn clean install -DskipTests -Dmaven.wagon.http.readTimeout=120000

# Stage 2: Create the final, lightweight container
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# Copy the built JAR file from the 'build' stage
COPY --from=build /app/services/users/auth-service/target/auth-service-0.0.1-SNAPSHOT.jar .
EXPOSE 8080
# Command to run the application
ENTRYPOINT ["java", "-jar", "auth-service-0.0.1-SNAPSHOT.jar"]