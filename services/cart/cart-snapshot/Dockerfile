# Stage 1: Build the application using Maven
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app

# Copy shared proto definitions (if needed by parent pom for protobuf generation)
COPY shared/proto ./shared/proto

# Copy the service's pom.xml and source
COPY services/cart/cart-snapshot/pom.xml ./pom.xml
COPY services/cart/cart-snapshot/src ./src

# Build the application
RUN --mount=type=cache,target=/root/.m2 mvn -B package -DskipTests -Dmaven.wagon.http.readTimeout=120000 -Dmaven.wagon.http.retryHandler.count=5

# Stage 2: Create the final, lightweight container
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# Copy the built JAR file from the 'build' stage and rename to a generic name
COPY --from=build /app/target/cart-snapshot-0.0.1-SNAPSHOT.jar ./app.jar
EXPOSE 8083
# Command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]