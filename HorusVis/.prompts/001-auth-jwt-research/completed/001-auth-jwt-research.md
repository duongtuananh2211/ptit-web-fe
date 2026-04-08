# Prompt: JWT Authentication Research — .NET 10 + EF Core

## Metadata
- **Purpose**: Research
- **Topic**: auth-jwt
- **Output**: `.prompts/001-auth-jwt-research/auth-jwt-research.md`
- **SUMMARY**: `.prompts/001-auth-jwt-research/SUMMARY.md`

---

<session_initialization>
Before beginning research, verify today's date:
!`date +%Y-%m-%d`

Use this date when verifying "latest" or "current" information. If today is 2026-04-08 or later, prioritize .NET 10 (released Nov 2025) documentation over .NET 9 or older sources.
</session_initialization>

<research_objective>
Research JWT authentication best practices for a .NET 10 ASP.NET Core API backed by EF Core 10 with PostgreSQL.

**Purpose**: Inform implementation of a complete, production-grade authentication system: login endpoint, JWT access tokens, refresh token rotation, and password hashing.

**Scope**: Covers the authentication flow end-to-end — from password verification through JWT issuance, refresh token storage in the database, and token revocation.

**Output**: `auth-jwt-research.md` with structured findings and actionable recommendations.
</research_objective>

<project_context>
The HorusVis project already has the following in place — research should confirm, validate, or improve on these:

**Already wired up:**
- `Microsoft.AspNetCore.Authentication.JwtBearer` v10.0.0
- JWT configured in `Program.cs` — HS256 signing, 480-minute access token lifetime, issuer `HorusVis`
- `JwtTokenService` / `IJwtTokenService` in `HorusVis.Web`
- Database entities: `User` (with `PasswordHash`), `Role`, `UserSession` (stores `RefreshTokenHash`, `RefreshTokenExpiresAt`, `RevokedAt`), `Permission`, `RolePermission`
- `HorusVisDbContext` (PostgreSQL via Npgsql 10.0.0)

**Gaps to research:**
1. Password hashing: No `IPasswordHasher` or BCrypt/Argon2 usage found. What is the .NET 10 idiomatic approach?
2. Refresh token rotation: `UserSession` entity exists but no implementation. What is the correct EF Core pattern (including revocation and cleanup)?
3. Access token lifetime: 480 minutes is very long for an access token. What does OWASP recommend? What is a common standard?
4. Secure token storage on the client side: httpOnly cookie vs. localStorage vs. Authorization header — what is correct for an SPA?
5. Algorithm choice: HS256 vs RS256/ES256 — when does it matter? Is HS256 appropriate here?
6. .NET 10 specifics: Any new APIs, breaking changes, or new defaults in `Microsoft.AspNetCore.Authentication.JwtBearer` v10.0.0 vs v8/v9?
7. Role/Permission claims: Best practices for embedding roles and permissions in JWT without bloating the token.
</project_context>

<research_scope>
<include>
- Password hashing algorithms suitable for .NET 10 (ASP.NET Core Identity PasswordHasher, BCrypt.Net-Next, Argon2)
- JWT access token best practices: payload structure, lifetime, signing algorithm
- Refresh token rotation: database pattern, hashing the refresh token, detecting token reuse (refresh token rotation attack)
- Token revocation and `UserSession` table usage
- OWASP recommendations for JWT and refresh tokens
- SPA token storage: httpOnly cookie vs Authorization header with in-memory
- .NET 10 / ASP.NET Core 10 JWT changes or improvements
- Claims design: roles, permissions, minimal vs. rich payload
</include>

<exclude>
- OAuth2 / OIDC / external identity providers (Azure AD, Auth0) — out of scope
- Blazor / Razor Pages authentication — this is an API-only backend
- Multi-tenant patterns — single tenant for now
- Rate limiting and brute-force protection — defer to a separate research prompt
</exclude>

<sources>
Thoroughly analyze with extended thinking — there are multiple valid approaches to evaluate and security tradeoffs to weigh carefully.

Official documentation (use WebFetch):
- https://learn.microsoft.com/en-us/aspnet/core/security/authentication/jwt-authn?view=aspnetcore-10.0
- https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity?view=aspnetcore-10.0
- https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.identity.ipasswordhasher-1
- https://owasp.org/www-project-cheat-sheets/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- https://learn.microsoft.com/en-us/aspnet/core/whats-new/dotnet-10?view=aspnetcore-10.0

Search queries (use WebSearch):
- "ASP.NET Core 10 JWT bearer authentication best practices 2025"
- "refresh token rotation EF Core .NET 8 OR .NET 9 OR .NET 10"
- "OWASP refresh token rotation detect reuse"
- "Argon2 vs BCrypt .NET 2025"
- "ASP.NET Core JwtBearer 10.0.0 breaking changes"
- "httpOnly cookie vs localStorage JWT SPA security 2025"
</sources>
</research_scope>

<verification_checklist>
□ Verify password hashing: confirm which algorithm (PBKDF2, BCrypt, Argon2) is recommended by OWASP Password Storage guide in 2026
□ Verify access token lifetime: confirm OWASP recommended range (typically 5–15 minutes)
□ Verify refresh token rotation attack detection: confirm the "family invalidation" or "reuse detection" pattern
□ Verify HS256 appropriateness for single-service API (vs RS256 multi-service)
□ Verify httpOnly cookie security implications for SPA with CORS
□ Verify .NET 10 `JwtBearer` API for any new defaults or breaking changes vs v9
□ Confirm that `Microsoft.AspNetCore.Identity.PasswordHasher<T>` is usable WITHOUT full ASP.NET Identity infrastructure
□ Document exact NuGet package names and versions for any new dependencies needed
□ Verify negative claims with official sources
□ Check OWASP JWT cheatsheet was not updated after 2025-01-01 with new guidance
</verification_checklist>

