namespace DinaZen.Components.DinaupFlex.Reports;

/// <summary>
/// UNA CELDA ELEGIDA: la fila y el campo, nada más.
///
/// El campo va por Keyword y no por índice de columna a propósito: el usuario reordena y esconde
/// columnas cuando quiere, y quien recibe la selección (una edición masiva, un copiar) necesita
/// saber QUÉ CAMPO tocar, no en qué sitio de la pantalla estaba.
/// </summary>
public readonly record struct DnzSelectedCell(string RowId, string Keyword);

/// <summary>
/// LO ELEGIDO EN LA REJILLA, ya masticado para quien lo recibe.
///
/// Se publica entero en cada cambio en vez de dejar que el consumidor lea el HashSet del
/// componente: así el de fuera no puede modificar la selección por la espalda ni quedarse con una
/// referencia que cambia sola mientras la recorre.
///
/// Las tres vistas son la misma selección leída de tres maneras, porque las tres hacen falta y
/// calcularlas fuera saldría peor:
///   · Cells    — el detalle, por si hay que pintar o copiar celda a celda.
///   · RowIds   — sobre qué registros se va a escribir.
///   · Keywords — QUÉ CAMPOS tienen algo elegido. Es la pregunta que decide si una edición masiva
///                puede hacerse con un solo valor (un campo) o pide rejilla (varios).
/// </summary>
public sealed class DnzCellSelection
{
	public static readonly DnzCellSelection Empty = new(Array.Empty<DnzSelectedCell>());

	public DnzCellSelection(IReadOnlyCollection<DnzSelectedCell> cells)
	{
		Cells = cells ?? Array.Empty<DnzSelectedCell>();
		RowIds = Cells.Select(c => c.RowId).Distinct().ToArray();
		Keywords = Cells.Select(c => c.Keyword).Distinct().ToArray();
	}

	/// <summary>Cada par (fila, campo) elegido.</summary>
	public IReadOnlyCollection<DnzSelectedCell> Cells { get; }

	/// <summary>Los registros con al menos una celda elegida, sin repetir.</summary>
	public IReadOnlyCollection<string> RowIds { get; }

	/// <summary>Los campos con al menos una celda elegida, sin repetir.</summary>
	public IReadOnlyCollection<string> Keywords { get; }

	public bool IsEmpty => Cells.Count == 0;

	/// <summary>
	/// El caso que interesa a una edición masiva de un solo valor: hay celdas y todas son del mismo
	/// campo. Con más de uno hay que preguntar valor por campo, que ya es otra pantalla.
	/// </summary>
	public bool IsSingleColumn => Cells.Count > 0 && Keywords.Count == 1;
}
