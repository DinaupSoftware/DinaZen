namespace DinaZen.Components.DinaupFlex.Forms;

/// <summary>
/// Configuracion de formularios. Delega a DnzConfig para compatibilidad.
/// </summary>
public static class DnzFormConfig
{
	public static bool DeepDispose
	{
		get => DnzConfig.DeepDispose;
		set => DnzConfig.DeepDispose = value;
	}
}
