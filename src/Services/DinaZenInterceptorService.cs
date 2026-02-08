using Dinaup;

namespace DinaZen.Services;

/// <summary>
/// Servicio scoped que permite a la app host interceptar acciones globales de DinaZen.
/// Cada interceptor es un Func que devuelve bool:
///   true  = "yo me encargo, cancela el comportamiento por defecto"
///   false = "no me interesa, sigue con el default"
///   null  = no hay handler, sigue con el default
/// Se registra automaticamente con AddDinaZen().
/// </summary>
public class DinaZenInterceptorService
{
	// ── Navegacion ──

	/// <summary>
	/// Antes de abrir un registro existente (click en fila de report, "Acceder" en campo relacion).
	/// </summary>
	public Func<OpenRecordRequest, Task<bool>> OnOpenRecord { get; set; }

	/// <summary>
	/// Antes de crear un registro nuevo (boton "+" en report).
	/// </summary>
	public Func<OpenNewRecordRequest, Task<bool>> OnOpenNewRecord { get; set; }

	// ── Formularios ──

	/// <summary>
	/// Despues de guardar exitosamente un formulario, antes de cerrarlo.
	/// Si devuelve true, el formulario NO se cierra.
	/// </summary>
	public Func<FormSavedRequest, Task<bool>> OnFormSaved { get; set; }

	// ── Extensiones de formulario ──

	/// <summary>
	/// Permite a la app host inyectar botones de extension dinamicos en el footer del formulario.
	/// Recibe datos del form (seccion, registro, si es nuevo) y devuelve lista de botones a mostrar.
	/// </summary>
	public Func<FormExtensionsRequest, Task<List<FormExtensionButton>>> OnGetFormExtensions { get; set; }
 
	// ── Metodos internos que los componentes de DinaZen llaman ──
	internal async Task<bool> TryOpenRecordAsync(OpenRecordRequest request)
		=> OnOpenRecord != null && await OnOpenRecord(request);

	internal async Task<bool> TryOpenNewRecordAsync(OpenNewRecordRequest request)
		=> OnOpenNewRecord != null && await OnOpenNewRecord(request);

	internal async Task<bool> TryFormSavedAsync(FormSavedRequest request)
		=> OnFormSaved != null && await OnFormSaved(request);


	internal async Task<List<FormExtensionButton>> GetFormExtensionsAsync(FormExtensionsRequest request)
		=> OnGetFormExtensions != null ? (await OnGetFormExtensions(request)) ?? new() : new();
}

// ── Request DTOs ──

/// <summary>
/// Datos del registro que se quiere abrir.
/// </summary>
public class OpenRecordRequest
{
	/// <summary>GUID de la seccion.</summary>
	public string SectionId { get; set; } = "";

	/// <summary>GUID del registro (RowID).</summary>
	public string RowId { get; set; } = "";

	/// <summary>Titulo del registro (si disponible).</summary>
	public string Title { get; set; } = "";

	/// <summary>Cliente DinaupSL activo.</summary>
	public DinaupClientC Client { get; set; }
}

/// <summary>
/// Datos para crear un registro nuevo.
/// </summary>
public class OpenNewRecordRequest
{
	/// <summary>GUID de la seccion donde crear el registro.</summary>
	public string SectionId { get; set; } = "";

	/// <summary>Cliente DinaupSL activo.</summary>
	public DinaupClientC Client { get; set; }
}

/// <summary>
/// Datos del formulario recien guardado.
/// </summary>
public class FormSavedRequest
{
	/// <summary>GUID de la seccion.</summary>
	public string SectionId { get; set; } = "";

	/// <summary>GUID del registro guardado.</summary>
	public string RowId { get; set; } = "";

	/// <summary>Titulo principal del registro.</summary>
	public string Title { get; set; } = "";

	/// <summary>true si era un registro nuevo (alta).</summary>
	public bool WasNew { get; set; }

	/// <summary>Cliente DinaupSL activo.</summary>
	public DinaupClientC Client { get; set; }
}
 

/// <summary>
/// Datos del formulario para solicitar botones de extension.
/// </summary>
public class FormExtensionsRequest
{
	/// <summary>GUID de la seccion del formulario.</summary>
	public string SectionId { get; set; } = "";

	/// <summary>GUID del registro (vacio si es nuevo).</summary>
	public string RowId { get; set; } = "";

	/// <summary>true si el formulario es de un registro nuevo.</summary>
	public bool IsNew { get; set; }

	/// <summary>Cliente DinaupSL activo.</summary>
	public DinaupClientC Client { get; set; }
}

/// <summary>
/// Boton de extension que se muestra en el footer del formulario.
/// La app host crea instancias con el callback OnClick ya cerrado sobre su contexto.
/// </summary>
public class FormExtensionButton
{
	/// <summary>Texto del boton.</summary>
	public string Title { get; set; } = "";

	/// <summary>Icono Material Design (ej: "dataset", "photo_camera").</summary>
	public string Icon { get; set; } = "";

	/// <summary>Accion al hacer click. El contexto (rowId, servicios, etc.) se captura en el lambda.</summary>
	public Func<Task> OnClick { get; set; }

	/// <summary>Estado de carga. Manejado internamente por DinaZen, la app host no necesita tocarlo.</summary>
	internal bool _isBusy;
}
