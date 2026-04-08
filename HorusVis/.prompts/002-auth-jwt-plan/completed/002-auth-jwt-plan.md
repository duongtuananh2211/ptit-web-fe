# Prompt: JWT Authentication Implementation Plan — .NET 10 + EF Core

## Metadata
- **Purpose**: Plan
- **Topic**: auth-jwt
- **References**: `.prompts/001-auth-jwt-research/auth-jwt-research.md`
- **Output**: `.prompts/002-auth-jwt-plan/auth-jwt-plan.md`
- **SUMMARY**: `.prompts/002-auth-jwt-plan/SUMMARY.md`

---

<objective>
Create a detailed, phase-by-phase implementation plan for JWT authentication in HorusVis (.NET 10, EF Core 10, PostgreSQL).

**Purpose**: Produce a plan concrete enough that each phase can be executed by a single Do prompt — with exact files to create/modify, interfaces to define, and tests to write.

**Input**: Research findings from `001-auth-jwt-research/auth-jwt-research.md`
**Output**: `auth-jwt-plan.md` with phased tasks, deliverables, and decision checkpoints
</objective>

<context>
Research findings: @.prompts/001-auth-jwt-research/auth-jwt-research.md

Key findings to incorporate (use the full research for detail):
- **PasswordHasher<User>**: Use `Microsoft.AspNetCore.Identity.PasswordHasher<User>` (PBKDF2-HMAC-SHA256, 600k iterations) — zero new NuGet packages needed
- **Access token lifetime**: MUST reduce from 480 min → 15 min (OWASP critical)
- **Refresh token rotation**: Store SHA-256 hash in `UserSession.RefreshTokenHash`; rotate on every use; revoke all sessions on replay detection (family invalidation)
- **Client storage**: httpOnly + Secure + SameSite=Strict cookie for refresh token; sessionStorage/in-memory for access token
- **HS256**: Appropriate — keep as-is
- **Claims**: `sub`, `name`, `email`, `role`, `jti` — permissions looked up via DB
- **No new NuGet packages needed**
- **`RequireHttpsMetadata`**: Must become environment-conditional

Existing project structure to plan around:
- `HorusVis.Business/` — Services, Contracts (interfaces)
- `HorusVis.Web/` — Controllers, Options, Services (JWT already here)
- `HorusVis.Core/` — Extensions, Options
- `HorusVis.Data/` — Entities, DbContext (separate project, referenced by Business)
- DB entities already in place: `User`, `Role`, `UserSession`, `Permission`, `RolePermission`
- `HorusVisDbContext` already wired up
- `JwtTokenService` / `IJwtTokenService` already exists in `HorusVis.Web/Services/Authentication/`
- `JwtAuthenticationOptions` already exists in `HorusVis.Web/Options/`
</context>

<planning_requirements>
The plan must address ALL of the following:

