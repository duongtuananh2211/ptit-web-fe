<?xml version="1.0" encoding="utf-8"?>
<plan>
  <summary>
    This plan implements complete JWT authentication for HorusVis across five sequential phases: password hashing, login/register service, refresh token rotation, the HTTP auth controller, and configuration hardening. All work uses the existing project structure — no new NuGet packages are introduced. The current critical security gaps (480-minute access tokens, missing password hasher, no refresh token rotation) are closed by Phase 4. The data model already supports every feature via the existing User, Role, and UserSession entities; the UserSession migration is confirmed applied. All OWASP recommendations from the research phase are embedded into concrete file-level tasks with exact method signatures and security rationale.
  </summary>

  <decisions>
    <decision topic="access-token-lifetime">
      <chosen>15 minutes</chosen>
      <rationale>OWASP JWT Cheat Sheet demonstrates 15-minute tokens in its reference implementation. The current value of 480 minutes means a stolen token is valid for 8 hours with no revocation path. Reducing to 15 minutes is the highest-impact security fix in the project; silent background refresh via /api/auth/refresh is transparent to users.</rationale>
    </decision>
    <decision topic="token-storage-strategy">
      <chosen>httpOnly Secure SameSite=Strict cookie for refresh token; Authorization Bearer header for access token (stored in sessionStorage or in-memory React state)</chosen>
      <rationale>httpOnly cookie prevents any JavaScript (including XSS payloads) from reading the long-lived refresh token. SameSite=Strict prevents CSRF on the refresh endpoint (POST). Access token in sessionStorage has a 15-minute lifetime, so the XSS exposure window is minimal. This is the OWASP-preferred approach for SPAs.</rationale>
    </decision>
    <decision topic="password-algorithm">
      <chosen>PasswordHasher&lt;User&gt; (PBKDF2-HMAC-SHA256, 600k iterations)</chosen>
      <rationale>Built into Microsoft.AspNetCore.Identity namespace which is included in the Microsoft.AspNetCore.App shared framework — zero new NuGet dependencies. Meets OWASP option 4 (PBKDF2-HMAC-SHA256 at 600k iterations). FIPS-compliant. The PasswordVerificationResult enum (Success / SuccessRehashNeeded / Failed) enables transparent re-hashing if the work factor is upgraded in future.</rationale>
    </decision>
    <decision topic="refresh-token-lifetime">
      <chosen>14 days</chosen>
      <rationale>Balanced between security (7-day) and UX (30-day). Matches common industry practice; users who close their browser and return within two weeks do not need to re-authenticate. The UserSession.RefreshTokenExpiresAt field enforces this server-side regardless of cookie expiry.</rationale>
    </decision>
    <decision topic="refresh-token-storage-server">
      <chosen>SHA-256 hex hash stored in UserSession.RefreshTokenHash; raw token returned once to client (never persisted)</chosen>
      <rationale>OWASP JWT Cheat Sheet: "The denylist will keep a digest (SHA-256 encoded in HEX) of the token." Storing only the hash means a database breach does not expose usable refresh tokens. The raw 64-byte (512-bit entropy) token is generated with RandomNumberGenerator.GetBytes() and returned in the httpOnly cookie only.</rationale>
    </decision>
    <decision topic="cors-credentials">
      <chosen>AllowCredentials() added to CORS policy with a specific configured origin (not wildcard)</chosen>
      <rationale>AllowCredentials() is required for the browser to send the httpOnly refresh token cookie cross-origin (React :5173 → API :5xxx). AllowAnyOrigin() cannot be combined with AllowCredentials() per the CORS spec — a specific origin must be configured (via appsettings or environment variable).</rationale>
    </decision>
    <decision topic="signing-algorithm">
      <chosen>Keep HS256 (no change)</chosen>
      <rationale>HorusVis is a single-service API that both issues and validates tokens. HS256 is appropriate; RS256/ES256 is only necessary for microservices or third-party token validation. The existing SecurityAlgorithms.HmacSha256 in JwtTokenService is correct.</rationale>
    </decision>
  </decisions>

  <phases>
    <phase number="1" name="password-service">
      <objective>Implement password hashing and verification as a standalone injectable service using PasswordHasher&lt;User&gt; from the ASP.NET Core shared framework. No new NuGet packages required.</objective>
      <files>
        <create>backend/src/HorusVis.Business/Contracts/IPasswordService.cs</create>
        <create>backend/src/HorusVis.Business/Services/PasswordService.cs</create>
        <modify>backend/src/HorusVis.Business/ServiceCollectionExtensions.cs</modify>
      </files>
      <tasks>
        <task priority="high">
          Define IPasswordService with two methods:
            string HashPassword(User user, string plainPassword)
            bool VerifyPassword(User user, string hashedPassword, string providedPassword)
          Place in backend/src/HorusVis.Business/Contracts/IPasswordService.cs.
          Add using HorusVis.Data.Horusvis.Entities; and namespace HorusVis.Business.Contracts.
        </task>
        <task priority="high">
          Implement PasswordService in backend/src/HorusVis.Business/Services/PasswordService.cs.
          Constructor-inject IPasswordHasher&lt;User&gt; (from Microsoft.AspNetCore.Identity).
          HashPassword: delegate to _hasher.HashPassword(user, plainPassword); return result string.
          VerifyPassword: call _hasher.VerifyHashedPassword(user, hashedPassword, providedPassword);
            return true for PasswordVerificationResult.Success or SuccessRehashNeeded (rehash is handled in Phase 2 AuthService);
            return false for Failed.
          Class is sealed and implements IPasswordService.
        </task>
        <task priority="high">
          In ServiceCollectionExtensions.cs, inside AddBusinessServices(this IServiceCollection services):
            Add services.AddScoped&lt;IPasswordHasher&lt;User&gt;, PasswordHasher&lt;User&gt;&gt;();
            Add services.AddScoped&lt;IPasswordService, PasswordService&gt;();
          Add required using statements: Microsoft.AspNetCore.Identity, HorusVis.Business.Contracts, HorusVis.Business.Services.
        </task>
        <task priority="medium">
          Write unit tests in HorusVis.Business.Tests:
            Test: HashPassword returns a non-empty string different from the input.
            Test: VerifyPassword returns true for a correct password (hash the password first, then verify).
            Test: VerifyPassword returns false for an incorrect password.
            Test: Two calls to HashPassword with the same input produce different hashes (different salts).
          Use a real PasswordHasher&lt;User&gt; instance (no mocking needed — it is deterministic for verify, random for hash).
        </task>
      </tasks>
      <deliverables>
        <deliverable>IPasswordService and PasswordService compile in HorusVis.Business</deliverable>
        <deliverable>ServiceCollectionExtensions registers IPasswordHasher&lt;User&gt; and IPasswordService</deliverable>
        <deliverable>Unit tests pass — passwords hash and verify round-trip correctly</deliverable>
      </deliverables>
      <dependencies>None — first phase, no upstream service requirements</dependencies>

      <code_sketch>
        <!-- IPasswordService.cs -->
        using HorusVis.Data.Horusvis.Entities;
        namespace HorusVis.Business.Contracts;
        public interface IPasswordService
        {
            string HashPassword(User user, string plainPassword);
            bool VerifyPassword(User user, string hashedPassword, string providedPassword);
        }

        <!-- PasswordService.cs -->
        using HorusVis.Business.Contracts;
        using HorusVis.Data.Horusvis.Entities;
        using Microsoft.AspNetCore.Identity;
        namespace HorusVis.Business.Services;
        public sealed class PasswordService(IPasswordHasher&lt;User&gt; hasher) : IPasswordService
        {
            public string HashPassword(User user, string plainPassword)
                => hasher.HashPassword(user, plainPassword);

            public bool VerifyPassword(User user, string hashedPassword, string providedPassword)
            {
                var result = hasher.VerifyHashedPassword(user, hashedPassword, providedPassword);
                return result != PasswordVerificationResult.Failed;
            }
        }
      </code_sketch>
    </phase>

    <phase number="2" name="auth-service-login-register">
      <objective>Implement login and registration flows as a domain service in HorusVis.Business. Uses IPasswordService (Phase 1) and the existing IJwtTokenService. Returns a strongly-typed AuthResult containing the access token.</objective>
      <files>
        <create>backend/src/HorusVis.Business/Contracts/IAuthService.cs</create>
        <create>backend/src/HorusVis.Business/Contracts/AuthResult.cs</create>
        <create>backend/src/HorusVis.Business/Services/AuthService.cs</create>
        <modify>backend/src/HorusVis.Business/ServiceCollectionExtensions.cs</modify>
      </files>
      <tasks>
        <task priority="high">
          Define AuthResult as a record in backend/src/HorusVis.Business/Contracts/AuthResult.cs:
            public sealed record AuthResult(
                string AccessToken,
                DateTimeOffset AccessTokenExpiresAt,
                string RawRefreshToken,           // raw value for cookie — never stored in DB
                DateTimeOffset RefreshTokenExpiresAt
            );
          Note: RawRefreshToken is empty string in Phase 2 (populated fully in Phase 3).
        </task>
        <task priority="high">
          Define IAuthService in backend/src/HorusVis.Business/Contracts/IAuthService.cs with initial methods:
            Task&lt;AuthResult&gt; LoginAsync(string usernameOrEmail, string password, CancellationToken ct = default)
            Task RegisterAsync(string username, string email, string fullName, string password, CancellationToken ct = default)
          RefreshAsync and LogoutAsync will be added in Phase 3.
        </task>
        <task priority="high">
          Implement AuthService.LoginAsync in backend/src/HorusVis.Business/Services/AuthService.cs:
            - Look up user: db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Username == usernameOrEmail || u.Email == usernameOrEmail, ct)
            - If user is null or Status != Active: throw UnauthorizedAccessException("Invalid credentials") — generic message, no enumeration
            - Call IPasswordService.VerifyPassword(user, user.PasswordHash, password)
            - If verify returns false: throw UnauthorizedAccessException("Invalid credentials")
            - If PasswordHasher.VerifyHashedPassword returned SuccessRehashNeeded (detected inside VerifyPassword or by extending the interface): re-hash and save
            - Generate access token via IJwtTokenService.CreateAccessToken(user)
            - Compute AccessTokenExpiresAt = DateTimeOffset.UtcNow.AddMinutes(tokenLifetimeMinutes)
            - Return AuthResult with AccessToken and AccessTokenExpiresAt; RawRefreshToken = string.Empty in Phase 2
        </task>
        <task priority="high">
          Implement AuthService.RegisterAsync:
            - Validate uniqueness: if db.Users.AnyAsync(u => u.Username == username || u.Email == email) throw InvalidOperationException("Username or email already taken")
            - Look up default role: db.Roles.FirstOrDefaultAsync(r => r.RoleCode == "user") — throw InvalidOperationException if not found
            - Create User entity: Id = Guid.NewGuid(), Username, Email, FullName, RoleId = role.Id, Status = UserStatus.Active, CreatedAt = DateTimeOffset.UtcNow
            - Hash password: user.PasswordHash = IPasswordService.HashPassword(user, password)
            - db.Users.Add(user); await db.SaveChangesAsync(ct)
        </task>
        <task priority="high">
          Register IAuthService in ServiceCollectionExtensions.cs:
            services.AddScoped&lt;IAuthService, AuthService&gt;();
          AuthService constructor: inject IPasswordService, IJwtTokenService, HorusVisDbContext, IOptions&lt;JwtAuthenticationOptions&gt;.
        </task>
        <task priority="medium">
          Write unit tests in HorusVis.Business.Tests:
            Test LoginAsync returns AuthResult with non-empty AccessToken for valid credentials.
            Test LoginAsync throws UnauthorizedAccessException for wrong password (generic message).
            Test LoginAsync throws UnauthorizedAccessException for non-existent user (generic message).
            Test RegisterAsync creates a user with a non-empty PasswordHash (not equal to plain password).
            Test RegisterAsync throws when username already exists.
          Use an in-memory SQLite DbContext or mock IPasswordService and IJwtTokenService.
        </task>
      </tasks>
      <deliverables>
        <deliverable>Login returns access token with correct expiry for valid credentials</deliverable>
        <deliverable>Login throws with generic message for invalid credentials (no username enumeration)</deliverable>
        <deliverable>Register creates a user record with PBKDF2-hashed password in the database</deliverable>
        <deliverable>Register throws on duplicate username or email</deliverable>
      </deliverables>
      <dependencies>Phase 1 (IPasswordService); IJwtTokenService already exists in HorusVis.Web (must be moved or referenced via interface — see note)</dependencies>
      <note>
        IJwtTokenService is currently in HorusVis.Web. AuthService in HorusVis.Business needs to call it.
        Options: (a) move IJwtTokenService and JwtTokenService to HorusVis.Business (preferred — token generation is a domain concern); or (b) inject via interface and register from Web layer.
        The plan assumes option (a): IJwtTokenService moves to HorusVis.Business/Contracts and JwtTokenService moves to HorusVis.Business/Services, removing the reference from Web.
        If moving is not desired in Phase 2, use option (b) and keep the existing location.
      </note>
    </phase>

    <phase number="3" name="refresh-token-rotation">
      <objective>Implement cryptographically secure refresh token issuance, rotation on every use, and family invalidation on replay attack. Uses the existing UserSession entity. Extends IAuthService with RefreshAsync and LogoutAsync.</objective>
      <files>
        <create>backend/src/HorusVis.Business/Contracts/IRefreshTokenService.cs</create>
        <create>backend/src/HorusVis.Business/Services/RefreshTokenService.cs</create>
        <modify>backend/src/HorusVis.Business/Contracts/IAuthService.cs</modify>
        <modify>backend/src/HorusVis.Business/Contracts/AuthResult.cs</modify>
        <modify>backend/src/HorusVis.Business/Services/AuthService.cs</modify>
        <modify>backend/src/HorusVis.Business/ServiceCollectionExtensions.cs</modify>
      </files>
      <tasks>
        <task priority="high">
          Define IRefreshTokenService in backend/src/HorusVis.Business/Contracts/IRefreshTokenService.cs:
            string GenerateRawToken()   // 64 cryptographically random bytes → Base64 string
            string HashToken(string rawToken)  // SHA-256 of UTF8 bytes → uppercase hex string
        </task>
        <task priority="high">
          Implement RefreshTokenService in backend/src/HorusVis.Business/Services/RefreshTokenService.cs:
            GenerateRawToken: return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            HashToken: return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));
          Class is sealed. No external dependencies — purely static cryptographic operations.
        </task>
        <task priority="high">
          Extend AuthResult record (already has RawRefreshToken and RefreshTokenExpiresAt from Phase 2 definition).
          Confirm fields are present:
            string AccessToken
            DateTimeOffset AccessTokenExpiresAt
            string RawRefreshToken        // raw token for httpOnly cookie — empty on register
            DateTimeOffset RefreshTokenExpiresAt
        </task>
        <task priority="high">
          Extend IAuthService with:
            Task&lt;AuthResult&gt; RefreshAsync(string rawRefreshToken, CancellationToken ct = default)
            Task LogoutAsync(string rawRefreshToken, CancellationToken ct = default)
        </task>
        <task priority="high">
          Extend AuthService.LoginAsync to issue a refresh token pair:
            - After verifying password, call IRefreshTokenService.GenerateRawToken()
            - Hash it: IRefreshTokenService.HashToken(rawToken)
            - Create UserSession { Id = Guid.NewGuid(), UserId = user.Id, RefreshTokenHash = hash,
                CreatedAt = now, LastUsedAt = now,
                RefreshTokenExpiresAt = now.AddDays(14),
                Status = UserSessionStatus.Active }
            - db.UserSessions.Add(session); save in same SaveChangesAsync call
            - Return AuthResult with RawRefreshToken = rawToken, RefreshTokenExpiresAt = session.RefreshTokenExpiresAt
        </task>
        <task priority="high">
          Implement AuthService.RefreshAsync:
            1. hash = IRefreshTokenService.HashToken(rawRefreshToken)
            2. Begin EF Core transaction (db.Database.BeginTransactionAsync)
            3. Load session: db.UserSessions.Include(s => s.User).ThenInclude(u => u.Role).FirstOrDefaultAsync(s => s.RefreshTokenHash == hash, ct)
            4. If session is null: rollback, throw UnauthorizedAccessException("Invalid refresh token")
            5. REPLAY DETECTION: if session.RevokedAt != null || session.Status == Revoked:
                - Revoke ALL active sessions: db.UserSessions.Where(s => s.UserId == session.UserId &amp;&amp; s.Status == Active)
                    .ExecuteUpdateAsync(... RevokedAt = now, Status = Revoked)
                - Commit, throw UnauthorizedAccessException("Session compromised — all sessions revoked")
            6. EXPIRY CHECK: if session.RefreshTokenExpiresAt &lt; now: revoke session, commit, throw UnauthorizedAccessException("Refresh token expired")
            7. ROTATE: mark old session Revoked (RevokedAt = now, Status = Revoked)
            8. Generate new raw token + hash; create new UserSession with 14-day expiry
            9. Generate new access token via IJwtTokenService.CreateAccessToken(session.User)
            10. Save and commit transaction
            11. Return AuthResult with new tokens
        </task>
        <task priority="high">
          Implement AuthService.LogoutAsync:
            - hash = IRefreshTokenService.HashToken(rawRefreshToken)
            - db.UserSessions.Where(s => s.RefreshTokenHash == hash &amp;&amp; s.Status == Active)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.RevokedAt, now).SetProperty(x => x.Status, Revoked))
            - No exception if session not found (idempotent logout)
        </task>
        <task priority="high">
          Register IRefreshTokenService in ServiceCollectionExtensions.cs:
            services.AddScoped&lt;IRefreshTokenService, RefreshTokenService&gt;();
          Update AuthService constructor to include IRefreshTokenService.
        </task>
        <task priority="medium">
          Write unit tests in HorusVis.Business.Tests:
            Test RefreshAsync returns new AuthResult with different tokens on valid call.
            Test RefreshAsync with a replayed (already-rotated) hash revokes all user sessions.
            Test RefreshAsync with a non-existent hash throws UnauthorizedAccessException.
            Test RefreshAsync with an expired session throws UnauthorizedAccessException.
            Test LogoutAsync marks the session as Revoked.
            Test LogoutAsync is idempotent (no exception if token not found).
            Test RefreshTokenService.GenerateRawToken produces unique values on successive calls.
            Test RefreshTokenService.HashToken is deterministic (same input → same output).
        </task>
      </tasks>
      <deliverables>
        <deliverable>Refresh token rotation produces a new token pair on every valid call</deliverable>
        <deliverable>Replaying a revoked refresh token triggers family invalidation (all user sessions revoked)</deliverable>
        <deliverable>Logout revokes the specific session; subsequent refresh calls fail with 401</deliverable>
        <deliverable>Refresh tokens are stored only as SHA-256 hashes in UserSession.RefreshTokenHash</deliverable>
      </deliverables>
      <dependencies>Phase 2 (AuthService, IAuthService); UserSession entity and UserSessionStatus enum in HorusVisDbContext (migration confirmed applied)</dependencies>
    </phase>

    <phase number="4" name="auth-controller">
      <objective>Expose four authentication HTTP endpoints. Deliver refresh tokens exclusively via httpOnly cookies. Return access tokens in JSON response body. Wire IAuthService into Program.cs DI.</objective>
      <files>
        <create>backend/src/HorusVis.Web/Controllers/AuthController.cs</create>
        <create>backend/src/HorusVis.Web/Contracts/Auth/LoginRequest.cs</create>
        <create>backend/src/HorusVis.Web/Contracts/Auth/RegisterRequest.cs</create>
        <create>backend/src/HorusVis.Web/Contracts/Auth/LoginResponse.cs</create>
        <modify>backend/src/HorusVis.Web/Program.cs</modify>
      </files>
      <tasks>
        <task priority="high">
          Create request/response DTOs in backend/src/HorusVis.Web/Contracts/Auth/:
            LoginRequest: string UsernameOrEmail, string Password  (both required, non-empty)
            RegisterRequest: string Username, string Email, string FullName, string Password  (all required)
            LoginResponse: string AccessToken, DateTimeOffset ExpiresAt
          Use [Required] and DataAnnotations or record positional parameters; do NOT include refresh token fields.
        </task>
        <task priority="high">
          Create AuthController in backend/src/HorusVis.Web/Controllers/AuthController.cs:
            [ApiController]
            [Route("api/auth")]
            Constructor-inject IAuthService and IWebHostEnvironment.

          POST /api/auth/login  [AllowAnonymous]:
            - Validate LoginRequest (ModelState or [Required])
            - Call IAuthService.LoginAsync(request.UsernameOrEmail, request.Password, ct)
            - Catch UnauthorizedAccessException → return Problem(statusCode: 401, detail: "Invalid credentials")
            - On success:
                Append httpOnly cookie:
                  Response.Cookies.Append("refresh_token", result.RawRefreshToken, new CookieOptions {
                      HttpOnly = true,
                      Secure = !_env.IsDevelopment(),
                      SameSite = SameSiteMode.Strict,
                      Expires = result.RefreshTokenExpiresAt,
                      Path = "/api/auth"   // restrict cookie to auth endpoints only
                  });
                Return Ok(new LoginResponse(result.AccessToken, result.AccessTokenExpiresAt))
        </task>
        <task priority="high">
          POST /api/auth/refresh  [AllowAnonymous]:
            - Read cookie: var rawToken = Request.Cookies["refresh_token"]
            - If null or empty: return Problem(statusCode: 401, detail: "No refresh token")
            - Call IAuthService.RefreshAsync(rawToken, ct)
            - Catch UnauthorizedAccessException → delete cookie, return Problem(statusCode: 401)
            - On success: update cookie (same options as login), return Ok(new LoginResponse(...))
        </task>
        <task priority="high">
          POST /api/auth/logout  [Authorize]:
            - Read cookie: var rawToken = Request.Cookies["refresh_token"]
            - If not null: await IAuthService.LogoutAsync(rawToken, ct)
            - Delete cookie: Response.Cookies.Delete("refresh_token", new CookieOptions { Path = "/api/auth" })
            - Return NoContent() (204)
        </task>
        <task priority="high">
          POST /api/auth/register  [AllowAnonymous]:
            - Validate RegisterRequest
            - Call IAuthService.RegisterAsync(request.Username, request.Email, request.FullName, request.Password, ct)
            - Catch InvalidOperationException (duplicate user) → return Problem(statusCode: 409, detail: ex.Message)
            - On success: return StatusCode(201)
        </task>
        <task priority="high">
          In Program.cs, add after builder.Services.AddBusinessServices():
            builder.Services.AddScoped&lt;IAuthService, AuthService&gt;();
          (or move this registration to AddBusinessServices if that is preferred)
        </task>
        <task priority="medium">
          Return ProblemDetails-formatted errors (use builder.Services.AddProblemDetails() if not already registered).
          Ensure 400 for validation errors (ModelState), 401 for auth failures, 409 for conflicts.
        </task>
        <task priority="medium">
          Write integration or unit tests in HorusVis.Web.Tests:
            Test POST /api/auth/login returns 200 with LoginResponse and sets refresh_token cookie.
            Test POST /api/auth/login returns 401 for invalid credentials (cookie not set).
            Test POST /api/auth/refresh returns 200 with new LoginResponse and rotated cookie.
            Test POST /api/auth/refresh returns 401 if cookie is absent.
            Test POST /api/auth/logout returns 204 and clears cookie.
            Test POST /api/auth/register returns 201 for valid input.
            Test POST /api/auth/register returns 409 for duplicate username.
        </task>
      </tasks>
      <deliverables>
        <deliverable>All four endpoints are accessible and return correct status codes</deliverable>
        <deliverable>Refresh token is delivered ONLY via httpOnly cookie — never appears in JSON response body</deliverable>
        <deliverable>Access token returned in JSON LoginResponse body only</deliverable>
        <deliverable>Cookie cleared on logout; subsequent refresh calls return 401</deliverable>
      </deliverables>
      <dependencies>Phase 3 (IAuthService with RefreshAsync and LogoutAsync fully implemented)</dependencies>
    </phase>

    <phase number="5" name="config-hardening">
      <objective>Close remaining configuration security gaps: reduce access token lifetime to 15 minutes, make HTTPS enforcement environment-conditional, configure CORS for cookie credentials, add jti claim, and tighten clock skew.</objective>
      <files>
        <modify>backend/src/HorusVis.Web/appsettings.json</modify>
        <modify>backend/src/HorusVis.Web/Program.cs</modify>
        <modify>backend/src/HorusVis.Web/Services/Authentication/JwtTokenService.cs</modify>
        <modify>backend/src/HorusVis.Web/Options/JwtAuthenticationOptions.cs</modify>
      </files>
      <tasks>
        <task priority="high">
          In appsettings.json, change:
            "JwtAuthentication": { "TokenLifetimeMinutes": 480 }
          to:
            "JwtAuthentication": { "TokenLifetimeMinutes": 15 }
          This is the primary OWASP fix. No code change to JwtTokenService required — it already reads from options.
        </task>
        <task priority="high">
          In Program.cs, change options.RequireHttpsMetadata = false to:
            options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
          This enforces HTTPS in staging and production while allowing HTTP in local development.
        </task>
        <task priority="high">
          In Program.cs, update the CORS policy to support httpOnly cookies from the React SPA:
            policy.WithOrigins(builder.Configuration["AllowedOrigins"] ?? "http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
          IMPORTANT: AllowCredentials() requires a specific origin — AllowAnyOrigin() must NOT be used together.
          Add "AllowedOrigins" key to appsettings.json (default: "http://localhost:5173") and appsettings.Production.json (production frontend URL).
        </task>
        <task priority="medium">
          In JwtTokenService.cs, add a jti claim to the Claims list:
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
          Place this claim before the subject claim. This gives each token a unique ID enabling future denylist support and token tracking.
        </task>
        <task priority="medium">
          In Program.cs, tighten TokenValidationParameters clock skew:
            ClockSkew = TimeSpan.Zero
          (Current value is TimeSpan.FromMinutes(1) — good, but Zero is stricter with 15-min tokens. Use Zero to prevent any window beyond the 15-minute expiry.)
        </task>
        <task priority="medium">
          Add "AllowedOrigins" key to appsettings.json with default value "http://localhost:5173".
          Add appsettings.Production.json entry for the production frontend URL (placeholder value).
          Document in README or comments that this must be configured before production deployment.
        </task>
        <task priority="low">
          Verify JwtAuthenticationOptions.cs has correct default values (TokenLifetimeMinutes default should match appsettings after this change).
          If there is a hardcoded default of 480 in the Options class, update it to 15.
        </task>
      </tasks>
      <deliverables>
        <deliverable>Access tokens expire in 15 minutes (down from 480)</deliverable>
        <deliverable>HTTPS enforcement is true in Production/Staging, false in Development</deliverable>
        <deliverable>CORS allows credentials from configured frontend origin</deliverable>
        <deliverable>Every JWT contains a unique jti claim</deliverable>
        <deliverable>ClockSkew is zero — no grace period beyond stated token lifetime</deliverable>
      </deliverables>
      <dependencies>Phase 4 (auth endpoints must exist before CORS credential requirements are exercisable); Phase 2 (token generation service)</dependencies>
    </phase>
  </phases>

  <interface_contracts>
    <interface name="IPasswordService" location="backend/src/HorusVis.Business/Contracts/IPasswordService.cs">
      <method>string HashPassword(User user, string plainPassword)</method>
      <method>bool VerifyPassword(User user, string hashedPassword, string providedPassword)</method>
    </interface>

    <interface name="IRefreshTokenService" location="backend/src/HorusVis.Business/Contracts/IRefreshTokenService.cs">
      <method>string GenerateRawToken()</method>
      <method>string HashToken(string rawToken)</method>
    </interface>

    <interface name="IAuthService" location="backend/src/HorusVis.Business/Contracts/IAuthService.cs">
      <method>Task&lt;AuthResult&gt; LoginAsync(string usernameOrEmail, string password, CancellationToken ct = default)</method>
      <method>Task RegisterAsync(string username, string email, string fullName, string password, CancellationToken ct = default)</method>
      <method>Task&lt;AuthResult&gt; RefreshAsync(string rawRefreshToken, CancellationToken ct = default)</method>
      <method>Task LogoutAsync(string rawRefreshToken, CancellationToken ct = default)</method>
    </interface>

    <type name="AuthResult" location="backend/src/HorusVis.Business/Contracts/AuthResult.cs" kind="sealed record">
      <property>string AccessToken</property>
      <property>DateTimeOffset AccessTokenExpiresAt</property>
      <property>string RawRefreshToken  // raw token value for httpOnly cookie; never persisted</property>
      <property>DateTimeOffset RefreshTokenExpiresAt</property>
    </type>

    <type name="LoginRequest" location="backend/src/HorusVis.Web/Contracts/Auth/LoginRequest.cs" kind="record">
      <property>[Required] string UsernameOrEmail</property>
      <property>[Required] string Password</property>
    </type>

    <type name="RegisterRequest" location="backend/src/HorusVis.Web/Contracts/Auth/RegisterRequest.cs" kind="record">
      <property>[Required] string Username</property>
      <property>[Required][EmailAddress] string Email</property>
      <property>[Required] string FullName</property>
      <property>[Required][MinLength(8)] string Password</property>
    </type>

    <type name="LoginResponse" location="backend/src/HorusVis.Web/Contracts/Auth/LoginResponse.cs" kind="record">
      <property>string AccessToken</property>
      <property>DateTimeOffset ExpiresAt</property>
    </type>
  </interface_contracts>

  <security_checklist>
    <item status="addressed-in-phase-1">Password hashing: PasswordHasher&lt;User&gt; PBKDF2-HMAC-SHA256 600k iterations</item>
    <item status="addressed-in-phase-3">Refresh token stored as SHA-256 hash only — raw token never persisted</item>
    <item status="addressed-in-phase-3">Refresh token rotation on every use — old token revoked immediately</item>
    <item status="addressed-in-phase-3">Replay detection: revoked-token reuse triggers family invalidation</item>
    <item status="addressed-in-phase-4">Refresh token delivered via httpOnly Secure SameSite=Strict cookie</item>
    <item status="addressed-in-phase-2">Generic error messages for login failures — prevents username enumeration</item>
    <item status="addressed-in-phase-5">Access token lifetime: 15 minutes (down from 480)</item>
    <item status="addressed-in-phase-5">RequireHttpsMetadata: environment-conditional</item>
    <item status="addressed-in-phase-5">CORS AllowCredentials with specific origin (not wildcard)</item>
    <item status="addressed-in-phase-5">jti claim added to every access token</item>
    <item status="addressed-in-phase-5">ClockSkew = TimeSpan.Zero</item>
    <item status="out-of-scope-future">Production SigningKey: must be replaced with Azure Key Vault / env variable before production</item>
    <item status="out-of-scope-future">Rate limiting on /api/auth/login and /api/auth/refresh (OWASP recommendation)</item>
    <item status="out-of-scope-future">Account lockout after N failed login attempts</item>
  </security_checklist>

  <metadata>
    <confidence level="high">
      Research is thorough — all seven gap areas answered from live OWASP and Microsoft sources.
      All entities (User, Role, UserSession, UserSessionStatus) confirmed present in HorusVisDbContext.
      UserSession migration confirmed applied (terminal exit code 0). JwtTokenService exists and is
      correctly configured for .NET 10. No new NuGet packages are needed. The only remaining
      unknowns are team decisions resolved as explicit decisions above.
    </confidence>

    <dependencies>
      <dependency>UserSession migration applied — confirmed (terminal: dotnet ef database update → exit 0)</dependency>
      <dependency>HorusVisDbContext configured with User, Role, UserSession, Permission, RolePermission — confirmed in research</dependency>
      <dependency>IJwtTokenService exists at HorusVis.Web/Services/Authentication/JwtTokenService.cs — confirmed</dependency>
      <dependency>JwtAuthenticationOptions exists at HorusVis.Web/Options/JwtAuthenticationOptions.cs — confirmed</dependency>
      <dependency>No new NuGet packages required — all functionality in Microsoft.AspNetCore.App shared framework or .NET BCL</dependency>
    </dependencies>

    <open_questions>
      <question id="1">What default role should new registrations receive? The plan assumes a Role with RoleCode = "user" must already exist in the Roles table. If this seed data does not exist, RegisterAsync will throw. A seed/migration may be needed.</question>
      <question id="2">Should multiple concurrent sessions per user be allowed? The current plan allows unlimited sessions (one per browser/device). Capping sessions (e.g., max 5) requires additional logic in LoginAsync to evict the oldest session.</question>
      <question id="3">Should IJwtTokenService and JwtTokenService move from HorusVis.Web to HorusVis.Business? Phase 2 requires AuthService (in Business) to call IJwtTokenService. Moving it to Business is cleaner; leaving it in Web requires cross-project DI wiring.</question>
    </open_questions>

    <assumptions>
      <assumption>PasswordHasher&lt;User&gt; is registered directly without the full ASP.NET Core Identity infrastructure (AddIdentity is not needed)</assumption>
      <assumption>Refresh token raw value is delivered only via httpOnly cookie — it never appears in any JSON response body</assumption>
      <assumption>No repository pattern — HorusVisDbContext is injected directly into AuthService</assumption>
      <assumption>Existing JwtTokenService is extended (jti claim added, lifetime reads from options), not replaced</assumption>
      <assumption>A Role with RoleCode = "user" must exist in the Roles table for registration to succeed</assumption>
      <assumption>The React SPA uses credentials: 'include' on all fetch/axios calls to the /api/auth/* endpoints</assumption>
    </assumptions>

    <estimated_files_created>8</estimated_files_created>
    <estimated_files_modified>6</estimated_files_modified>
    <new_nuget_packages>0</new_nuget_packages>
    <based_on>001-auth-jwt-research</based_on>
    <plan_version>v1</plan_version>
    <date>2026-04-08</date>
  </metadata>
</plan>
