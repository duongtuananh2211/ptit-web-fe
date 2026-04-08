<research>
  <summary>
    HorusVis has a functional JWT skeleton in place — HS256 signing, token lifetime configuration, and a well-structured UserSession entity — but has three critical security gaps that must be addressed before implementing any real authentication. The most severe gap is the 480-minute access token lifetime, which is 32× longer than the 15-minute maximum recommended by OWASP and means a stolen token is valid for 8 hours with no ability to revoke it. The second critical gap is the absence of any password hashing implementation: the User entity has a PasswordHash field but no hasher is wired up. The third is that the refresh token rotation logic (for which the UserSession entity is ideally designed) has not been implemented.

    The HS256 algorithm choice is appropriate for HorusVis as a single-service API — only a microservices topology requires RS256/ES256. The TokenValidationParameters in Program.cs are correctly configured (ValidateLifetime, ValidateIssuer, ValidateAudience all true; minimal ClockSkew of 1 minute). The UserSession entity design is excellent: RefreshTokenHash, RefreshTokenExpiresAt, RevokedAt, and Status fields are exactly what is needed for secure refresh token rotation with reuse detection. No structural changes to the data model are needed before implementation.

    The recommended implementation path is: (1) wire up PasswordHasher&lt;User&gt; from the ASP.NET Core shared framework (PBKDF2-HMAC-SHA256, 600 k iterations, no new NuGet packages), (2) reduce access token lifetime to 15 minutes and implement refresh token rotation using UserSession, and (3) store the refresh token in an httpOnly, SameSite=Strict cookie for the React SPA while keeping the access token as a short-lived Bearer token in sessionStorage or an in-memory JavaScript closure. These three changes bring HorusVis into full alignment with current OWASP and Microsoft guidance.
  </summary>

  <findings>

    <finding category="password-hashing">
      <title>No Password Hasher Implemented — Use PasswordHasher&lt;T&gt; (PBKDF2) or BCrypt, Zero New Packages Required</title>
      <detail>
        The OWASP Password Storage Cheat Sheet (2026) prioritises algorithms in this order:
          1. Argon2id — m=19456 (19 MiB), t=2, p=1
          2. scrypt   — N=2^17, r=8, p=1
          3. bcrypt   — work factor ≥ 10 (legacy systems only)
          4. PBKDF2-HMAC-SHA256 — 600,000 iterations (use when FIPS-140 compliance is required)

        For .NET 10 there is an idiomatic, zero-dependency path: PasswordHasher&lt;T&gt; lives in
        Microsoft.AspNetCore.Identity namespace, which is included in the Microsoft.AspNetCore.App
        shared framework used by Microsoft.NET.Sdk.Web. No additional NuGet package is needed.
        Its .NET 10 default uses PBKDF2-HMAC-SHA256 with 600,000 iterations and a 128-bit
        cryptographically random salt, generating a self-contained hash string that includes the
        algorithm identifier, iteration count, salt, and hash — fully upgrade-safe.

        While PBKDF2 sits fourth on the OWASP list (behind Argon2id), Microsoft's
        IPasswordHasher&lt;T&gt; interface is well-supported, straightforward to test, and sufficient for
        all non-FIPS-critical workloads at 600 k iterations. It is the pragmatic .NET 10 choice
        because it requires no new package references.

        If the team wants Argon2id (OWASP top recommendation), add Isopoh.Cryptography.Argon2
        (maintained, pure .NET) or use BCrypt.Net-Next (bcrypt, work factor 12) as the trade-off
        between security and implementation simplicity. The User.PasswordHash field (MaxLength 255)
        is large enough for any of these algorithms.

        The return value of PasswordHasher.HashPassword() / VerifyHashedPassword() includes a format
        version byte, making future algorithm upgrades transparent via the PasswordVerificationResult
        enum (Success vs SuccessRehashNeeded).
      </detail>
      <source>https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html</source>
      <relevance>
        The User entity has a PasswordHash field but login/register endpoints do not yet exist.
        Before any real authentication is implemented, a hasher must be registered. Using the
        built-in PasswordHasher&lt;User&gt; requires only adding
        services.AddScoped&lt;IPasswordHasher&lt;User&gt;, PasswordHasher&lt;User&gt;&gt;() in Program.cs and
        injecting it into the login/register service — no migrations, no new packages.
      </relevance>
    </finding>

    <finding category="access-token">
      <title>480-Minute Access Token Lifetime Is a Critical Security Risk — OWASP Recommends 15 Minutes</title>
      <detail>
        The OWASP JWT Cheat Sheet for Java explicitly demonstrates a 15-minute access token
        lifetime in its reference implementation (Calendar.MINUTE + 15). The broader OAuth 2.0
        community and IETF JWT Best Practices draft (draft-ietf-oauth-jwt-bcp) reinforce this with
        the principle: "The shorter the access token lifetime, the less damage a leaked token can
        do." RFC 6750 does not mandate a specific value but states tokens should "expire as soon as
        practical."

        HorusVis currently uses TokenLifetimeMinutes = 480 (8 hours). This means:
        - A token stolen via XSS, network interception, or log leakage is valid for up to 8 hours.
        - Because JWTs are stateless, there is NO way to revoke an issued access token before
          expiry — the only mitigation is a short lifetime or a token denylist (expensive).
        - 480 minutes makes the refresh token rotation mechanism (which exists in UserSession)
          effectively useless since the access token outlives most user sessions.

        Recommendation: Reduce to 15 minutes. Pair with 7–30 day sliding refresh tokens stored in
        UserSession. This brings HorusVis into OWASP compliance without degrading UX — the React
        SPA silently refreshes access tokens in the background using the stored refresh token.

        Additional observation: options.RequireHttpsMetadata = false in Program.cs is correct for
        development but MUST be true in production. With a 15-minute token the risk window is small,
        but HTTPS is still mandatory.
      </detail>
      <source>https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html</source>
      <relevance>
        Security risk assessment: HIGH. TokenLifetimeMinutes = 480 in JwtAuthenticationOptions.cs
        and appsettings.json. This single change (480 → 15) is the highest-impact security fix in
        the project. The JwtAuthenticationOptions.TokenLifetimeMinutes property and appsettings.json
        need to be updated together; no code changes to JwtTokenService are required.
      </relevance>
    </finding>

    <finding category="refresh-token-rotation">
      <title>Refresh Token Rotation with Reuse Detection — UserSession Entity Is Designed for This</title>
      <detail>
        The standard refresh token rotation pattern (also called "token family invalidation"):
        1. On login: generate a cryptographically random refresh token (32+ bytes via
           RandomNumberGenerator.GetBytes()), store its SHA-256 hash in UserSession.RefreshTokenHash,
           set status to Active, return raw token to client.
        2. On refresh: look up UserSession by hash. If found and Active, issue new access token +
           new refresh token, update UserSession (new hash, new RefreshTokenExpiresAt, set old
           session RevokedAt, create new session record or update in place).
        3. Reuse detection: if the presented refresh token's hash matches a session where
           RevokedAt IS NOT NULL (already revoked/rotated), this indicates token theft or replay.
           Response: set ALL sessions for that UserId to Revoked. Return 401.
        4. Expiry: if RefreshTokenExpiresAt &lt; UtcNow, return 401 (session expired).

        The UserSession entity already has every field needed:
        - RefreshTokenHash: stores SHA-256 hex of the raw token
        - RefreshTokenExpiresAt: controls refresh window (7–30 days recommended)
        - RevokedAt: non-null = token has been rotated or invalidated
        - Status (UserSessionStatus enum): Active / Revoked — queryable index for cleanup jobs
        - LastUsedAt: audit trail

        EF Core pattern: use a transaction wrapping the query + update to avoid race conditions on
        concurrent refresh requests from the same client (e.g., multiple tabs).

        OWASP JWT cheat sheet notes: "The denylist will keep a digest (SHA-256 encoded in HEX) of
        the token." The UserSession design already follows this guidance exactly.
      </detail>
      <source>https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html</source>
      <relevance>
        The UserSession entity is complete and correctly structured. No migration changes needed for
        the core rotation logic. The implementation work is purely service-layer: a
        RefreshTokenService that performs the hash lookup, rotation, and reuse detection against
        HorusVisDbContext.UserSessions.
      </relevance>
    </finding>

    <finding category="token-storage-client">
      <title>Client Token Storage — httpOnly Cookie for Refresh Token; In-Memory/sessionStorage for Access Token</title>
      <detail>
        OWASP JWT Cheat Sheet recommends three options for client-side storage, in preference order:
        1. sessionStorage + Bearer header — token accessible to JavaScript (XSS risk), but cleared
           on tab/browser close. Add a fingerprint to the token to mitigate XSS replay attacks.
        2. JavaScript closure (private variable) — token never accessible to external scripts.
           Requires all fetch calls to go through a module that attaches the Authorization header.
        3. httpOnly cookie — completely inaccessible to JavaScript (no XSS risk), but requires
           CSRF countermeasures. Best for refresh tokens.

        For a React SPA + REST API with a separate backend:
        - Access token: store in sessionStorage or an in-memory React state/context. Short lifetime
          (15 min) limits exposure. Send as Authorization: Bearer {token} on every request.
        - Refresh token: store as httpOnly, Secure, SameSite=Strict cookie. The browser attaches
          it automatically on POST /api/auth/refresh. SameSite=Strict prevents CSRF for the refresh
          endpoint. HttpOnly prevents XSS from reading the refresh token.

        CORS implication: to send cookies cross-origin (React dev on :5173, API on :5xxx), the
        CORS policy must add .AllowCredentials() AND the React fetch/axios must use
        credentials: 'include'. The current CORS policy in HorusVis does NOT include
        AllowCredentials() — this must be added if the cookie approach is chosen.

        SameSite=Strict is preferred over SameSite=Lax because the refresh endpoint is a POST and
        Lax only exempts top-level navigations (GETs). Note: SameSite=None requires Secure=true.

        Alternative (simpler to implement): store the refresh token in sessionStorage as well
        (both tokens in sessionStorage). This is weaker (XSS can steal both) but acceptable
        if token lifetimes are short and the fingerprint pattern is used. This approach requires
        no CORS changes.
      </detail>
      <source>https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html</source>
      <relevance>
        HorusVis is a React SPA with a .NET 10 REST API backend. Both options (httpOnly cookie
        or sessionStorage) are viable. The choice has architectural implications for CORS and the
        login endpoint response. This is a team decision documented in the Decisions Needed section.
      </relevance>
    </finding>

    <finding category="signing-algorithm">
      <title>HS256 Is Acceptable for Single-Service APIs — No Change Required</title>
      <detail>
        OWASP JWT Cheat Sheet states: "Alternatively, consider the use of tokens that are signed
        with RSA rather than using an HMAC and secret key" — this is a recommendation for scenarios
        where the signing key could be brute-forced or when multiple parties validate the token.

        HS256 uses a symmetric key: the same secret is used to sign AND verify. This is appropriate
        when:
        - A single backend service both issues and validates tokens (as in HorusVis)
        - The key is never shared with external parties
        - The signing key is sufficiently long (≥ 256 bits = 32 bytes; OWASP recommends 64+ chars)

        RS256/ES256 (asymmetric) is necessary when:
        - Multiple microservices validate tokens without needing the private key
        - External clients or third-party services validate tokens
        - A public JWKS endpoint is required (e.g., OAuth 2.0 authorization server)

        HorusVis is currently single-service, single-tenant with no token sharing requirements.
        HS256 is the correct choice for this architecture.

        Key strength: the default signing key "HorusVis_Local_Development_Signing_Key_Change_Me_2026"
        is 51 characters (408 bits) — sufficient in length, but it is a human-readable string
        (not random) and hardcoded in appsettings.json. For production:
        - Generate a cryptographically random 64-character base64 string
        - Store in environment variable / Azure Key Vault / user-secrets
        - NEVER commit to source control
      </detail>
      <source>https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html</source>
      <relevance>
        No algorithm change needed. The existing SecurityAlgorithms.HmacSha256 in JwtTokenService
        is correct. The only action required is replacing the hardcoded SigningKey with a proper
        secret management strategy before production deployment.
      </relevance>
    </finding>

    <finding category="dotnet10-specifics">
      <title>.NET 10 JwtBearer v10.0.0 — No Breaking Changes; PasswordHasher Available via Shared Framework</title>
      <detail>
        Based on Microsoft documentation (last updated August 2025 for aspnetcore-10.0):

        1. JwtBearer v10.0.0 API surface: No breaking API changes from v9. The AddJwtBearer()
           builder pattern and TokenValidationParameters remain identical. The existing Program.cs
           configuration is correct for .NET 10.

        2. dotnet user-jwts tool: Available in .NET 6+ for creating dev-time local JWTs. Stores
           keys in user-secrets infrastructure. Useful for testing protected endpoints without a
           running auth server. Not relevant to production.

        3. PasswordHasher&lt;T&gt;: Part of Microsoft.AspNetCore.Identity.Core, which is included in the
           Microsoft.AspNetCore.App shared framework (available to all Microsoft.NET.Sdk.Web
           projects automatically). No NuGet package reference needed in HorusVis.Web.csproj.
           The interface IPasswordHasher&lt;TUser&gt; provides HashPassword() and VerifyHashedPassword()
           with a PasswordVerificationResult return type (Success / SuccessRehashNeeded / Failed).

        4. RequireHttpsMetadata: options.RequireHttpsMetadata = false is present in Program.cs.
           This is correct for local development (HTTP), but must be true in production. This
           should be environment-conditioned:
             options.RequireHttpsMetadata = !app.Environment.IsDevelopment();
           (or set via appsettings.Production.json)

        5. ClockSkew = TimeSpan.FromMinutes(1): This is a tighter-than-default value (default is
           5 minutes). A 1-minute clock skew is good security practice — it prevents tokens from
           being accepted well past their expiry by servers with clock drift.

        6. No "none" algorithm vulnerability: Microsoft.IdentityModel.Tokens validates the
           algorithm against the IssuerSigningKey type. Using SymmetricSecurityKey with
           HmacSha256 explicitly prevents the "alg:none" attack automatically.

        7. ASP.NET Core Identity metrics (new in .NET 10): observability counters for sign-in
           patterns — useful for detecting brute-force attempts in production monitoring.
      </detail>
      <source>https://learn.microsoft.com/en-us/aspnet/core/security/authentication/jwt-authn?view=aspnetcore-10.0</source>
      <relevance>
        The existing Program.cs JWT configuration requires only two changes: (1) make
        RequireHttpsMetadata environment-conditional, and (2) update the CORS policy to add
        AllowCredentials() if the httpOnly cookie approach is chosen for refresh tokens. All other
        JwtBearer settings are correct for .NET 10.
      </relevance>
    </finding>

    <finding category="claims-design">
      <title>Minimal JWT Claims — Embed Role Names Only; Look Up Permissions at Authorization Time</title>
      <detail>
        JWT claims bloat is a common anti-pattern. The OWASP JWT cheat sheet and OAuth 2.0 JWT
        Best Practices (RFC 9068) recommend keeping JWT payloads minimal.

        Recommended claims for HorusVis access tokens:
        - sub (ClaimTypes.NameIdentifier): user GUID — use for DB lookups
        - name (ClaimTypes.Name): display name
        - email (ClaimTypes.Email): email address
        - role (ClaimTypes.Role): role name(s) — e.g., "Admin", "Member"
        - jti (JwtRegisteredClaimNames.Jti): unique JWT ID — enables token tracking/revocation
        - iat (IssuedAt): timestamp — enables freshness checks
        - Standard exp, nbf, iss, aud are automatically added by JwtSecurityToken

        Do NOT embed permissions in the JWT because:
        1. If a user's permissions change (RolePermission table updated), the JWT cannot be
           invalidated before expiry — the user retains stale permissions.
        2. Permission lists can be large, bloating every HTTP request header.
        3. With 15-minute tokens, the window of stale permission exposure is small but non-zero.

        For HorusVis's Role → Permission hierarchy:
        - At login, embed the user's Role.Name in ClaimTypes.Role claim
        - For permission checks, use an ASP.NET Core IAuthorizationHandler that reads the
          role claim and queries the DB: RolePermissions table → Permission.Name
        - This can be cached per-role (roles change rarely) to avoid per-request DB hits
        - Authorization policy: services.AddAuthorization(opts => opts.AddPolicy("CanManageProjects",
            policy => policy.Requirements.Add(new PermissionRequirement("projects.manage"))))

        Alternative (simpler): embed comma-separated permission names in a custom "perms" claim
        if the permission set is small (< 20 entries) and the team accepts the stale-data tradeoff
        with 15-min tokens. This avoids a DB hit per authorization check.

        Current JwtTokenService already correctly embeds ClaimTypes.Role. The main addition needed
        is the jti claim (GUID per token) for refresh token correlation.
      </detail>
      <source>https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html</source>
      <relevance>
        HorusVis has User → Role → RolePermission → Permission entities. Embedding role names
        in ClaimTypes.Role (as currently done in JwtTokenService) is correct. Permissions should
        be resolved from DB via authorization handlers to avoid stale data and JWT bloat.
        Add a jti claim (Guid.NewGuid()) to enable linking access tokens to UserSessions.
      </relevance>
    </finding>

  </findings>

  <recommendations>

    <recommendation priority="high">
      <action>Reduce TokenLifetimeMinutes from 480 to 15 in JwtAuthenticationOptions and appsettings.json</action>
      <rationale>
        OWASP JWT Cheat Sheet demonstrates 15-minute tokens. Current 480-minute lifetime means
        a stolen token is usable for 8 hours with no revocation mechanism. This is the highest-risk
        issue in the codebase. Source: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
      </rationale>
    </recommendation>

    <recommendation priority="high">
      <action>Implement password hashing using PasswordHasher&lt;User&gt; (available in Microsoft.AspNetCore.App shared framework, no new NuGet package needed)</action>
      <rationale>
        The User entity has a PasswordHash field but no hasher is registered. Without this, no
        real login/register functionality can be safely implemented. PasswordHasher&lt;User&gt; uses
        PBKDF2-HMAC-SHA256 with 600,000 iterations — meets OWASP guidance for FIPS-compliant
        systems. Source: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
      </rationale>
    </recommendation>

    <recommendation priority="high">
      <action>Implement refresh token rotation using the existing UserSession entity — store SHA-256 hash, rotate on each use, invalidate all sessions on reuse detection</action>
      <rationale>
        15-minute access tokens are only usable with a token rotation mechanism. The UserSession
        entity is already correctly designed. Reuse detection (invalidating all sessions on
        hash replay) prevents silent token theft. Source: OWASP JWT Cheat Sheet token revocation section.
      </rationale>
    </recommendation>

    <recommendation priority="high">
      <action>Replace the hardcoded SigningKey with an environment variable / user-secrets before production</action>
      <rationale>
        The key "HorusVis_Local_Development_Signing_Key_Change_Me_2026" is committed to source
        control. For production, generate a cryptographically random 64-character base64 string
        stored in Azure Key Vault or environment variables. OWASP requires HS256 keys to be at
        least 64 random characters. Sources: OWASP JWT Weak Token Secret section.
      </rationale>
    </recommendation>

    <recommendation priority="medium">
      <action>Set options.RequireHttpsMetadata = !builder.Environment.IsDevelopment() in Program.cs</action>
      <rationale>
        Current hardcoded false disables HTTPS enforcement for JWT validation in all environments.
        HTTPS must be enforced in staging and production. Source: Microsoft .NET 10 JwtBearer docs.
      </rationale>
    </recommendation>

    <recommendation priority="medium">
      <action>Decide on and implement the refresh token delivery strategy: httpOnly cookie (more secure, requires CORS AllowCredentials) or sessionStorage (simpler, weaker)</action>
      <rationale>
        httpOnly cookies prevent XSS-based refresh token theft. SameSite=Strict prevents CSRF.
        This is the OWASP-preferred approach for SPAs. However, it requires adding
        .AllowCredentials() to the CORS policy and credentials: 'include' on the React side.
        Source: OWASP JWT Token Storage section and Token Sidejacking section.
      </rationale>
    </recommendation>

    <recommendation priority="medium">
      <action>Add a jti (JWT ID) claim to access tokens in JwtTokenService for token tracking</action>
      <rationale>
        A unique jti per token enables token denylist implementation if needed and can be used
        to correlate access tokens with their originating UserSession. Source: RFC 7519 (JWT spec).
      </rationale>
    </recommendation>

    <recommendation priority="low">
      <action>Add rate limiting to login and refresh endpoints to prevent brute-force attacks</action>
      <rationale>
        OWASP Authentication Cheat Sheet requires account lockout and/or rate limiting on
        authentication endpoints. ASP.NET Core 10 has built-in rate limiting middleware
        (AddRateLimiter). Source: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
      </rationale>
    </recommendation>

    <recommendation priority="low">
      <action>Return generic error messages from login endpoint ("Invalid username or password") regardless of which credential was wrong</action>
      <rationale>
        OWASP Authentication Cheat Sheet: differentiated error messages enable username
        enumeration attacks. A single generic message prevents this information leakage.
        Source: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
      </rationale>
    </recommendation>

  </recommendations>

  <code_examples>

    <!-- Example 1: Password Hashing with PasswordHasher<T> — no new packages needed -->
    <example id="1" title="Password Hashing — PasswordHasher&lt;User&gt; (PBKDF2-HMAC-SHA256, 600k iterations)">
