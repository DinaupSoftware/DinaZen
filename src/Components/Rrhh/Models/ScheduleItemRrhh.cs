namespace DinaZen.Components.Rrhh.Models;

/// <summary>
/// Represents a single time slot in a weekly schedule.
/// Used by DnzWeeklyScheduleGridRrhh.
/// </summary>
public class ScheduleItemRrhh
{
    public ScheduleItemRrhh() { }

    public ScheduleItemRrhh(DayOfWeek day, TimeOnly from, TimeOnly to)
    {
        Day = day;
        From = from;
        To = to;
    }

    public DayOfWeek Day { get; set; }
    public TimeOnly From { get; set; }
    public TimeOnly To { get; set; }

    public TimeSpan Duration => To.ToTimeSpan() - From.ToTimeSpan();
}
