using System.Security.Claims;
using System.Text;
using HorusVis.Business;
using HorusVis.Business.Contracts;
using HorusVis.Core.Options;
using HorusVis.Data;
using HorusVis.Web.Options;
using HorusVis.Web.Services.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);
builder.Services.Configure<HorusVisOptions>(
	builder.Configuration.GetSection(HorusVisOptions.SectionName));
builder.Services.Configure<JwtAuthenticationOptions>(
	builder.Configuration.GetSection(JwtAuthenticationOptions.SectionName));

var frontendOrigin = builder.Configuration.GetValue<string>($"{HorusVisOptions.SectionName}:FrontendOrigin")
	?? "http://localhost:5173";
var jwtOptions = builder.Configuration.GetSection(JwtAuthenticationOptions.SectionName)
	.Get<JwtAuthenticationOptions>()
	?? new JwtAuthenticationOptions();
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey));

builder.Services.AddProblemDetails();
builder.Services.AddRouting();
builder.Services.AddCors(corsOptions =>
{
	corsOptions.AddDefaultPolicy(policy =>
	{
		policy.WithOrigins(frontendOrigin)
			.AllowAnyHeader()
			.AllowAnyMethod()
			.AllowCredentials();
	});
});
builder.Services.AddControllers();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
	.AddJwtBearer(options =>
	{
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
			ClockSkew = TimeSpan.Zero,
			NameClaimType = ClaimTypes.Name,
			RoleClaimType = ClaimTypes.Role,
		};
	});
builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
	options.SwaggerDoc("v1", new OpenApiInfo
	{
		Title = "HorusVis API",
		Version = "v1",
		Description = "Scaffold API for HorusVis.",
	});

	options.AddSecurityDefinition("bearerAuth", new OpenApiSecurityScheme
	{
		Type = SecuritySchemeType.Http,
		Scheme = "Bearer",
		BearerFormat = "JWT",
		Description = "Paste a bearer token returned from POST /api/auth/login.",
	});

	options.AddSecurityRequirement(new OpenApiSecurityRequirement
	{
		{
			new OpenApiSecurityScheme
			{
				Reference = new OpenApiReference
				{
					Type = ReferenceType.SecurityScheme,
					Id = "bearerAuth",
				},
			},
			Array.Empty<string>()
		}
	});
});
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<ITokenGenerator>(sp => (ITokenGenerator)sp.GetRequiredService<IJwtTokenService>());
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddHealthChecks()
	.AddDbContextCheck<HorusVis.Data.Persistence.HorusVisDbContext>("database");
builder.Services.AddHorusVisBusiness();
builder.Services.AddHorusVisData(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
	app.UseSwagger();
	app.UseSwaggerUI();
	app.MapGet("/", () => Results.Redirect("/swagger"));
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapHealthChecks("/api/admin/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
	ResultStatusCodes =
	{
		[Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Healthy]   = 200,
		[Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Degraded]  = 200,
		[Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Unhealthy] = 503,
	},
	ResponseWriter = async (ctx, report) =>
	{
		ctx.Response.ContentType = "application/json";
		var result = System.Text.Json.JsonSerializer.Serialize(new
		{
			status = report.Status.ToString(),
			checks = report.Entries.Select(e => new { name = e.Key, status = e.Value.Status.ToString() })
		});
		await ctx.Response.WriteAsync(result);
	}
}).RequireAuthorization(p => p.RequireRole("admin"));
app.MapControllers();

app.Run();
