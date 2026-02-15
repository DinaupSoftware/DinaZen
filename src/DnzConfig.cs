namespace DinaZen;

/// <summary>
/// Configuracion global de DinaZen.
/// Se puede establecer en Program.cs antes de builder.Build().
/// </summary>
public static class DnzConfig
{
	/// <summary>
	/// Determina como se abren los formularios DnzFormView cuando se usan
	/// OpenAsync/OpenAsWindow de forma automatica (ej: relaciones, abrir registros).
	/// Default: Dialog (modal Radzen).
	/// </summary>
	public static FormOpenMode DefaultFormOpenMode { get; set; } = FormOpenMode.Dialog;

	/// <summary>
	/// Si true, los componentes de formularios establecen sus referencias a null
	/// en Dispose() para ayudar al GC. Util en circuitos Blazor Server de larga duracion.
	/// Default: false.
	/// </summary>
	public static bool DeepDispose { get; set; } = false;

	/// <summary>
	/// Intervalo en segundos entre pings de sincronizacion de formularios vivos.
	/// Default: 30.
	/// </summary>
	public static int LiveFormPingIntervalSeconds { get; set; } = 30;
}

/// <summary>
/// Modo de apertura de formularios.
/// </summary>
public enum FormOpenMode
{
	/// <summary>Modal de Radzen (DialogService).</summary>
	Dialog,

	/// <summary>Ventana flotante (DnzWindowManagerService).</summary>
	Window
}