```csharp
// Program.cs — register hasher (no new NuGet package; in Microsoft.AspNetCore.App shared framework)
using Microsoft.AspNetCore.Identity;
using HorusVis.Data.Horusvis.Entities;

builder.Services.AddScoped&lt;IPasswordHasher&lt;User&gt;, PasswordHasher&lt;User&gt;&gt;();

// ───────────────────────────────────────────────────────────────────────────

// In a UserService or AuthService — inject IPasswordHasher&lt;User&gt;
public sealed class AuthService(
    IPasswordHasher&lt;User&gt; passwordHasher,
    HorusVisDbContext db)
{
    // Registration — hash and store
    public async Task RegisterAsync(string username, string email, string plainPassword)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = username,
            Email = email,
            FullName = username,
            RoleId = /* default role GUID */,
            Status = UserStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow,
            PasswordHash = string.Empty, // placeholder
        };

        // HashPassword uses a random 128-bit salt internally; output includes salt + hash
        user.PasswordHash = passwordHasher.HashPassword(user, plainPassword);

        db.Users.Add(user);
        await db.SaveChangesAsync();
    }

    // Login — verify hash
    public async Task&lt;bool&gt; VerifyPasswordAsync(User user, string plainPassword)
    {
        var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, plainPassword);

        if (result == PasswordVerificationResult.SuccessRehashNeeded)
        {
            // Work factor was upgraded — re-hash transparently on successful login
            user.PasswordHash = passwordHasher.HashPassword(user, plainPassword);
            await db.SaveChangesAsync();
        }

        return result != PasswordVerificationResult.Failed;
    }
}
```
    </example>

    <!-- Example 2: JWT Generation — access token (15 min) + refresh token -->
    <example id="2" title="JWT Generation — Access Token (15 min) + Refresh Token">
