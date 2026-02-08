namespace DinaZen.Components.DinaupFlex.Annotations;

/// <summary>
/// Datos para abrir un dialogo de anotaciones desde DinaupFormView.
/// </summary>
public class DinaupAnnotationRequest
{
    /// <summary>
    /// ID de la seccion.
    /// </summary>
    public Guid SectionId { get; set; }

    /// <summary>
    /// ID del registro.
    /// </summary>
    public Guid RowId { get; set; }

    /// <summary>
    /// Tipo de anotacion (Comments, Files, PublicGallery).
    /// </summary>
    public Dinaup.AnnotationTypeE Type { get; set; }

    /// <summary>
    /// Cliente DinaupSL para las llamadas API.
    /// </summary>
    public Dinaup.DinaupClientC Client { get; set; }
}
