namespace DinaZen.Components.Rrhh.Models;

/// <summary>
/// Reason (sub-category) that can be attached to an interval of a given category.
/// The consumer owns the catalog: DnzTimeIntervalEditorRrhh only offers the entries whose
/// <see cref="Category"/> matches the category the interval is currently set to, so it is the
/// catalog itself — not the editor — that decides which categories require a reason.
/// </summary>
public class TimeIntervalSubCategoryRrhh
{
    public TimeIntervalSubCategoryRrhh() { }

    public TimeIntervalSubCategoryRrhh(Guid id, string name, string category)
    {
        Id = id;
        Name = name;
        Category = category;
    }

    /// <summary>Identifier stored in <see cref="TimeIntervalRrhh.SubCategoryId"/>.</summary>
    public Guid Id { get; set; } = Guid.Empty;

    /// <summary>Label shown in the reason picker.</summary>
    public string Name { get; set; } = "";

    /// <summary>Category this reason belongs to; matched against <see cref="TimeIntervalRrhh.Category"/>.</summary>
    public string Category { get; set; } = "";
}
