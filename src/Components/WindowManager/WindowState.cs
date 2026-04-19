using Microsoft.AspNetCore.Components;

namespace DinaZen.Components.WindowManager;

public class WindowState
{
	public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];
	public string Title { get; set; } = "";
	public string Subtitle { get; set; } = "";
	public string Icon { get; set; } = "";
	public string IconUrl { get; set; } = "";
	public int ZIndex { get; set; } = 100;
	public bool IsMinimized { get; set; }
	public bool IsMaximized { get; set; }
	public bool IsActive { get; set; }
	public bool AboveModal { get; set; }
	public double X { get; set; } = 80;
	public double Y { get; set; } = 40;
	public double Width { get; set; } = 1020;
	public double Height { get; set; } = 620;
	public RenderFragment Content { get; set; }
}
