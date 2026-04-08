using HorusVis.Web.Contracts;

namespace HorusVis.Web.Services.Authentication;

public interface IJwtTokenService
{
    ScaffoldLoginResponse CreateToken(ScaffoldLoginRequest request);
}
