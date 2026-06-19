using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using Dinaup;

namespace DinaZen.Components.DinaupFlex.Reports;

// Serializa filas de informe a CSV. Fuente única para el botón de descarga y para integraciones (Yudo).
public static class ReportCsvExporter
{
	public static (string Csv, string FileName, int RowCount) Build(List<DinaupDynamicRowDTO> rows, List<DinaupFieldDTO> columns, string title)
	{
		var sb = new StringBuilder();
		sb.AppendLine(string.Join(";", columns.Select(c => Escape(c.Label))));
		foreach (var row in rows)
			sb.AppendLine(string.Join(";", columns.Select(col => Escape(Cell(row, col)))));

		var fileName = $"{title.IfIsEmpty("export")}_{DateTime.Now:yyyyMMdd_HHmm}.csv";
		return (sb.ToString(), fileName, rows.Count);
	}

	private static string Cell(DinaupDynamicRowDTO row, DinaupFieldDTO col) => col.Format switch
	{
		FieldFormatE.DEC => row.GetDec(col.Keyword).ToString(CultureInfo.InvariantCulture),
		FieldFormatE.INT => row.GetInt(col.Keyword).ToString(),
		FieldFormatE.BOOL => row.GetBool(col.Keyword) ? "Si" : "No",
		FieldFormatE.DateAndTime => row.GetDateTime(col.Keyword) is DateTime dt && dt != default ? dt.ToString("yyyy-MM-dd HH:mm:ss") : "",
		FieldFormatE.DATE => row.GetDateTime(col.Keyword) is DateTime d && d != default ? d.ToString("yyyy-MM-dd") : "",
		FieldFormatE.TIME => row.GetDateTime(col.Keyword) is DateTime t2 && t2 != default ? t2.ToString("HH:mm") : "",
		_ => row.GetLegible(col.Keyword) ?? ""
	};

	private static string Escape(string value)
	{
		if (string.IsNullOrEmpty(value)) return "";
		if (value.Contains('"') || value.Contains(';') || value.Contains('\n')) return $"\"{value.Replace("\"", "\"\"")}\"";
		return value;
	}
}
