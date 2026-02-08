using Microsoft.AspNetCore.Components;

namespace DinaZen.Components.WindowManager;

/// <summary>
/// Servicio scoped que gestiona ventanas flotantes tipo macOS.
/// Un instancia por circuito Blazor.
/// </summary>
public class DnzWindowManagerService
{
	private readonly List<DnzWindowState> _windows = new();
	private int _zCounter = 100;
	private int _openCount = 0;

	public const int MaxWindows = 6;
	public IReadOnlyList<DnzWindowState> Windows => _windows;
	public event Action OnChanged;
	public event Action OnMaxWindowsReached;

	// Viewport dimensions (updated from JS via SetViewport)
	// Defaults conservadores: si JS no llega a tiempo, usamos valores seguros
	// que nunca desborden en pantallas reales
	private double _viewportWidth = 0;
	private double _viewportHeight = 0;
	private bool _viewportReady = false;

	/// <summary>
	/// Llamar desde JS al iniciar para establecer dimensiones del viewport.
	/// </summary>
	public void SetViewport(double width, double height)
	{
		_viewportWidth = width;
		_viewportHeight = height;
		_viewportReady = true;
	}

	// Altura del taskbar (68px) + bottom (10px) + margen de seguridad (12px)
	private const double TaskbarTotalHeight = 90.0;

	public string Open(DnzWindowOptions options, RenderFragment content)
	{
		if (_windows.Count >= MaxWindows)
		{
			OnMaxWindowsReached?.Invoke();
			return null;
		}

		var w = options.InitialWidth;
		var h = options.InitialHeight;

		// Si tenemos viewport real, calcular altura optima
		if (_viewportReady && _viewportHeight > 0)
		{
			// Espacio util = viewport menos taskbar completo
			var usableHeight = _viewportHeight - TaskbarTotalHeight;

			// La ventana ocupa el 90% del espacio util, pero nunca menos que InitialHeight
			// ni mas que el espacio util con margen
			var targetH = usableHeight * 0.90;
			h = Math.Max(options.InitialHeight, targetH);
			h = Math.Min(h, usableHeight);
		}
		// Si no hay viewport, usar InitialHeight tal cual (seguro en cualquier pantalla)

		// ── Posicion vertical: centrar en el espacio sobre el taskbar ──
		double y;
		if (_viewportReady && _viewportHeight > 0)
		{
			var usableHeight = _viewportHeight - TaskbarTotalHeight;
			var topMargin = (usableHeight - h) / 2.0;
			y = Math.Max(16, topMargin);

			// Validacion final: la ventana nunca debe sobrepasar la zona del taskbar
			var bottomEdge = y + h;
			var taskbarTop = _viewportHeight - TaskbarTotalHeight;
			if (bottomEdge > taskbarTop)
				y = Math.Max(16, taskbarTop - h);
		}
		else
		{
			// Sin viewport: posicion segura
			y = 40;
		}

		// ── Posicion horizontal: centrada con cascade solo en X ──
		var cascadeStep = 36;
		var cascadeIndex = _openCount % 6;
		double x;
		if (_viewportReady && _viewportWidth > 0)
		{
			var centerX = (_viewportWidth - w) / 2.0;
			x = Math.Max(20, centerX + (cascadeIndex * cascadeStep));
			if (x + w > _viewportWidth - 20)
				x = Math.Max(20, _viewportWidth - w - 20);
		}
		else
		{
			x = 80 + (cascadeIndex * cascadeStep);
		}

		_openCount++;

		// Redondear a enteros: evita decimales que con culturas como es-ES
		// generarian CSS invalido (ej: "791,4px" en vez de "791px")
		var state = new DnzWindowState
		{
			Title = options.Title,
			Subtitle = options.Subtitle,
			Icon = options.Icon,
			IconUrl = options.IconUrl,
			Width = Math.Round(w),
			Height = Math.Round(h),
			X = Math.Round(x),
			Y = Math.Round(y),
			ZIndex = ++_zCounter,
			IsActive = true,
			Content = content
		};

		// Desactivar ventana anterior
		foreach (var win in _windows)
			win.IsActive = false;

		_windows.Add(state);
		NotifyChanged();
		return state.Id;
	}

