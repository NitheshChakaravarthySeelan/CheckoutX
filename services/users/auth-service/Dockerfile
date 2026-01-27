# Stage 1: Build the application using Maven
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app

# Copy shared proto files
COPY shared/proto ./shared/proto

# Copy the service's pom.xml
COPY services/users/auth-service/pom.xml ./pom.xml

# Build dependencies
RUN mvn dependency:go-offline -Dmaven.wagon.http.readTimeout=120000

# Copy the service's source
COPY services/users/auth-service/src ./src

# Build the application
RUN mvn clean install -DskipTests -Dmaven.wagon.http.readTimeout=120000

# Stage 2: Create the final, lightweight container
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# Copy the built JAR file from the 'build' stage
COPY --from=build /app/target/auth-service-0.0.1-SNAPSHOT.jar ./app.jar
EXPOSE 3002
# Command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]