namespace DinaZen.Components.DinaupFlex.DynamicDocuments;

/// <summary>
/// Datos para enviar un documento dinamico por email.
/// La app host se encarga del envio real.
/// </summary>
public class DinaupDocumentEmailRequest
{
    public string DocumentHtml { get; set; } = "";
    public string FromName { get; set; } = "";
    public string FromEmail { get; set; } = "";
    public string ToEmail { get; set; } = "";
    public string ToName { get; set; } = "";
    public string Subject { get; set; } = "";
    public string DnzFileName { get; set; } = "";
    public string DocumentTitle { get; set; } = "";
    public string EmailBody { get; set; } = "";
}
