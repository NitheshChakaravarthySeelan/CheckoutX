# Stage 1: Build the application using Maven
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app

# Copy the pom.xml and source code
COPY services/cart/cart-pricing/pom.xml ./pom.xml
COPY services/cart/cart-pricing/src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -B package -DskipTests -Dmaven.wagon.http.readTimeout=120000 -Dmaven.wagon.http.retryHandler.count=5

# Stage 2: Create the final, lightweight container
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# Copy the built JAR file from the 'build' stage
# Note: The JAR file name might be different, adjust if needed.
COPY --from=build /app/target/cart-pricing-0.0.1-SNAPSHOT.jar .
EXPOSE 8084
# Command to run the application
ENTRYPOINT ["java", "-jar", "cart-pricing-0.0.1-SNAPSHOT.jar"]
