namespace DinaZen.Components.Rrhh.Models;

/// <summary>
/// Represents a time interval with start/end times and a category.
/// Used by TimeIntervalEditorRrhh.
/// </summary>
public class TimeIntervalRrhh
{
    public TimeIntervalRrhh() { }

    public TimeIntervalRrhh(DateTime inicio, DateTime fin, string category = "")
    {
        Inicio = inicio;
        Fin = fin;
        Category = category;
    }

    public DateTime Inicio { get; set; }
    public DateTime Fin { get; set; }

    /// <summary>
    /// Category or type label for this interval (e.g. "Ordinarias", "Extra", "Descanso").
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
            var diff = Fin.TimeOfDay - Inicio.TimeOfDay;
            if (diff < TimeSpan.Zero)
                diff += TimeSpan.FromDays(1);
            return diff;
        }
    }
}
