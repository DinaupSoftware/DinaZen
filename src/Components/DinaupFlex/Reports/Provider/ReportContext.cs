using Dinaup;

namespace DinaZen.Components.DinaupFlex.Reports.Provider;

public class ReportContext
{
	public DinaupReportDTO Report { get; set; }
	public DinaupReportDataDTO DataList { get; set; }
	public List<DinaupDynamicRowDTO> Rows { get; set; } = new();
	public int TotalResults { get; set; }
	public ReportColumnMapping Mapping { get; set; } = new();
	public bool IsLoading { get; set; } = true;
	public string ErrorMessage { get; set; } = "";
	public Func<Task> RefreshAsync { get; set; }
}
