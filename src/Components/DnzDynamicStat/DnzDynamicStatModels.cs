namespace DinaZen.Components;

#region Enums

public enum DnzDynamicStatRenderE
{
    Auto,
    Kpi,
    Chart,
    Table
}

public enum DnzDynamicStatChartTypeE
{
    Column,
    Bar,
    Line,
    Donut,
    Spider,
    PolarArea,
    StackedBar
}

public enum DnzDynamicStatFormatE
{
    Auto,
    Money,
    Decimal,
    Integer,
    Percent,
    Raw
}

public enum DnzDynamicStatAggregationE
{
    None,
    Sum,
    Count,
    Avg,
    Min,
    Max
}

#endregion

#region StatParameter

public class DnzStatParameter
{
    public string Field { get; set; } = "";
    public DnzDynamicStatAggregationE Aggregation { get; set; } = DnzDynamicStatAggregationE.Sum;
    public string Label { get; set; } = "";
    public string Color { get; set; } = "";
    public DnzDynamicStatFormatE Format { get; set; } = DnzDynamicStatFormatE.Auto;

    public DnzStatParameter() { }

    public DnzStatParameter(string field, DnzDynamicStatAggregationE aggregation = DnzDynamicStatAggregationE.Sum)
    {
        Field = field;
        Aggregation = aggregation;
    }
}

#endregion

#region Data Models

public class DnzDynamicStatData
{
    public List<DnzDynamicStatSeries> Series { get; set; } = new();
    public List<string> Columns { get; set; } = new();
    public List<Dictionary<string, string>> RawRows { get; set; } = new();
    public Dictionary<string, string> ColumnLabels { get; set; } = new();
    public int Total { get; set; }
    public int TimeMs { get; set; }
    public bool IsLoaded { get; set; }
    public string ErrorMessage { get; set; } = "";

    public bool IsSingleValue => Series.Count == 1 && Series[0].SingleValue.HasValue && Series[0].Items.IsEmpty();
    public bool IsMultiKpi => Series.Count >= 1 && Series.All(s => s.SingleValue.HasValue);
    public bool HasGroupedData => Series.IsNotEmpty() && Series.Any(s => s.Items.IsNotEmpty());
    public int MaxItemCount => Series.IsNotEmpty() ? Series.Max(s => s.Items.Count) : 0;
}

public class DnzDynamicStatSeries
{
    public string Label { get; set; } = "";
    public string Color { get; set; } = "";
    public DnzDynamicStatFormatE Format { get; set; } = DnzDynamicStatFormatE.Auto;
    public decimal? SingleValue { get; set; }
    public List<DnzDynamicStatDataItem> Items { get; set; } = new();

    public decimal GroupedTotal => Items.IsNotEmpty() ? Items.Sum(i => i.Value) : 0;
}

public class DnzDynamicStatDataItem
{
    public string Category { get; set; } = "";
    public decimal Value { get; set; }

    public DnzDynamicStatDataItem() { }

    public DnzDynamicStatDataItem(string category, decimal value)
    {
        Category = category;
        Value = value;
    }
}

#endregion
