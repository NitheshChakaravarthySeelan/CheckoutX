# Detailed Security Analysis: `gateway-bff` & `auth-service`

This report provides a detailed analysis of the `gateway-bff` and `auth-service`, expanding on the initial overview.

---

## `gateway-bff` Security Analysis

The `gateway-bff` is a Next.js application that serves as the primary entry point for user-facing traffic. While it has foundational security middleware, it contains critical vulnerabilities.

### Vulnerabilities & Misconfigurations:

#### 1. (Critical) Incomplete Middleware Protection

- **Issue:** The security middleware in `src/middleware.ts` only protects the `/api/products/:path*` and `/api/orders/:path*` routes.
- **Impact:** This leaves numerous sensitive API endpoints completely unprotected and open to unauthenticated access. An attacker can freely perform actions on these endpoints.
- **Exposed Endpoints of Concern:**
    - `/api/cart/**`: View and modify any user's shopping cart.
    - `/api/checkout/**`: Initiate and view checkout processes.
    - `/api/users/**`: Access user information.
    - `/api/wallets/**`: View and modify user wallet balances.
    - And many others.
- **Resolution:**
    - The `matcher` in `src/middleware.ts` must be expanded to cover all non-public API routes. A better approach is to define public routes (like `/api/auth/login`, `/api/auth/register`) and protect everything else by default.
    - **Example (Conceptual):**
      ```typescript
      export const config = {
        matcher: [
          /*
           * Match all API routes except for the ones starting with /api/auth.
           * This is a "default deny" approach.
           */
          '/api/:path((?!auth).*)',
        ],
      };
      ```

#### 2. (High) Inefficient and Risky Token Validation

- **Issue:** The middleware validates tokens by making a synchronous network call to `auth-service` for every request. It also relies on custom `X-User-*` headers to pass identity downstream.
- **Impact:**
    - **Performance:** Adds significant latency to every API call.
    - **Reliability:** Creates a single point of failure. If `auth-service` is down, most of the API becomes unusable.
    - **Security:** Relies on downstream services to trust the `X-User-ID` header, breaking the zero-trust principle. An attacker who finds a way to bypass the BFF could potentially spoof these headers.
- **Resolution:**
    1.  Modify the `auth-service` to use an **asymmetric algorithm (e.g., RS256)** for signing JWTs (see `auth-service` analysis).
    2.  The `auth-service` should expose a public key via a `.well-known/jwks.json` endpoint.
    3.  The `gateway-bff` middleware should fetch and cache this public key.
    4.  The middleware can then validate JWT signatures **locally and instantly** without any network calls.
    5.  The original, validated JWT should be forwarded to downstream services, which can then independently re-validate it using the same public key.

#### 3. (Medium) Lack of Input Validation

- **Issue:** The `/api/auth/login/route.ts` endpoint directly forwards the request body to the `auth-service` without any validation.
- **Impact:** While the risk is currently low, it's a bad practice. It could expose the `auth-service` to denial-of-service or other attacks if it doesn't handle malformed input gracefully.
- **Resolution:** Implement basic input validation on all API route handlers. Use a library like `zod` or `joi` to define schemas for request bodies and ensure they conform to expectations (e.g., `username` is a non-empty string).

---

## `auth-service` Security Analysis

The `auth-service` is a Spring Boot application. Its core security configuration is solid, but it has a critical flaw related to secret management and a significant architectural weakness in its JWT strategy.

### Vulnerabilities & Misconfigurations:

#### 1. (Critical) Hardcoded, Weak JWT Secret

- **Issue:** As confirmed in `JWTService.java` and `JWTConfig.java`, the service uses a weak, hardcoded secret (`your-super-secret-key`) provided via the `docker-compose.dev.yml` file to sign all JWTs.
- **Impact:** An attacker who obtains this key can forge valid JWTs for any user, including administrators, granting them complete control over the system.
- **Resolution:**
    1. **Use Asymmetric Keys:** Switch from HS256 to RS256. This is the top recommendation.
    2. **Secure Key Generation & Storage:** The private key must be generated securely and stored in a proper secrets manager (like HashiCorp Vault or AWS Secrets Manager), not in Docker Compose files.

#### 2. (High) Use of Symmetric Key Algorithm (HS256)

- **Issue:** The use of HS256 forces a symmetric key approach, where the same key that signs tokens must also validate them.
- **Impact:** This is the root cause of the "Inefficient and Risky Token Validation" issue in the `gateway-bff`. It prevents other services from validating tokens independently, forcing them into a tightly coupled, chatty relationship with the `auth-service`.
- **Resolution:** Migrate to `RS256`. The `jjwt` library fully supports this. `JWTService.java` would need to be updated to load a private key for signing, and a new controller endpoint would be needed to expose the public key in JWKS format.

#### 3. (Medium) Overly Permissive Public Endpoint

- **Issue:** In `SecurityConfig.java`, the rule `.requestMatchers("/api/auth/**").permitAll()` makes all current and future endpoints under `/api/auth/` public by default.
- **Impact:** A developer might accidentally add a sensitive endpoint (e.g., `/api/auth/users`) that becomes unintentionally public. The `/api/auth/validate` endpoint, used by the BFF, is also public, though it's protected by its own JWT filter logic.
- **Resolution:** Be explicit. Only permit the exact endpoints required for anonymous access.
    - **Example:**
      ```java
      .authorizeHttpRequests(auth -> auth
          .requestMatchers("/api/auth/login", "/api/auth/register").permitAll()
          .anyRequest().authenticated()
      )
      ```
      The `/validate` endpoint will now correctly require a token, which is validated by the `JwtAuthFilter`.

---
This detailed analysis should provide a clear path to significantly improving the security posture of your authentication and gateway services.
