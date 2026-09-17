using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using Dinaup;
using Dinaup.CultureService;

namespace DinaZen.Components.DinaupFlex.Reports;

// Serializa filas de informe a CSV. Fuente única para el botón de descarga y para integraciones (Yudo).
// Las horas van en la zona de la empresa (regionService), igual que en la tabla: el reloj del
// servidor y los valores fecha-hora del informe van en UTC.
public static class ReportCsvExporter
{
	public static (string Csv, string FileName, int RowCount) Build(List<DinaupDynamicRowDTO> rows, List<DinaupFieldDTO> columns, string title, ICultureService regionService)
	{
		var sb = new StringBuilder();
		sb.AppendLine(string.Join(";", columns.Select(c => Escape(c.Label))));
		foreach (var row in rows)
			sb.AppendLine(string.Join(";", columns.Select(col => Escape(Cell(row, col, regionService)))));

		var fileName = $"{title.IfIsEmpty("export")}_{regionService.LocalNow():yyyyMMdd_HHmm}.csv";
		return (sb.ToString(), fileName, rows.Count);
	}

	private static string Cell(DinaupDynamicRowDTO row, DinaupFieldDTO col, ICultureService regionService)
	{
		return col.Format switch
		{
			FieldFormatE.DEC => row.GetDec(col.Keyword).ToString(CultureInfo.InvariantCulture),
			FieldFormatE.INT => row.GetInt(col.Keyword).ToString(),
			FieldFormatE.BOOL => row.GetBool(col.Keyword) ? "Si" : "No",
			FieldFormatE.DateAndTime => row.GetDateTime(col.Keyword) is DateTime dt && dt != default ? regionService.ToLocal(dt).ToString("yyyy-MM-dd HH:mm:ss") : "",
			FieldFormatE.DATE => row.GetDateTime(col.Keyword) is DateTime d && d != default ? d.ToString("yyyy-MM-dd") : "",
			FieldFormatE.TIME => row.GetDateTime(col.Keyword) is DateTime t2 && t2 != default ? t2.ToString("HH:mm") : "",
			_ => row.GetLegible(col.Keyword) ?? ""
		};
	}

	private static string Escape(string value)
	{
		if (string.IsNullOrEmpty(value)) return "";
		if (value.Contains('"') || value.Contains(';') || value.Contains('\n')) return $"\"{value.Replace("\"", "\"\"")}\"";
		return value;
	}
}
