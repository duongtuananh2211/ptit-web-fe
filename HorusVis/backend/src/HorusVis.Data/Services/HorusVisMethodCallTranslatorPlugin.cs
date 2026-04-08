using Microsoft.EntityFrameworkCore.Query;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql.EntityFrameworkCore.PostgreSQL.Query;

namespace HorusVis.Data.Services;

internal sealed class HorusVisMethodCallTranslatorPlugin : IMethodCallTranslatorPlugin
{
    public HorusVisMethodCallTranslatorPlugin(
        IRelationalTypeMappingSource typeMappingSource,
        ISqlExpressionFactory sqlExpressionFactory)
    {
        Translators = [
            new HorusVisNpgsqlDateTimeMethodTranslator(typeMappingSource, (NpgsqlSqlExpressionFactory) sqlExpressionFactory)
        ];
    }

    public IEnumerable<IMethodCallTranslator> Translators { get; }
}