	public void Close(string windowId)
	{
		var win = _windows.FirstOrDefault(w => w.Id == windowId);
		if (win == null) return;

		_windows.Remove(win);

		// Activar la ultima ventana visible
		var topWindow = _windows
			.Where(w => !w.IsMinimized)
			.OrderByDescending(w => w.ZIndex)
			.FirstOrDefault();

		if (topWindow != null)
			topWindow.IsActive = true;

		NotifyChanged();
	}

	/// <summary>
	/// Cierra la ventana activa (la que tiene foco). Usado por Escape.
	/// </summary>
	public void CloseActive()
	{
		var active = _windows.FirstOrDefault(w => w.IsActive && !w.IsMinimized);
		if (active == null) return;
		Close(active.Id);
	}

	public void Focus(string windowId)
	{
		var win = _windows.FirstOrDefault(w => w.Id == windowId);
		if (win == null) return;

		foreach (var w in _windows)
			w.IsActive = false;

		win.IsActive = true;
		win.IsMinimized = false;
		win.ZIndex = ++_zCounter;
		NotifyChanged();
	}

	public void Minimize(string windowId)
	{
		var win = _windows.FirstOrDefault(w => w.Id == windowId);
		if (win == null) return;

		win.IsMinimized = true;
		win.IsActive = false;

		// Activar la siguiente ventana visible
		var topWindow = _windows
			.Where(w => !w.IsMinimized)
			.OrderByDescending(w => w.ZIndex)
			.FirstOrDefault();

		if (topWindow != null)
			topWindow.IsActive = true;

		NotifyChanged();
	}

	public void Restore(string windowId)
	{
		Focus(windowId); // Restore = focus (desminiminiza + trae al frente)
	}

	public void ToggleMaximize(string windowId)
	{
		var win = _windows.FirstOrDefault(w => w.Id == windowId);
		if (win == null) return;

		win.IsMaximized = !win.IsMaximized;
		NotifyChanged();
	}

	public void ToggleMinimize(string windowId)
	{
		var win = _windows.FirstOrDefault(w => w.Id == windowId);
		if (win == null) return;

		if (win.IsMinimized)
			Focus(windowId);
		else if (win.IsActive)
			Minimize(windowId);
		else
			Focus(windowId);
	}

	public void UpdatePosition(string windowId, double x, double y, double width, double height)
	{
		var win = _windows.FirstOrDefault(w => w.Id == windowId);
		if (win == null) return;

		win.X = x;
		win.Y = y;
		win.Width = width;
		win.Height = height;
		// No notify — esto viene de JS, no necesitamos re-render
	}

	/// <summary>
	/// Busca una ventana por ID. Retorna null si no existe.
	/// </summary>
	public DnzWindowState GetWindow(string windowId)
	{
		return _windows.FirstOrDefault(w => w.Id == windowId);
	}

	/// <summary>
	/// Actualiza el titulo de una ventana.
	/// </summary>
	public void UpdateTitle(string windowId, string title)
	{
		var win = _windows.FirstOrDefault(w => w.Id == windowId);
		if (win == null) return;
		win.Title = title;
		NotifyChanged();
	}

	/// <summary>
	/// Actualiza el icono de una ventana.
	/// </summary>
	public void UpdateIcon(string windowId, string icon)
	{
		var win = _windows.FirstOrDefault(w => w.Id == windowId);
		if (win == null) return;
		win.Icon = icon;
		NotifyChanged();
	}

	/// <summary>
	/// Actualiza el subtitulo de una ventana.
	/// </summary>
	public void UpdateSubtitle(string windowId, string subtitle)
	{
		var win = _windows.FirstOrDefault(w => w.Id == windowId);
		if (win == null) return;
		win.Subtitle = subtitle;
		NotifyChanged();
	}

	/// <summary>
	/// Actualiza toda la informacion visual de una ventana de una vez.
	/// </summary>
	public void UpdateWindowInfo(string windowId, string title = null, string subtitle = null, string icon = null, string iconUrl = null)
	{
		var win = _windows.FirstOrDefault(w => w.Id == windowId);
		if (win == null) return;

		if (title != null) win.Title = title;
		if (subtitle != null) win.Subtitle = subtitle;
		if (icon != null) win.Icon = icon;
		if (iconUrl != null) win.IconUrl = iconUrl;
		NotifyChanged();
	}

	private void NotifyChanged() => OnChanged?.Invoke();
}
