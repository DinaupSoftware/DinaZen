namespace DinaZen.Components.DinaupFlex.Forms;

/// <summary>
/// Configuracion de formularios. Delega a DinaZenConfig para compatibilidad.
/// </summary>
public static class DinaZenFormConfig
{
	public static bool DeepDispose
	{
		get => DinaZenConfig.DeepDispose;
		set => DinaZenConfig.DeepDispose = value;
	}
}