```csharp
// Updated JwtTokenService.cs — real login token pair
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using HorusVis.Data.Horusvis.Entities;
using Microsoft.IdentityModel.Tokens;

public sealed class JwtTokenService(
    IOptions&lt;JwtAuthenticationOptions&gt; jwtOptionsAccessor,
    TimeProvider timeProvider)
{
    private readonly JwtAuthenticationOptions _opts = jwtOptionsAccessor.Value;

    /// &lt;summary&gt;Creates a 15-minute access token for the given user.&lt;/summary&gt;
    public string CreateAccessToken(User user)
    {
        var now = timeProvider.GetUtcNow();
        var jti = Guid.NewGuid().ToString("N"); // unique per token — enables tracking

        var claims = new List&lt;Claim&gt;
        {
            new(JwtRegisteredClaimNames.Sub,  user.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti,  jti),
            new(ClaimTypes.Name,              user.Username),
            new(ClaimTypes.Email,             user.Email),
            new(ClaimTypes.Role,              user.Role.Name), // embed role name only
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opts.SigningKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer:            _opts.Issuer,
            audience:          _opts.Audience,
            claims:            claims,
            notBefore:         now.UtcDateTime,
            expires:           now.AddMinutes(15).UtcDateTime, // OWASP: 15 minutes
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// &lt;summary&gt;Creates a cryptographically random refresh token (raw bytes, base64url encoded).&lt;/summary&gt;
    public static string CreateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64); // 512-bit entropy
        return Convert.ToBase64String(bytes);
    }

    /// &lt;summary&gt;Hashes a refresh token for storage in UserSession.RefreshTokenHash.&lt;/summary&gt;
    public static string HashRefreshToken(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes); // 64-char uppercase hex
    }
}
```
    </example>

    <!-- Example 3: Refresh Token Rotation + Reuse Detection (EF Core pattern) -->
    <example id="3" title="Refresh Token Rotation — EF Core Pattern with Reuse Detection">
