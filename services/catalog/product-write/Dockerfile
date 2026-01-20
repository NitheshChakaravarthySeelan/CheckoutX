# Stage 1: Build the application using Maven
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
# Copy pom.xml from its monorepo path
COPY services/catalog/product-write/pom.xml ./services/catalog/product-write/pom.xml
# Set WORKDIR again to operate within the service's directory
WORKDIR /app/services/catalog/product-write
RUN mvn dependency:go-offline

# Copy the rest of the source code and build the application
COPY services/catalog/product-write/src ./src
RUN mvn clean install -DskipTests

# Stage 2: Create the final, lightweight container
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# Copy the built JAR file from the 'build' stage
COPY --from=build /app/services/catalog/product-write/target/product-write-1.0.0-SNAPSHOT.jar .
EXPOSE 8082
# Command to run the application
ENTRYPOINT ["java", "-jar", "product-write-1.0.0-SNAPSHOT.jar"]