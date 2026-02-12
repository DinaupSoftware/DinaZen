namespace DinaZen.Components.Rrhh.Models;

/// <summary>
/// Represents a time interval with start/end times and a category.
/// Used by TimeIntervalEditorRrhh.
/// </summary>
public class TimeIntervalRrhh
{
    public TimeIntervalRrhh() { }

    public TimeIntervalRrhh(DateTime start, DateTime end, string category = "")
    {
        Start = start;
        End = end;
        Category = category;
    }

    public DateTime Start { get; set; }
    public DateTime End { get; set; }

    /// <summary>
    /// Category or type label for this interval (e.g. "Standard", "Extra", "Rest").
    /// </summary>
    public string Category { get; set; } = "";

    /// <summary>
    /// Optional sub-category ID (e.g. motive ID for extra hours).
    /// </summary>
    public Guid? SubCategoryId { get; set; }

    public TimeSpan Duration
    {
        get
        {
            var diff = End.TimeOfDay - Start.TimeOfDay;
            if (diff < TimeSpan.Zero)
                diff += TimeSpan.FromDays(1);
            return diff;
        }
    }
}
