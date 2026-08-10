using Microsoft.AspNetCore.Components;

namespace DinaZen.Components.WindowManager;

public class WindowState
{
	public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];
	public string Title { get; set; } = "";
	public string Subtitle { get; set; } = "";
	public string Icon { get; set; } = "";
	public string IconUrl { get; set; } = "";

	// Orden de apertura global: lo reparte DnzWindowManagerService desde el mismo contador que usan
	// los modales Radzen. Sube tambien al enfocar la ventana (traer al frente = pasar a ser la ultima).
	public int Order { get; set; }

	// z-index real que pinta DnzWindow. NO se toca a mano: lo calcula el servicio a partir de Order.
	public int ZIndex { get; set; } = 100;
	public bool IsMinimized { get; set; }
	public bool IsMaximized { get; set; }
	public bool IsActive { get; set; }
	public double X { get; set; } = 80;
	public double Y { get; set; } = 40;
	public double Width { get; set; } = 1100;
	public double Height { get; set; } = 620;

	// Minimos al redimensionar con el raton. Viajan hasta el JS (initWindow). Antes estaban
	// escritos a fuego en DnzWindow, asi que ninguna ventana podia encogerse por debajo de
	// 1000px — y un contenido con maqueta estrecha no llegaba a ella nunca.
	public double MinWidth { get; set; } = 1000;
	public double MinHeight { get; set; } = 400;
	public RenderFragment Content { get; set; }
}
