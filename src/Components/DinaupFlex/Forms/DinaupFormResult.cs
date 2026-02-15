namespace DinaZen.Components.DinaupFlex.Forms;

/// <summary>
/// Resultado devuelto cuando un DnzFormView se cierra.
/// </summary>
public class DinaupFormResult
{
    /// <summary>
    /// Como se cerro el formulario.
    /// </summary>
    public DinaupFormCloseReason Reason { get; set; } = DinaupFormCloseReason.Cancelled;

    /// <summary>
    /// ID del registro (RowID). Vacio si fue un alta que no se guardo.
    /// </summary>
    public string RowId { get; set; } = "";

    /// <summary>
    /// ID de la seccion.
    /// </summary>
    public string SectionId { get; set; } = "";

    /// <summary>
    /// Indica si el formulario fue modificado (algun campo cambio).
    /// </summary>
    public bool WasModified { get; set; }

    /// <summary>
    /// Titulo principal del registro al cerrar.
    /// </summary>
    public string Title { get; set; } = "";
}

/// <summary>
/// Motivo por el que se cerro un formulario DnzFormView.
/// </summary>
public enum DinaupFormCloseReason
{
    /// <summary>El usuario cancelo o cerro sin guardar.</summary>
    Cancelled,

    /// <summary>El formulario se cerro tras guardar cambios.</summary>
    Saved,

    /// <summary>Se cerro por un error.</summary>
    Error,

    /// <summary>Se cerro por timeout de sesion.</summary>
    SessionExpired
}
