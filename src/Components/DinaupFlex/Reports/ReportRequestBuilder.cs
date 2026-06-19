using Dinaup;

namespace DinaZen.Components.DinaupFlex.Reports;

// Arma el ReportRequestParameters para la exportación, conservando el filtro/orden activo de la rejilla.
public static class ReportRequestBuilder
{
	// Exportación: trae todas las filas (hasta totalResults) conservando el filtro/orden activo de la rejilla.
	public static ReportRequestParameters ForExport(ReportRequestParameters p, LoadDataReportC lastFilter, int totalResults)
	{
		var exportFilter = new LoadDataReportC { Skip = 0, Top = totalResults > 0 ? totalResults : 10000 };
		if (lastFilter.IsNotNull())
		{
			exportFilter.Filter = lastFilter.Filter;
			exportFilter.Filters = lastFilter.Filters;
			exportFilter.Sorts = lastFilter.Sorts;
			exportFilter.OrderBy = lastFilter.OrderBy;
		}
		p.ApplyLoadingConfiguration(exportFilter);
		return p;
	}
}
