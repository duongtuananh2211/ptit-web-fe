namespace HorusVis.Data.Services;

internal interface IConnectionStringFactory
{
    string GetConnectionString(string name);
}