```csharp
// RefreshTokenService.cs
using HorusVis.Data;
using HorusVis.Data.Horusvis.Entities;
using HorusVis.Data.Enums;
using Microsoft.EntityFrameworkCore;

public sealed class RefreshTokenService(
    HorusVisDbContext db,
    JwtTokenService jwtTokenService,
    TimeProvider timeProvider)
{
    private const int RefreshTokenLifetimeDays = 14;

    /// &lt;summary&gt;Issues the initial token pair after successful login.&lt;/summary&gt;
    public async Task&lt;(string AccessToken, string RefreshToken)&gt; IssueTokenPairAsync(User user)
    {
        var rawRefresh = JwtTokenService.CreateRefreshToken();
        var hash = JwtTokenService.HashRefreshToken(rawRefresh);
        var now = timeProvider.GetUtcNow();

        var session = new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            RefreshTokenHash = hash,
            CreatedAt = now,
            LastUsedAt = now,
            RefreshTokenExpiresAt = now.AddDays(RefreshTokenLifetimeDays),
            Status = UserSessionStatus.Active,
        };

        db.UserSessions.Add(session);
        await db.SaveChangesAsync();

        return (jwtTokenService.CreateAccessToken(user), rawRefresh);
    }

    /// &lt;summary&gt;
    /// Rotates the token pair. Returns null on reuse attack (all sessions revoked).
    /// &lt;/summary&gt;
    public async Task&lt;(string AccessToken, string NewRefreshToken)?&gt; RotateAsync(
        string rawRefreshToken,
        CancellationToken ct = default)
    {
        var hash = JwtTokenService.HashRefreshToken(rawRefreshToken);
        var now = timeProvider.GetUtcNow();

        // Use a transaction to prevent race conditions (concurrent refresh from same client)
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var session = await db.UserSessions
            .Include(s =&gt; s.User)
            .ThenInclude(u =&gt; u.Role)
            .FirstOrDefaultAsync(s =&gt; s.RefreshTokenHash == hash, ct);

        if (session is null)
        {
            await tx.RollbackAsync(ct);
            return null; // Token not found
        }

        // REUSE DETECTION: token was already rotated/revoked — possible theft
        if (session.RevokedAt is not null || session.Status == UserSessionStatus.Revoked)
        {
            // Invalidate ALL sessions for this user — assume token family compromise
            await db.UserSessions
                .Where(s =&gt; s.UserId == session.UserId &amp;&amp; s.Status == UserSessionStatus.Active)
                .ExecuteUpdateAsync(s =&gt; s
                    .SetProperty(x =&gt; x.RevokedAt, now)
                    .SetProperty(x =&gt; x.Status, UserSessionStatus.Revoked), ct);

            await tx.CommitAsync(ct);
            return null; // Caller should return HTTP 401
        }

        // Expiry check
        if (session.RefreshTokenExpiresAt &lt; now)
        {
            session.Status = UserSessionStatus.Revoked;
            session.RevokedAt = now;
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return null;
        }

        // Rotate: revoke old session, create new one
        session.RevokedAt = now;
        session.Status = UserSessionStatus.Revoked;

        var newRaw = JwtTokenService.CreateRefreshToken();
        var newHash = JwtTokenService.HashRefreshToken(newRaw);

        var newSession = new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = session.UserId,
            RefreshTokenHash = newHash,
            CreatedAt = now,
            LastUsedAt = now,
            RefreshTokenExpiresAt = now.AddDays(RefreshTokenLifetimeDays),
            Status = UserSessionStatus.Active,
        };

        db.UserSessions.Add(newSession);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return (jwtTokenService.CreateAccessToken(session.User), newRaw);
    }

    /// &lt;summary&gt;Revokes a single session on logout.&lt;/summary&gt;
    public async Task RevokeAsync(string rawRefreshToken, CancellationToken ct = default)
    {
        var hash = JwtTokenService.HashRefreshToken(rawRefreshToken);
        var now = timeProvider.GetUtcNow();

        await db.UserSessions
            .Where(s =&gt; s.RefreshTokenHash == hash &amp;&amp; s.Status == UserSessionStatus.Active)
            .ExecuteUpdateAsync(s =&gt; s
                .SetProperty(x =&gt; x.RevokedAt, now)
                .SetProperty(x =&gt; x.Status, UserSessionStatus.Revoked), ct);
    }
}
```
    </example>

    <!-- Example 4: Updated Program.cs JWT configuration -->
    <example id="4" title="Program.cs JWT Configuration — Production-Ready Updates">
