using HorusVis.Data.Horusvis.Entities;

namespace HorusVis.Business.Contracts;

public interface IPasswordService
{
    string HashPassword(User user, string plainPassword);
    bool VerifyPassword(User user, string hashedPassword, string providedPassword);
}
