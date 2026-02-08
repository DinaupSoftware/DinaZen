namespace DinaZen.Components.WindowManager;

public class DnzWindowOptions
{
	public string Title { get; set; } = "";
	public string Subtitle { get; set; } = "";

	/// <summary>
	/// Icono Material Design (ej: "analytics", "description").
	/// </summary>
	public string Icon { get; set; } = "";

	/// <summary>
	/// URL de icono personalizado (ej: imagen de seccion DinaupSL).
	/// Tiene prioridad sobre Icon.
	/// </summary>
	public string IconUrl { get; set; } = "";

	public double InitialWidth { get; set; } = 1020;
	public double InitialHeight { get; set; } = 620;
	public double MinWidth { get; set; } = 1000;
	public double MinHeight { get; set; } = 400;

	/// <summary>
	/// ID predefinido para la ventana (opcional).
	/// Si se establece, Open() usara este ID en lugar de generar uno nuevo.
	/// Util para pasar el WindowId como Parameter al contenido antes de abrir.
	/// </summary>
	public string PresetId { get; set; }
}
