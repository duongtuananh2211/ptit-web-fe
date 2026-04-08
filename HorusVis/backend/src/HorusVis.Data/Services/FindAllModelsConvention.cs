using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Metadata.Conventions;
using Npgsql.NameTranslation;

namespace HorusVis.Data.Services;

internal partial class FindAllModelsConvention : IModelInitializedConvention
{
    private static readonly Regex _namespaceRegex = GetNamespaceRegex();

    public void ProcessModelInitialized(IConventionModelBuilder modelBuilder, IConventionContext<IConventionModelBuilder> context)
    {
        var snakeCaseTranslator = new NpgsqlSnakeCaseNameTranslator();

        var types = GetType().Assembly.GetTypes();
        foreach (var type in types)
        {
            if (!type.IsClass || type.IsAbstract)
            {
                continue;
            }

            if (type.GetCustomAttributes(typeof(OwnedAttribute), true).Length > 0)
            {
                continue;
            }

            var rawNamespace = type.Namespace;
            if (rawNamespace == null)
            {
                continue;
            }

            var namespaceMatch = _namespaceRegex.Match(rawNamespace);
            if (!namespaceMatch.Success)
            {
                continue;
            }

            var entityTypeBuilder = modelBuilder.Entity(type, fromDataAnnotation: true);
            if (entityTypeBuilder == null)
            {
                continue;
            }

            var schema = namespaceMatch.Groups["schema"].Value;
            entityTypeBuilder.ToSchema(snakeCaseTranslator.TranslateTypeName(schema), fromDataAnnotation: true);
        }
    }

    [GeneratedRegex(@"^HorusVis\.Data\.(?<schema>[^\.]+)\.Entities$", RegexOptions.CultureInvariant, Timeout.Infinite)]
    private static partial Regex GetNamespaceRegex();
}