```csharp
// Updated sections of Program.cs

// 1. CORS — add AllowCredentials() ONLY if using httpOnly cookie for refresh token
builder.Services.AddCors(corsOptions =&gt;
{
    corsOptions.AddDefaultPolicy(policy =&gt;
    {
        policy.WithOrigins(frontendOrigin)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // Required for httpOnly cookie approach
    });
});

// 2. JwtBearer — environment-conditional HTTPS enforcement
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =&gt;
    {
        // FIXED: use environment variable, not hardcoded false
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1), // tight clock skew — keep as is
            NameClaimType = ClaimTypes.Name,
            RoleClaimType = ClaimTypes.Role,
        };
    });

// 3. PasswordHasher — register without any new NuGet package
builder.Services.AddScoped&lt;IPasswordHasher&lt;User&gt;, PasswordHasher&lt;User&gt;&gt;();

// 4. Refresh token cookie options (for httpOnly cookie delivery)
// In the login controller endpoint:
// Response.Cookies.Append("refresh_token", rawRefreshToken, new CookieOptions
// {
//     HttpOnly = true,
//     Secure = !env.IsDevelopment(),
//     SameSite = SameSiteMode.Strict,
//     Expires = DateTimeOffset.UtcNow.AddDays(14),
//     Path = "/api/auth/refresh", // restrict cookie to refresh endpoint only
// });
```
    </example>

  </code_examples>

  <packages_needed>
    No new NuGet packages are required beyond what is already in Directory.Packages.props.

    - Microsoft.AspNetCore.Identity.PasswordHasher&lt;T&gt;: Available via Microsoft.AspNetCore.App
      shared framework (Microsoft.NET.Sdk.Web target). No explicit package reference needed in
      HorusVis.Web.csproj.

    - All JWT functionality (JwtSecurityToken, JwtSecurityTokenHandler, TokenValidationParameters,
      SecurityAlgorithms, SymmetricSecurityKey): Already available via
      Microsoft.AspNetCore.Authentication.JwtBearer v10.0.0 (already in Directory.Packages.props).

    - SHA256, RandomNumberGenerator: System.Security.Cryptography namespace in .NET BCL — no package needed.

    Optional (if the team prefers Argon2id over PBKDF2):
    - Isopoh.Cryptography.Argon2 — latest stable (pure .NET Argon2id implementation)
      OR
    - BCrypt.Net-Next v4.x — for bcrypt with work factor 12 (well-maintained, widely used)

    The recommendation is to start with the built-in PasswordHasher&lt;User&gt; (zero friction, FIPS-compatible)
    and migrate to Argon2id in a future iteration if stronger password security is required.
  </packages_needed>

  <metadata>
    <confidence level="high">
      All 7 gap areas were answered from official OWASP cheat sheets (fetched live April 8, 2026)
      and official Microsoft .NET 10 documentation. The project source code was read directly to
      confirm current configuration values (480-minute lifetime, HS256, no hasher registered,
      UserSession entity fields). Code examples are based on actual entity shapes and existing
      service patterns in the codebase.
    </confidence>

    <dependencies>
      1. The data migration for UserSession must be complete before implementing refresh token
         rotation (the db.ef.update output was exit code 0 — confirmed in terminal context).
      2. A login controller endpoint must exist before password hashing can be exercised.
      3. CORS AllowCredentials() (if chosen) must be implemented before browser-based SPA can
         send httpOnly refresh token cookies.
    </dependencies>

    <open_questions>
      1. Token storage strategy decision: httpOnly cookie for refresh token (requires CORS changes
         and credentials: 'include' in React) vs. sessionStorage for both tokens (simpler, weaker).
         This is a team decision with UX and security tradeoffs.

      2. Access token lifetime: 15 minutes is the OWASP recommendation. Some teams use 5 minutes
         for high-security apps or 30 minutes for better UX. Final value needs team sign-off.

      3. Argon2id vs PBKDF2: OWASP prefers Argon2id. Built-in PasswordHasher&lt;User&gt; uses PBKDF2.
         Both are acceptable. The team should decide based on dependencies preference.

      4. Refresh token lifetime: 14 days used in code examples. Could be 7 days (more secure) or
         30 days (better UX for infrequent users). Team decides based on target user behavior.

      5. Permission embedding: small permission sets (&lt; 20) can be embedded in JWT claims for
         simplicity. Large/dynamic permission sets require DB lookup per authorization check.
    </open_questions>

    <assumptions>
      - Single-tenant, single service (not microservices) — confirmed by codebase structure
      - SPA frontend (React on port 5173) communicating via REST API
      - PostgreSQL database via Npgsql 10.0.0 — confirmed in Directory.Packages.props
      - No external identity provider (no OAuth/OIDC integration present)
      - The UserSession migration has been applied (terminal shows exit code 0 for db update)
    </assumptions>

    <quality_report>
      <sources_consulted>
        1. https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html — fetched live
        2. https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html — fetched live
        3. https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html — fetched live
        4. https://learn.microsoft.com/en-us/aspnet/core/security/authentication/jwt-authn?view=aspnetcore-10.0 — fetched live
        5. https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity?view=aspnetcore-10.0 — fetched live
        6. Project source: HorusVis.Web/Program.cs — read directly
        7. Project source: HorusVis.Web/Options/JwtAuthenticationOptions.cs — read directly (TokenLifetimeMinutes = 480 confirmed)
        8. Project source: HorusVis.Web/Services/Authentication/JwtTokenService.cs — read directly
        9. Project source: HorusVis.Data/Horusvis/Entities/User.cs — read directly
        10. Project source: HorusVis.Data/Horusvis/Entities/UserSession.cs — read directly
        11. Project source: backend/Directory.Packages.props — read directly (no BCrypt/Argon2 packages present)
        12. Project source: HorusVis.Web/appsettings.json — read directly (480-minute lifetime confirmed)
      </sources_consulted>

      <verified_claims>
        - TokenLifetimeMinutes = 480 confirmed in appsettings.json and JwtAuthenticationOptions.cs defaults
        - OWASP JWT cheat sheet fingerprint example uses 15-minute tokens (c.add(Calendar.MINUTE, 15))
        - OWASP Password Storage recommends Argon2id first, PBKDF2 fourth
        - PBKDF2-HMAC-SHA256 requires 600,000 iterations per OWASP 2026 guidance
        - UserSession entity has RefreshTokenHash, RefreshTokenExpiresAt, RevokedAt, Status — all present
        - PasswordHasher&lt;T&gt; is in Microsoft.AspNetCore.Identity namespace (shared framework)
        - options.RequireHttpsMetadata = false is present in current Program.cs
        - No additional packages (BCrypt, Argon2) in Directory.Packages.props
        - HS256 (SecurityAlgorithms.HmacSha256) confirmed in JwtTokenService.cs
        - CORS policy does NOT have AllowCredentials() in current Program.cs
      </verified_claims>

      <assumed_claims>
        - PasswordHasher&lt;T&gt; is available via Microsoft.AspNetCore.App without explicit package reference
          (based on knowledge of .NET 10 shared framework; not verified by running dotnet build)
        - JwtBearer v10.0.0 has no breaking API changes from v9 (based on Microsoft docs which do not
          list breaking changes; the docs page was about dotnet user-jwts tool, not API changelog)
        - The missing OWASP-specific access token lifetime recommendation (not an exact number in the
          cheat sheet text) was inferred from the 15-minute Java code example in the cheat sheet
      </assumed_claims>
    </quality_report>
  </metadata>

</research>