<research_quality_assurance>
<completeness_check>
- [ ] All 7 gap areas from project_context addressed with evidence
- [ ] Each recommendation evaluated against OWASP guidance
- [ ] Official documentation cited with URLs for critical claims
- [ ] Contradictory information (e.g., "use httpOnly cookie" vs "use Authorization header") resolved or explicitly flagged as a decision point
</completeness_check>

<source_verification>
- [ ] Primary claims backed by official Microsoft or OWASP sources
- [ ] NuGet package versions verified (not assumed)
- [ ] .NET 10 specific behavior confirmed (not assumed from .NET 8/9 behavior)
- [ ] Distinguish verified facts from assumptions
</source_verification>

<blind_spots_review>
- [ ] Did I check whether `Microsoft.AspNetCore.Authentication.JwtBearer` v10.0.0 has new builder APIs vs v9?
- [ ] Did I verify the `UserSession` table can support multiple concurrent sessions per user (mobile + web)?
- [ ] Did I consider token clock skew and `ClockSkew` property in `TokenValidationParameters`?
- [ ] Did I check if `Npgsql 10.0.0` has any breaking changes relevant to DateTimeOffset (used in `UserSession`)?
</blind_spots_review>

<critical_claims_audit>
- [ ] "480 minutes is too long" — verify with OWASP
- [ ] "HS256 is insecure" — verify this is context-dependent, not absolute
- [ ] "localStorage is always vulnerable" — verify with nuanced explanation
</critical_claims_audit>
</research_quality_assurance>

<output_structure>
Save research to: `.prompts/001-auth-jwt-research/auth-jwt-research.md`

Use this XML structure:

```xml
<research>
  <summary>
    {2-3 paragraph executive summary}
  </summary>

  <findings>
    <finding category="password-hashing">
      <title>{Finding title}</title>
      <detail>{Detailed explanation}</detail>
      <source>{URL or source}</source>
      <relevance>{Why this matters for HorusVis}</relevance>
    </finding>

    <finding category="access-token">...</finding>
    <finding category="refresh-token-rotation">...</finding>
    <finding category="token-storage-client">...</finding>
    <finding category="signing-algorithm">...</finding>
    <finding category="dotnet10-specifics">...</finding>
    <finding category="claims-design">...</finding>
  </findings>

  <recommendations>
    <recommendation priority="high">
      <action>{Concrete action}: e.g., "Replace HS256 with X" or "Keep HS256 because Y"</action>
      <rationale>{Why, with source reference}</rationale>
    </recommendation>
    <!-- Priority: high = must do, medium = should do, low = nice to have -->
  </recommendations>

  <code_examples>
    <!-- Concrete .NET 10 / C# code for:
         1. Password hashing (chosen algorithm)
         2. JWT token generation (access + refresh)
         3. Refresh token rotation (EF Core pattern with reuse detection)
         4. Token validation in Program.cs (any .NET 10 improvements)
    -->
  </code_examples>

  <packages_needed>
    <!-- List any NEW NuGet packages needed beyond what's already referenced.
         Format: <package name="X" version="Y" reason="Z" /> -->
  </packages_needed>

  <metadata>
    <confidence level="{high|medium|low}">
      {Explanation}
    </confidence>
    <dependencies>
      {Prerequisites to act on these findings}
    </dependencies>
    <open_questions>
      {What remains uncertain or requires team decision}
    </open_questions>
    <assumptions>
      - Single-tenant, single service (not microservices)
      - SPA frontend (React) communicating via REST API
      - PostgreSQL database (Npgsql 10.0.0)
      - No external identity provider
    </assumptions>
    <quality_report>
      <sources_consulted>
        <!-- List all URLs actually fetched or searched -->
      </sources_consulted>
      <verified_claims>
        <!-- Claims confirmed by official sources -->
      </verified_claims>
      <assumed_claims>
        <!-- Claims inferred without direct verification -->
      </assumed_claims>
    </quality_report>
  </metadata>
</research>
```

After saving `auth-jwt-research.md`, create `SUMMARY.md` in the same folder:

```markdown
# Auth JWT Research Summary

**{Substantive one-liner, e.g., "PBKDF2 for passwords, 15-min access tokens with 7-day rotating refresh tokens recommended for HorusVis .NET 10"}**

## Version
v1

## Key Findings
- {Most critical security finding}
- {Password hashing recommendation}
- {Token lifetime recommendation}
- {Refresh token rotation pattern}
- {Client storage recommendation}

## Decisions Needed
- {e.g., "Confirm acceptable access token lifetime (OWASP: 5–15 min vs current 480 min)"}
- {e.g., "Confirm token storage strategy: httpOnly cookie vs Authorization header"}

## Blockers
{None, or list external blockers}

## Next Step
Create auth-jwt-plan.md to design implementation phases for login endpoint, refresh endpoint, and JWT middleware.

---
*Confidence: {High|Medium|Low}*
*Iterations: 1*
*Full output: auth-jwt-research.md*
```
</output_structure>
