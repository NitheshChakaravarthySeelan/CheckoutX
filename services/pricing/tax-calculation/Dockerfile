FROM maven:3.9.1-eclipse-temurin-17 as build
WORKDIR /app
COPY services/pricing/tax-calculation/pom.xml ./pom.xml
COPY services/pricing/tax-calculation/src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre
COPY --from=build /app/target/tax-calculation-0.0.1-SNAPSHOT.jar /app/app.jar
ENTRYPOINT ["java","-jar","/app/app.jar"]