namespace DinaZen.Components.Rrhh.Models;

/// <summary>
/// Predefined shift template with a name and a set of intervals.
/// Used by TimeIntervalEditorRrhh for quick-fill templates.
/// </summary>
public class TimeIntervalTemplateRrhh
{
    public string Name { get; set; } = "";
    public string Icon { get; set; } = "schedule";
    public List<TimeIntervalRrhh> Intervals { get; set; } = new();

    public TimeIntervalTemplateRrhh() { }

    public TimeIntervalTemplateRrhh(string name, string icon, params (int startH, int startM, int endH, int endM, string category)[] intervals)
    {
        Name = name;
        Icon = icon;
        Intervals = intervals.Select(i =>
            new TimeIntervalRrhh(
                DateTime.Today.AddHours(i.startH).AddMinutes(i.startM),
                DateTime.Today.AddHours(i.endH).AddMinutes(i.endM),
                i.category
            )).ToList();
    }
}
