using Microsoft.AspNetCore.Components;

namespace DinaZen.Components.DinaupFlex;

/// <summary>
/// Contexto para el template de variables en documentos dinamicos e informes.
/// </summary>
public class DinaupVariablesContext
{
    /// <summary>
    /// Documento/informe que requiere variables (implementa IQuestionContainer).
    /// </summary>
    public Dinaup.IQuestionContainer Document { get; set; }

    /// <summary>
    /// Valores actuales de las variables.
    /// </summary>
    public Dictionary<string, string> VariableValues { get; set; } = new();

    /// <summary>
    /// Callback para confirmar las variables y continuar la ejecucion.
    /// </summary>
    public EventCallback<Dictionary<string, string>> OnConfirm { get; set; }
}
