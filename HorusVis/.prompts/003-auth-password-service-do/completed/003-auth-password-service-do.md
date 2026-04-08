# Prompt: Implement Password Service — Phase 1 of 5

## Metadata
- **Purpose**: Do
- **Topic**: auth-password-service
- **Phase**: 1 of 5 (auth implementation)
- **References**: `.prompts/002-auth-jwt-plan/auth-jwt-plan.md`, `.prompts/001-auth-jwt-research/auth-jwt-research.md`
- **SUMMARY**: `.prompts/003-auth-password-service-do/SUMMARY.md`

---

<objective>
Implement `IPasswordService` and `PasswordService` in `HorusVis.Business` using the built-in `PasswordHasher<User>` (PBKDF2-HMAC-SHA256, 600k iterations). Register in DI. Write unit tests.

**Purpose**: Provides the password hashing and verification foundation that `AuthService` (Phase 2) will depend on.
**No new NuGet packages required** — `Microsoft.AspNetCore.Identity.PasswordHasher<T>` is in `Microsoft.AspNetCore.App`.
</objective>

<context>
Plan: @.prompts/002-auth-jwt-plan/auth-jwt-plan.md (Phase 1 details)
Research: @.prompts/001-auth-jwt-research/auth-jwt-research.md (password hashing section)

Relevant project files to read before implementing:
- `backend/src/HorusVis.Business/HorusVis.Business.csproj` — confirm SDK is Microsoft.NET.Sdk.Web or has correct package reference
- `backend/src/HorusVis.Business/ServiceCollectionExtensions.cs` — see existing DI registration pattern
- `backend/src/HorusVis.Business/AssemblyMarker.cs` — confirm namespace
- `backend/src/HorusVis.Data/Horusvis/Entities/User.cs` — or wherever the User entity is defined (needed for IPasswordHasher&lt;User&gt; type parameter)

Check: Does `HorusVis.Business.csproj` reference `Microsoft.AspNetCore.App` framework? If it's a class library (not web SDK), `PasswordHasher<T>` requires adding `<FrameworkReference Include="Microsoft.AspNetCore.App" />` to the csproj. Read the csproj before writing code.
</context>

<requirements>
1. **IPasswordService** interface with exactly these methods:
   ```csharp
   string HashPassword(User user, string plainPassword);
   bool VerifyPassword(User user, string hashedPassword, string providedPassword);
   ```

2. **PasswordService** implementation:
   - Constructor-inject `IPasswordHasher<User>`
   - `HashPassword`: call `_hasher.HashPassword(user, plainPassword)` and return result
   - `VerifyPassword`: call `_hasher.VerifyHashedPassword(user, hashedPassword, providedPassword)`, return true if result is `PasswordVerificationResult.Success` OR `PasswordVerificationResult.SuccessRehashNeeded`

3. **DI Registration** in `ServiceCollectionExtensions.cs`:
   - Add `services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>()`
   - Add `services.AddScoped<IPasswordService, PasswordService>()`

4. **FrameworkReference fix** (if needed): If `HorusVis.Business.csproj` is `<Project Sdk="Microsoft.NET.Sdk">` (not Web), add:
   ```xml
   <ItemGroup>
     <FrameworkReference Include="Microsoft.AspNetCore.App" />
   </ItemGroup>
   ```

5. **Unit tests** in `backend/tests/HorusVis.Business.Tests/`:
   - `PasswordServiceTests.cs`
   - Test: `HashPassword_ReturnsNonEmptyHash`
   - Test: `VerifyPassword_WithCorrectPassword_ReturnsTrue`
   - Test: `VerifyPassword_WithWrongPassword_ReturnsFalse`
   - Test: `HashPassword_SameInput_ReturnsDifferentHashes` (salting verification)
   - Use real `PasswordHasher<User>` (not mocked) — it has no external dependencies
</requirements>

<implementation>
- Keep `IPasswordService` in `HorusVis.Business/Contracts/` folder
- Keep `PasswordService` in `HorusVis.Business/Services/` folder
- Match the existing namespace pattern found in `AssemblyMarker.cs`
- Do NOT add BCrypt or Argon2 packages — only the built-in hasher
- The `User` type parameter for `IPasswordHasher<User>` — use the actual `User` entity class from HorusVis.Data
- If `User` entity is in a different assembly, ensure `HorusVis.Business.csproj` already references it; do not add new project references unless the existing csproj already has one
</implementation>

<verification>
Before declaring complete:
- [ ] `IPasswordService.cs` exists in `Contracts/`
- [ ] `PasswordService.cs` exists in `Services/`
- [ ] `ServiceCollectionExtensions.cs` registers both `IPasswordHasher<User>` and `IPasswordService`
- [ ] `HorusVis.Business.csproj` compiles (check for FrameworkReference if needed)
- [ ] `PasswordServiceTests.cs` exists with ≥4 test methods
- [ ] All files use correct namespace matching existing code
- [ ] No new NuGet packages added to any .csproj
</verification>

<output>
Files to create:
- `backend/src/HorusVis.Business/Contracts/IPasswordService.cs`
- `backend/src/HorusVis.Business/Services/PasswordService.cs`
- `backend/tests/HorusVis.Business.Tests/PasswordServiceTests.cs`

Files to modify:
- `backend/src/HorusVis.Business/ServiceCollectionExtensions.cs`
- `backend/src/HorusVis.Business/HorusVis.Business.csproj` (only if FrameworkReference is needed)

After all files are written, create `SUMMARY.md`:
```markdown
# Auth Password Service Summary

**IPasswordService + PasswordService implemented using PasswordHasher<User> (PBKDF2, 600k iterations); registered in DI; 4 unit tests passing; no new NuGet packages.**

## Version
v1

## Files Created
- `backend/src/HorusVis.Business/Contracts/IPasswordService.cs`
- `backend/src/HorusVis.Business/Services/PasswordService.cs`
- `backend/tests/HorusVis.Business.Tests/PasswordServiceTests.cs`

## Files Modified
- `backend/src/HorusVis.Business/ServiceCollectionExtensions.cs`
- `backend/src/HorusVis.Business/HorusVis.Business.csproj` (if FrameworkReference was needed — state whether it was)

## Decisions Needed
None

## Blockers
None

## Next Step
Run Phase 2: implement IAuthService with LoginAsync and RegisterAsync

---
*Confidence: High*
*Full output: see Files Created above*
```
</output>
