namespace DinaZen.Components.Rrhh.Models;

/// <summary>
/// Visual style presets for TimelineBarRrhh.
/// Each style represents a different HR scenario with distinct colors and icons.
/// </summary>
public enum TimelineBarStyleRrhh
{
    /// <summary>Default — no preset applied; use Class for custom styling.</summary>
    None = 0,

    /// <summary>Holiday / public holiday — red.</summary>
    Holiday,

    /// <summary>Sick leave / medical leave — slate.</summary>
    SickLeave,

    /// <summary>Rest / break — neutral gray.</summary>
    Rest,

    /// <summary>Official / scheduled shift — blue.</summary>
    OfficialShift,

    /// <summary>Actual / worked shift — green.</summary>
    ActualShift,

    /// <summary>Absence (unjustified or generic) — amber.</summary>
    Absence,

    /// <summary>Vacation / paid time off — teal.</summary>
    Vacation
}
