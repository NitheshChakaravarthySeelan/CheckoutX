# Stage 1: Build the application using Maven
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
# Copy the pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy the rest of the source code and build the application
COPY src ./src
RUN mvn clean install -DskipTests

# Stage 2: Create the final, lightweight container
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# Note: The JAR file name might be different, adjust if needed.
COPY --from=build /app/target/product-write-0.0.1-SNAPSHOT.jar .
EXPOSE 8082
# Command to run the application
ENTRYPOINT ["java", "-jar", "product-write-0.0.1-SNAPSHOT.jar"]
