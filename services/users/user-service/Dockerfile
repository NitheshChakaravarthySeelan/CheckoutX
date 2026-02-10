# Stage 1: Build the application using Maven
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
# Copy the pom.xml and source code
COPY services/users/user-service/pom.xml ./pom.xml
COPY services/users/user-service/src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -B package -DskipTests -Dmaven.wagon.http.readTimeout=120000 -Dmaven.wagon.http.retryHandler.count=5

# Stage 2: Create the final, lightweight container
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
# Copy the built JAR file from the 'build' stage
COPY --from=build /app/target/user-service-0.0.1-SNAPSHOT.jar ./app.jar
EXPOSE 8080
# Command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
