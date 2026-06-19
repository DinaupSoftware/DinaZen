using System.Collections.Generic;
using System.Linq;
using Dinaup;
using Radzen;

namespace DinaZen.Components.DinaupFlex.Reports;

// Traduce entre el modelo de consulta de Radzen (LoadDataArgs/operadores) y el de Dinaup (LoadDataReportC/FilterFunctionE).
// Lógica pura sin estado: el componente solo orquesta.
public static class RadzenReportQuery
{
	// Expresión dynamic-linq que apunta a la columna por keyword, usada como Property de cada RadzenDataGridColumn.
	public static string PropExpr(DinaupFieldDTO col)
	{
		var t = System.Nullable.GetUnderlyingType(col.NetType) ?? col.NetType;
		var n = (System.Nullable.GetUnderlyingType(col.NetType) != null) ? "?" : "";
		var typeName = t.IsEnum ? "Int32" : t.Name;
		return $@"Convert(Convert(it[""{col.Keyword}""], {typeName}{n}), Object)";
	}

	public static LoadDataReportC ToLoadConfig(LoadDataArgs args, DinaupReportDataDTO dataList)
	{
		var ld = new LoadDataReportC { Skip = args.Skip, Top = args.Top, OrderBy = args.OrderBy, Filter = args.Filter };

		if (args.Filters.IsNotNull())
			ld.Filters = args.Filters.Select(f => new FilterDescriptorC(ResolveColId(f.Property, dataList), f.FilterValue, MapOp(f.FilterOperator), f.SecondFilterValue, MapOp(f.SecondFilterOperator), MapLogical(f.LogicalFilterOperator))).ToList();

		if (args.Sorts.IsNotNull())
			ld.Sorts = args.Sorts.Select(s => new OrdenDescriptorC(ResolveColId(s.Property, dataList), (OrderModeE)s.SortOrder)).ToList();

		return ld;
	}

	public static string ResolveColId(string name, DinaupReportDataDTO dataList)
	{
		if (name.IsNotEmpty() && name.Contains("[\"")) name = Dinaup.extensions.ParseBetween(ref name, "[\"", "\"]");
		if (dataList.IsNull() || dataList.ColumnsByKeyword.IsNull()) return name;
		var col = dataList.ColumnsByKeyword.GetM(name);
		return col.IsNotNull() ? (col.ReportColID.IsGUID() ? col.ReportColID : col.NativeName) : name;
	}

	private static FilterFunctionE MapOp(FilterOperator op) => op switch
	{
		FilterOperator.Equals => FilterFunctionE.Equals,
		FilterOperator.NotEquals => FilterFunctionE.NotEquals,
		FilterOperator.LessThan => FilterFunctionE.LessThan,
		FilterOperator.LessThanOrEquals => FilterFunctionE.LessThanOrEqualTo,
		FilterOperator.GreaterThan => FilterFunctionE.GreaterThan,
		FilterOperator.GreaterThanOrEquals => FilterFunctionE.GreaterThanOrEqualTo,
		FilterOperator.Contains => FilterFunctionE.Contains,
		FilterOperator.StartsWith => FilterFunctionE.StartsWith,
		FilterOperator.EndsWith => FilterFunctionE.EndsWith,
		FilterOperator.DoesNotContain => FilterFunctionE.DoesNotContain,
		FilterOperator.IsEmpty => FilterFunctionE.IsEmpty,
		FilterOperator.IsNotEmpty => FilterFunctionE.IsNotEmpty,
		_ => FilterFunctionE.Contains
	};

	private static LogicalOperatorE MapLogical(LogicalFilterOperator op) => op == LogicalFilterOperator.Or ? LogicalOperatorE.Or : LogicalOperatorE.And;
}
