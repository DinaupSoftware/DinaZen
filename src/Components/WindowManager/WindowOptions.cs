namespace DinaZen.Components.WindowManager;

public class WindowOptions
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

	// 1100 = bucket "Formulario" del estandar de anchos. Antes 1020, que caia dentro de la
	// franja de histeresis del umbral movil (1000-1060) y hacia que la ventana abriese en la
	// maqueta equivocada por diferencias de pocos pixeles.
	public double InitialWidth { get; set; } = 1100;
	public double InitialHeight { get; set; } = 620;

	// Quien abra una ventana cuyo contenido tenga maqueta estrecha debe BAJAR este minimo,
	// o esa maqueta sera inalcanzable arrastrando el borde.
	public double MinWidth { get; set; } = 1000;
	public double MinHeight { get; set; } = 400;

	/// <summary>
	/// ID predefinido para la ventana (opcional).
	/// Si se establece, Open() usara este ID en lugar de generar uno nuevo.
	/// Util para pasar el WindowId como Parameter al contenido antes de abrir.
	/// </summary>
	public string PresetId { get; set; }
}
