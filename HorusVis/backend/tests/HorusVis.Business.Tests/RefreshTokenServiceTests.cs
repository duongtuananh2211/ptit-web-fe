using HorusVis.Business.Services;

namespace HorusVis.Business.Tests;

public class RefreshTokenServiceTests
{
    private readonly RefreshTokenService _sut = new();

    [Fact]
    public void GenerateRawToken_ReturnsDifferentTokensEachCall()
    {
        var token1 = _sut.GenerateRawToken();
        var token2 = _sut.GenerateRawToken();

        Assert.NotEqual(token1, token2);
    }

    [Fact]
    public void HashToken_SameInput_ReturnsSameHash()
    {
        var token = _sut.GenerateRawToken();

        var hash1 = _sut.HashToken(token);
        var hash2 = _sut.HashToken(token);

        Assert.Equal(hash1, hash2);
    }

    [Fact]
    public void HashToken_DifferentInputs_ReturnDifferentHashes()
    {
        var token1 = _sut.GenerateRawToken();
        var token2 = _sut.GenerateRawToken();

        var hash1 = _sut.HashToken(token1);
        var hash2 = _sut.HashToken(token2);

        Assert.NotEqual(hash1, hash2);
    }
}
