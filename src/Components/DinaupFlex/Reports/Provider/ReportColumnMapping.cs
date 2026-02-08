using Dinaup;

namespace DinaZen.Components.DinaupFlex.Reports.Provider;

public class ReportColumnMapping
{
	public DinaupFieldDTO PrimaryNumeric { get; set; }
	public DinaupFieldDTO PrimaryDate { get; set; }
	public DinaupFieldDTO SecondaryDate { get; set; }
	public DinaupFieldDTO MoneyColumn { get; set; }
	public DinaupFieldDTO MinutesColumn { get; set; }
	public DinaupFieldDTO StatusColumn { get; set; }
	public DinaupFieldDTO BoolColumn { get; set; }
	public List<DinaupFieldDTO> AllNumeric { get; set; } = new();
	public List<DinaupFieldDTO> AllDates { get; set; } = new();
	public List<DinaupFieldDTO> AllStrings { get; set; } = new();
	public List<DinaupFieldDTO> AllBools { get; set; } = new();
	public List<DinaupFieldDTO> AllMoney { get; set; } = new();
	public List<DinaupFieldDTO> AllVisible { get; set; } = new();

	public bool CanChart => PrimaryNumeric.IsNotNull();
	public bool CanCalendar => PrimaryDate.IsNotNull();
	public bool CanGantt => AllDates.Count >= 2;
	public bool CanKanban => StatusColumn.IsNotNull();
	public bool CanChecklist => BoolColumn.IsNotNull();
	public bool CanTimeline => PrimaryDate.IsNotNull();
	public bool CanMoney => MoneyColumn.IsNotNull();
	public bool CanMinutes => MinutesColumn.IsNotNull();

	public static ReportColumnMapping Analyze(IEnumerable<DinaupFieldDTO> columns)
	{
		var m = new ReportColumnMapping();
		if (columns == null) return m;

		var visible = columns.Where(c => !c.isColumnHidden).ToList();
		m.AllVisible = visible;

		foreach (var col in visible)
		{
			switch (col.Format)
			{
				case FieldFormatE.DEC:
				case FieldFormatE.INT:
					if (col.Role == RoleFieldE.Moneda)
					{
						m.AllMoney.Add(col);
						if (m.MoneyColumn == null) m.MoneyColumn = col;
					}
					else if (col.Role == RoleFieldE.Minutos)
					{
						if (m.MinutesColumn == null) m.MinutesColumn = col;
					}
					else
					{
						m.AllNumeric.Add(col);
					}
					if (m.PrimaryNumeric == null) m.PrimaryNumeric = col;
					break;

				case FieldFormatE.DateAndTime:
				case FieldFormatE.DATE:
					m.AllDates.Add(col);
					if (m.PrimaryDate == null) m.PrimaryDate = col;
					else if (m.SecondaryDate == null) m.SecondaryDate = col;
					break;

				case FieldFormatE.BOOL:
					m.AllBools.Add(col);
					if (m.BoolColumn == null) m.BoolColumn = col;
					break;

				default:
					m.AllStrings.Add(col);
					if (col.Predefined_Values.IsNotEmpty() || col.BadgetsStyle.IsNotEmpty())
					{
						if (m.StatusColumn == null) m.StatusColumn = col;
					}
					break;
			}
		}

		if (m.PrimaryNumeric == null && m.MoneyColumn.IsNotNull())
			m.PrimaryNumeric = m.MoneyColumn;

		return m;
	}
}
