namespace DinaZen.Components.WindowManager;

/// <summary>
/// Hasta dónde alcanza el "una sola" de <see cref="WindowOptions.ControlKey"/>.
/// </summary>
public enum AmbitoVentanaE
{
	/// <summary>Esta pantalla. Es lo unico que el gestor sabe por si mismo: hay uno por circuito Blazor.</summary>
	Pestana,

	/// <summary>Todas las pestanas y aparatos de esa persona. Lo resuelve la app, que es quien sabe quien es.</summary>
	Usuario,

	/// <summary>Toda la empresa: si lo tiene abierto un companyero, no se abre. Lo resuelve la app.</summary>
	Licencia
}

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
	/// Identidad de la ventana a efectos de "de esta solo puede haber una" (ej: "pymes.generar-asientos").
	/// Vacio = sin control, se abren las que se pidan. Es para las CARAS: las que traen media base de
	/// datos, montan un agente o son una sesion larga de trabajo.
	///
	/// Con ella puesta, volver a pedir la MISMA ventana en esta pantalla no abre una segunda: se trae al
	/// frente la que ya hay y Open devuelve su id. Es el comportamiento que cada llamante se estaba
	/// escribiendo a mano.
	/// </summary>
	public string ControlKey { get; set; }

	/// <summary>
	/// Hasta donde llega ese control. Solo se mira si hay <see cref="ControlKey"/>.
	/// Por defecto Pestana, que es lo unico que el gestor puede saber sin ayuda: los otros dos ambitos
	/// necesitan que la app conteste por <see cref="DnzWindowManagerService.ResolverOcupadaFuera"/>.
	/// </summary>
	public AmbitoVentanaE Ambito { get; set; } = AmbitoVentanaE.Pestana;

	/// <summary>
	/// ID predefinido para la ventana (opcional).
	/// Si se establece, Open() usara este ID en lugar de generar uno nuevo.
	/// Util para pasar el WindowId como Parameter al contenido antes de abrir.
	/// </summary>
	public string PresetId { get; set; }
}
