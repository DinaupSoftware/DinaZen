using Dinaup;
using Radzen;

namespace DinaZen
{
	public static class Extensions
	{
		public static string Normalized(this string? value) => value?.Trim().ToLowerInvariant().LimpiarCaracteresEspecialesSTR() ?? string.Empty;


		public static async Task LoadReportDataAsync<T>(
			Dinaup.DinaupClientC client,
			IUserSession user,
			Dinaup.DinaupReportBase<T> report,
			LoadDataArgs args,
			ReportRequestOptions options = null)
		{
			if (args.IsNull())
			{	
				
				report.RequestParams.QuerySearch = options?.QuerySearch ?? "";
				report.RequestParams.Variables = options?.Variables ?? new Dictionary<string, string>();
				report.RequestParams.Order = options?.SortOrder   ?? new() ;
				report.RequestParams.Expresion = options?.AdvancedFilters ?? new();
				 
				await report.ExecuteQueryAsync(client, user, report.RequestParams.CurrentPage, report.RequestParams.ResultsPerPage);
			}
			else
			{
				var reportConfig = new LoadDataReportC
				{
					Skip = args.Skip,
					Top = args.Top,
					OrderBy = args.OrderBy,
					Filter = args.Filter,
					Filters = args.Filters?.Select(f => new FilterDescriptorC(
						GetColumnNativeName(report, f.Property),
						f.FilterValue,
						GetFunctino(f.FilterOperator),
						f.SecondFilterValue,
						GetFunctino(f.SecondFilterOperator),
						GetOperator(f.LogicalFilterOperator)
					)).ToList(),
					Sorts = args.Sorts?.Select(s => new OrdenDescriptorC(
						GetColumnNativeName(report, s.Property),
						(OrderModeE)s.SortOrder
					)).ToList()
				};

				report.RequestParams = new ReportRequestParameters(report.ID.STR())
				{
					Order = options?.SortOrder,
					Expresion = options?.AdvancedFilters,
					QuerySearch = options?.QuerySearch ?? "",
					Variables = options?.Variables
				};

				report.ApplyLoadingConfiguration(reportConfig);
				await report.ExecuteQueryAsync(client, user, report.RequestParams.CurrentPage, report.RequestParams.ResultsPerPage);
			}
		}



		#region "Internal methods" ------------------------------------------------------------

		private static string GetColumnNativeName<x>(Dinaup.DinaupReportBase<x> report, string prop)
		{

			if (report == null || string.IsNullOrEmpty(prop)) return "";

			string colId = report.GetColIDByProperty(prop);
			if (!colId.IsGUID()) return "";

			var col = report?.Response?.DataList?.ColumnsByKeyword?.GetM(colId);
			if (col != null)
				return col.NativeName;

			return "";


		}

		private static FilterFunctionE GetFunctino(FilterOperator filterOperator)
		{
			if (filterOperator == FilterOperator.Equals) return FilterFunctionE.Equals;
			if (filterOperator == FilterOperator.NotEquals) return FilterFunctionE.NotEquals;
			if (filterOperator == FilterOperator.LessThan) return FilterFunctionE.LessThan;
			if (filterOperator == FilterOperator.LessThanOrEquals) return FilterFunctionE.LessThanOrEqualTo;
			if (filterOperator == FilterOperator.GreaterThan) return FilterFunctionE.GreaterThan;
			if (filterOperator == FilterOperator.GreaterThanOrEquals) return FilterFunctionE.GreaterThanOrEqualTo;
			if (filterOperator == FilterOperator.Contains) return FilterFunctionE.Contains;
			if (filterOperator == FilterOperator.StartsWith) return FilterFunctionE.StartsWith;
			if (filterOperator == FilterOperator.EndsWith) return FilterFunctionE.EndsWith;
			if (filterOperator == FilterOperator.DoesNotContain) return FilterFunctionE.DoesNotContain;
			if (filterOperator == FilterOperator.IsEmpty) return FilterFunctionE.IsEmpty;
			if (filterOperator == FilterOperator.IsNotEmpty) return FilterFunctionE.IsNotEmpty;
			return FilterFunctionE.Contains;
		}

		private static LogicalOperatorE GetOperator(LogicalFilterOperator logicalFilterOperator)
		{
			if (logicalFilterOperator == LogicalFilterOperator.And) return LogicalOperatorE.And;
			if (logicalFilterOperator == LogicalFilterOperator.Or) return LogicalOperatorE.Or;
			return LogicalOperatorE.And;
		}
		#endregion

	}

}

public class ReportRequestOptions
{
	public Dictionary<string, string> Variables { get; set; }
	public string QuerySearch { get; set; } = "";
	public List<FilterCondition> AdvancedFilters { get; set; }
	public Dictionary<string, bool> SortOrder { get; set; }
}