1. **Password service** — `IPasswordService` + `PasswordService` using `PasswordHasher<User>`; register in DI
2. **AuthService** — `IAuthService` + `AuthService` in `HorusVis.Business/`: handles login logic (find user, verify password, issue tokens), register logic (hash password, create user)
3. **Refresh token service** — logic for issuing, rotating, and revoking `UserSession` records
4. **Auth controller** — `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `POST /api/auth/register`; cookie + bearer response strategy
5. **JWT configuration update** — reduce token lifetime to 15 minutes; make `RequireHttpsMetadata` environment-conditional
6. **CORS update** — add `AllowCredentials()` + configure allowed origin for cookie strategy
7. **Request/response contracts** — `LoginRequest`, `LoginResponse`, `RefreshRequest`, `RegisterRequest` (in `HorusVis.Web/Contracts/` or `HorusVis.Business/Contracts/`)
8. **Tests** — unit tests for `AuthService`, `PasswordService`, `JwtTokenService` in `HorusVis.Business.Tests/` and `HorusVis.Web.Tests/`

Constraints:
- No new NuGet packages (all needed classes are in the existing shared framework)
- `PasswordHasher<User>` must be registerered as `IPasswordHasher<User>` in DI via `services.AddIdentityCore<User>()` or `services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>()`
- Follow existing project conventions: interfaces in `Contracts/`, implementations in `Services/`
- All `UserSession` DB operations via `HorusVisDbContext` (not a separate repository layer — keep it simple)
- `JwtTokenService` already exists — the plan should extend/modify it or call it from `AuthService`, not replace it wholesale

Phase granularity: Each phase should be **completable by one Do prompt in one pass** — not too large, not too small.
</planning_requirements>

<output_structure>
Save plan to: `.prompts/002-auth-jwt-plan/auth-jwt-plan.md`

Use this exact XML structure:

```xml
<plan>
  <summary>
    {One paragraph overview of the phased approach, total phases, key architectural decisions}
  </summary>

  <decisions>
    <!-- Resolve the open decisions from research before planning phases.
         State the chosen approach and brief rationale. -->
    <decision topic="access-token-lifetime">
      <chosen>{e.g., 15 minutes}</chosen>
      <rationale>{Brief rationale}</rationale>
    </decision>
    <decision topic="token-storage-strategy">
      <chosen>{httpOnly cookie for refresh token OR sessionStorage for both}</chosen>
      <rationale>{Brief rationale}</rationale>
    </decision>
    <decision topic="password-algorithm">
      <chosen>{PasswordHasher<User> / BCrypt / Argon2}</chosen>
      <rationale>{Brief rationale}</rationale>
    </decision>
    <decision topic="refresh-token-lifetime">
      <chosen>{7 / 14 / 30 days}</chosen>
      <rationale>{Brief rationale}</rationale>
    </decision>
  </decisions>

  <phases>
    <phase number="1" name="password-service">
      <objective>{What this phase accomplishes}</objective>
      <files>
        <!-- List EXACT file paths to create or modify -->
        <create>backend/src/HorusVis.Business/Contracts/IPasswordService.cs</create>
        <create>backend/src/HorusVis.Business/Services/PasswordService.cs</create>
        <modify>backend/src/HorusVis.Business/ServiceCollectionExtensions.cs</modify>
        <!-- etc. -->
      </files>
      <tasks>
        <task priority="high">{Specific actionable task with exact interface/method signatures}</task>
        <task priority="high">{Another specific task}</task>
        <task priority="medium">{Test task}</task>
      </tasks>
      <deliverables>
        <deliverable>{Testable outcome}</deliverable>
      </deliverables>
      <dependencies>None — first phase</dependencies>
    </phase>

    <phase number="2" name="auth-service">
      <objective>...</objective>
      <files>...</files>
      <tasks>...</tasks>
      <deliverables>...</deliverables>
      <dependencies>Phase 1 (IPasswordService)</dependencies>
    </phase>

    <phase number="3" name="refresh-token-rotation">
      <objective>...</objective>
      <files>...</files>
      <tasks>...</tasks>
      <deliverables>...</deliverables>
      <dependencies>Phase 2 (IAuthService)</dependencies>
    </phase>

    <phase number="4" name="auth-controller">
      <objective>...</objective>
      <files>...</files>
      <tasks>...</tasks>
      <deliverables>...</deliverables>
      <dependencies>Phase 3 (refresh token service)</dependencies>
    </phase>

    <phase number="5" name="config-and-cors-hardening">
      <objective>Reduce token lifetime to 15 min; env-conditional HTTPS requirement; CORS AllowCredentials</objective>
      <files>...</files>
      <tasks>...</tasks>
      <deliverables>...</deliverables>
      <dependencies>Phase 4 (auth endpoints working)</dependencies>
    </phase>
  </phases>

  <interface_contracts>
    <!-- Specify the key interfaces so Do prompts can implement consistently -->

    <interface name="IPasswordService">
      <method>string HashPassword(User user, string plainPassword)</method>
      <method>bool VerifyPassword(User user, string hashedPassword, string providedPassword)</method>
    </interface>

    <interface name="IAuthService">
      <method>Task&lt;AuthResult&gt; LoginAsync(LoginRequest request, CancellationToken ct)</method>
      <method>Task RegisterAsync(RegisterRequest request, CancellationToken ct)</method>
      <method>Task&lt;AuthResult&gt; RefreshAsync(string refreshToken, CancellationToken ct)</method>
      <method>Task LogoutAsync(string refreshToken, CancellationToken ct)</method>
    </interface>

    <type name="AuthResult">
      <property>string AccessToken</property>
      <property>string? RefreshToken (null if using cookie strategy)</property>
      <property>DateTimeOffset AccessTokenExpiresAt</property>
    </type>
  </interface_contracts>

  <metadata>
    <confidence level="high">
      {Explanation — research is thorough, entities are designed, no unknowns}
    </confidence>
    <dependencies>
      {What must exist before Phase 1 can start}
    </dependencies>
    <open_questions>
      {Any unresolved items that might affect a phase}
    </open_questions>
    <assumptions>
      - PasswordHasher&lt;User&gt; registered directly (no full ASP.NET Identity)
      - Refresh token delivered via httpOnly cookie by default (unless team decides otherwise)
      - No repository pattern — DbContext used directly in AuthService
      - Existing JwtTokenService extended, not replaced
    </assumptions>
  </metadata>
</plan>
```

After saving `auth-jwt-plan.md`, create `SUMMARY.md`:

```markdown
# Auth JWT Plan Summary

**{Substantive one-liner, e.g., "5-phase plan: password service → auth service → refresh rotation → controller → config hardening; all within existing project structure, zero new NuGet packages"}**

## Version
v1

## Key Findings
- Phase 1: {name} — {one-sentence objective}
- Phase 2: {name} — {one-sentence objective}
- Phase 3: {name} — {one-sentence objective}
- Phase 4: {name} — {one-sentence objective}
- Phase 5: {name} — {one-sentence objective}

## Decisions Made
- Access token lifetime: {chosen value}
- Refresh token storage: {chosen strategy}
- Password algorithm: {chosen algorithm}
- Refresh token lifetime: {chosen value}

## Decisions Needed (Still Open)
{Any decisions that require team input before implementation can start, or "None — plan is fully actionable"}

## Blockers
None

## Next Step
Run Phase 1 Do prompt: implement IPasswordService + PasswordService in HorusVis.Business

---
*Confidence: High*
*Iterations: 1*
*Full output: auth-jwt-plan.md*
*Based on: 001-auth-jwt-research*
```
</output_structure>

<success_criteria>
- All 5 phases defined with exact file paths
- Interface contracts specified so Do prompts can implement consistently
- 4 open decisions from research explicitly resolved with rationale
- Each phase scoped to be completable by one Do prompt
- No phase creates an unresolvable dependency on an external system
- SUMMARY.md has substantive one-liner and phase breakdown
- Plan is immediately actionable — no blocking unknowns
</success_criteria>
