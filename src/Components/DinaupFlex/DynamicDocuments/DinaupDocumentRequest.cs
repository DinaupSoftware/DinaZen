namespace DinaZen.Components.DinaupFlex.DynamicDocuments;

/// <summary>
/// Lo que el visor de documentos dinamicos entrega a la app host para que haga algo con el
/// documento: enviarlo por email o mandarlo a firmar. La app host se encarga de la accion real.
///
/// Los datos viajan en Metadata, el diccionario que devolvio el script del documento
/// (MetaData_Set): asi un metadato nuevo llega al host SIN tocar esta libreria. Las propiedades
/// con nombre son atajos de lectura sobre ese diccionario, no una copia aparte.
/// </summary>
public class DinaupDocumentRequest
{
    public string DocumentHtml { get; set; } = "";
    public string DocumentTitle { get; set; } = "";

    /// <summary>
    /// Variables con las que se ejecuto el documento. La app host las necesita para resolver
    /// EmailBody cuando este es el GUID de otra plantilla.
    /// </summary>
    public Dictionary<string, string> VariableValues { get; set; } = new();

    /// <summary>
    /// Metadatos del documento con los alias ya resueltos a su clave canonica: el host lee
    /// siempre "email_asunto" aunque la plantilla escribiera "email_subject".
    /// </summary>
    public Dictionary<string, string> Metadata { get; set; } = new();

    public string Get(string clave)
    {
        if (Metadata == null || clave.IsEmpty()) return "";
        return Metadata.TryGetValue(clave, out string valor) ? (valor ?? "") : "";
    }

    public string FromEmail => Get(ClaveFromEmail);
    public string FromName => Get(ClaveFromName);
    public string ToEmail => Get(ClaveToEmail);
    public string ToName => Get(ClaveToName);
    public string Subject => Get(ClaveSubject);
    public string EmailBody => Get(ClaveEmailBody);
    public string DnzFileName => Get(ClaveFileName);

    /// <summary>
    /// email_sign: la plantilla pide que el documento se FIRME en vez de enviarse por email.
    /// El correo al firmante ya lo manda el propio servicio de firma, por eso son destinos
    /// excluyentes y no dos acciones que convivan.
    /// </summary>
    public bool RequiereFirma => EsVerdadero(Get(ClaveSign));

    /// <summary>
    /// Permisivo a proposito: la plantilla la escribe una persona, y "1", "si" o "true"
    /// significan lo mismo para quien la escribe.
    /// </summary>
    public static bool EsVerdadero(string valor)
    {
        if (valor.IsEmpty()) return false;

        switch (valor.Trim().ToLowerInvariant())
        {
            case "1":
            case "s":
            case "si":
            case "sí":
            case "true":
            case "yes":
                return true;
            default:
                return false;
        }
    }

    // Claves canonicas. Viven aqui para que el visor las vuelque y el host las lea por el
    // mismo nombre, sin literales sueltos repartidos por las dos partes.
    public const string ClaveFromEmail = "email_from";
    public const string ClaveFromName = "email_from_name";
    public const string ClaveToEmail = "email_destinatario";
    public const string ClaveToName = "email_destinatario_nombre";
    public const string ClaveSubject = "email_asunto";
    public const string ClaveEmailBody = "email_body";
    public const string ClaveFileName = "filename";
    public const string ClaveSign = "email_sign";
}
