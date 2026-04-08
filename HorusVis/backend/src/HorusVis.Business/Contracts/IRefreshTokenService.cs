namespace HorusVis.Business.Contracts;

public interface IRefreshTokenService
{
    string GenerateRawToken();
    string HashToken(string rawToken);
}
