using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Query;
using Microsoft.EntityFrameworkCore.Query.SqlExpressions;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql.EntityFrameworkCore.PostgreSQL.Query;

namespace HorusVis.Data.Services;

// https://github.com/npgsql/efcore.pg/blob/v8.0.4/src/EFCore.PG/Query/ExpressionTranslators/Internal/NpgsqlDateTimeMethodTranslator.cs#L325-L336
// TimeZoneInfo_ConvertTimeBySystemTimeZoneId_DateTimeOffset exists
// Only TimeZoneInfo_ConvertTimeBySystemTimeZoneId_DateTime is actually used
// We should just need to do the same thing that would have otherwise happened
// This class can be removed whenever the issue is fixed upstream
internal sealed class HorusVisNpgsqlDateTimeMethodTranslator : IMethodCallTranslator
{
    private static readonly MethodInfo TimeZoneInfo_ConvertTimeBySystemTimeZoneId_DateTimeOffset = typeof(TimeZoneInfo).GetRuntimeMethod(nameof(TimeZoneInfo.ConvertTimeBySystemTimeZoneId), [typeof(DateTimeOffset), typeof(string)])!;

    private readonly IRelationalTypeMappingSource _typeMappingSource;
    private readonly NpgsqlSqlExpressionFactory _sqlExpressionFactory;
    private readonly RelationalTypeMapping _timestampMapping;

    public HorusVisNpgsqlDateTimeMethodTranslator(
        IRelationalTypeMappingSource typeMappingSource,
        NpgsqlSqlExpressionFactory sqlExpressionFactory)
    {
        _typeMappingSource = typeMappingSource;
        _sqlExpressionFactory = sqlExpressionFactory;
        _timestampMapping = typeMappingSource.FindMapping("timestamp without time zone")!;
    }

    public SqlExpression? Translate(SqlExpression? instance, MethodInfo method, IReadOnlyList<SqlExpression> arguments, IDiagnosticsLogger<DbLoggerCategory.Query> logger)
    {
        if (method == TimeZoneInfo_ConvertTimeBySystemTimeZoneId_DateTimeOffset)
        {
            var typeMapping = arguments[0].TypeMapping;
            if (typeMapping is null
                || (typeMapping.StoreType != "timestamp with time zone" && typeMapping.StoreType != "timestamptz"))
            {
                throw new InvalidOperationException(
                    "TimeZoneInfo.ConvertTimeBySystemTimeZoneId is only supported on columns with type 'timestamp with time zone'");
            }

            return _sqlExpressionFactory.AtTimeZone(arguments[0], arguments[1], typeof(DateTimeOffset), _timestampMapping);
        }

        return null;
    }
}
