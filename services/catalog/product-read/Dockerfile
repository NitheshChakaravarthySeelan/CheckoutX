# Stage 1: Build the application using Maven
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app

# Copy shared proto files
COPY shared/proto ./shared/proto

# Copy the service's pom.xml and source
COPY services/catalog/product-read/pom.xml ./pom.xml
COPY services/catalog/product-read/src ./src

# Build the application
RUN mvn -B package -DskipTests

# Stage 2: Create the final, lightweight container
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# Copy the built JAR file from the 'build' stage
COPY --from=build /app/target/product-read-1.0.0-SNAPSHOT.jar ./app.jar
EXPOSE 8082
# Command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]