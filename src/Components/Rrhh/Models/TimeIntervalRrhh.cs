namespace DinaZen.Components.Rrhh.Models;

/// <summary>
/// Represents a time interval with start/end times and a category.
/// Used by DnzTimeIntervalEditorRrhh.
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

    /// <summary>
    /// Tramo abierto: tiene inicio y todavia no fin (un fichaje sin cerrar).
    /// No se representa con un centinela en <see cref="End"/> porque las 00:00 son una hora
    /// de fin legitima —un turno de noche cierra ahi— y hay que poder distinguir "sin cerrar"
    /// de "cerro a medianoche".
    /// </summary>
    public bool Abierto { get; set; }

    public TimeSpan Duration
    {
        get
        {
            // Un tramo sin cerrar no dura nada todavia: darle duracion obligaria a inventar
            // su hora de fin, que es justo lo que no se sabe.
            if (Abierto) return TimeSpan.Zero;

            var diff = End.TimeOfDay - Start.TimeOfDay;
            if (diff < TimeSpan.Zero)
                diff += TimeSpan.FromDays(1);
            return diff;
        }
    }
}
