using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace HorusVis.Data.Persistence
{
    internal class DateTimeOffsetConverter : ValueConverter<DateTimeOffset, DateTimeOffset>
    {
        public DateTimeOffsetConverter()
            : base(
                dateTime => dateTime.ToUniversalTime(),
                dateTime => dateTime.ToUniversalTime())
        {
        }
    }
}
