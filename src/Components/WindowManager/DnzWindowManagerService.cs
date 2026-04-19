using Microsoft.AspNetCore.Components;
using Radzen;

namespace DinaZen.Components.WindowManager;

/// <summary>
/// Servicio scoped que gestiona ventanas flotantes tipo macOS.
/// Un instancia por circuito Blazor.
/// </summary>
public class DnzWindowManagerService : IDisposable
{
	private readonly List<WindowState> _windows = new();
	private readonly List<string> _pendingReposition = new();
	private readonly DialogService _dialogService;
	private int _zCounter = 100;
	private int _openCount = 0;
	private int _activeModals = 0;

	public const int MaxWindows = 6;
	public IReadOnlyList<WindowState> Windows => _windows;
	public event Action OnChanged;
	public event Action OnMaxWindowsReached;

	public DnzWindowManagerService(DialogService dialogService)
	{
		_dialogService = dialogService;
		if (_dialogService != null)
		{
			_dialogService.OnOpen += HandleDialogOpen;
			_dialogService.OnClose += HandleDialogClose;
		}
	}

	private void HandleDialogOpen(string title, Type type, Dictionary<string, object> parameters, DialogOptions options)
	{
		_activeModals++;
	}

	private void HandleDialogClose(dynamic result)
	{
		if (_activeModals > 0) _activeModals--;
		// Al cerrar el ultimo modal, las ventanas que estaban encima ya no necesitan estarlo:
		// si luego aparece otro modal, debe tapar a esas ventanas preexistentes.
		if (_activeModals == 0)
		{
			var reseted = false;
			foreach (var win in _windows)
			{
				if (win.AboveModal) { win.AboveModal = false; reseted = true; }
			}
			if (reseted) NotifyChanged();
		}
	}

	public void Dispose()
	{
		if (_dialogService != null)
		{
			_dialogService.OnOpen -= HandleDialogOpen;
			_dialogService.OnClose -= HandleDialogClose;
		}
		GC.SuppressFinalize(this);
	}

	// Viewport dimensions (updated from JS via SetViewport)
	// Defaults conservadores: si JS no llega a tiempo, usamos valores seguros
	// que nunca desborden en pantallas reales
	private double _viewportWidth = 0;
	private double _viewportHeight = 0;
	private bool _viewportReady = false;

	/// <summary>
	/// Llamar desde JS al iniciar para establecer dimensiones del viewport.
	/// Si hay ventanas pendientes de reposicionar, las recentra.
	/// </summary>
	public void SetViewport(double width, double height)
	{
		var wasReady = _viewportReady;
		_viewportWidth = width;
		_viewportHeight = height;
		_viewportReady = true;

		// Si es la primera vez que recibimos viewport y hay ventanas pendientes, reposicionar
		if (wasReady == false && _pendingReposition.Count > 0)
		{
			RepositionPendingWindows();
		}
	}

	/// <summary>
	/// Reposiciona ventanas que se abrieron antes de tener viewport real.
	/// Retorna las ventanas reposicionadas para que el host actualice el DOM via JS.
	/// </summary>
	public List<WindowState> FlushRepositioned()
	{
		if (_pendingReposition.Count == 0) return null;
		var result = new List<WindowState>();
		foreach (var id in _pendingReposition)
		{
			var win = _windows.FirstOrDefault(w => w.Id == id);
			if (win != null) result.Add(win);
		}
		_pendingReposition.Clear();
		return result.Count > 0 ? result : null;
	}

	private void RepositionPendingWindows()
	{
		foreach (var id in _pendingReposition)
		{
			var win = _windows.FirstOrDefault(w => w.Id == id);
			if (win == null) continue;

			var w = win.Width;
			var h = win.Height;

			// Recalcular altura optima
			var usableHeight = _viewportHeight - DnzTaskbarTotalHeight;
			var targetH = usableHeight * 0.90;
			h = Math.Max(h, targetH);
			h = Math.Min(h, usableHeight);

			// Centrar verticalmente
			var topMargin = (usableHeight - h) / 2.0;
			var y = Math.Max(16, topMargin);
			var bottomEdge = y + h;
			var taskbarTop = _viewportHeight - DnzTaskbarTotalHeight;
			if (bottomEdge > taskbarTop) y = Math.Max(16, taskbarTop - h);

			// Centrar horizontalmente
			var centerX = (_viewportWidth - w) / 2.0;
			var x = Math.Max(20, centerX);
			if (x + w > _viewportWidth - 20) x = Math.Max(20, _viewportWidth - w - 20);

			win.X = Math.Round(x);
			win.Y = Math.Round(y);
			win.Width = Math.Round(w);
			win.Height = Math.Round(h);
		}
		NotifyChanged();
	}

	// Altura del taskbar (68px) + bottom (10px) + margen de seguridad (12px)
	private const double DnzTaskbarTotalHeight = 90.0;

	public string Open(WindowOptions options, RenderFragment content)
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
			var usableHeight = _viewportHeight - DnzTaskbarTotalHeight;

			// La ventana ocupa el 90% del espacio util, pero nunca menos que InitialHeight
			// ni mas que el espacio util con margen
			var targetH = usableHeight * 0.90;
			h = Math.Max(options.InitialHeight, targetH);
			h = Math.Min(h, usableHeight);
		}
		// Si no hay viewport, usar InitialHeight tal cual (se reposicionara cuando llegue el viewport)

		// ── Posicion vertical: centrar en el espacio sobre el taskbar ──
		double y;
		if (_viewportReady && _viewportHeight > 0)
		{
			var usableHeight = _viewportHeight - DnzTaskbarTotalHeight;
			var topMargin = (usableHeight - h) / 2.0;
			y = Math.Max(16, topMargin);

			// Validacion final: la ventana nunca debe sobrepasar la zona del taskbar
			var bottomEdge = y + h;
			var taskbarTop = _viewportHeight - DnzTaskbarTotalHeight;
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
		var state = new WindowState
		{
			Id = options.PresetId.IsNotEmpty() ? options.PresetId : Guid.NewGuid().ToString("N")[..8],
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
			AboveModal = _activeModals > 0,
			Content = content
		};

		// Marcar para reposicionar si no habia viewport al calcular posicion
		if (_viewportReady == false)
			_pendingReposition.Add(state.Id);

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
			.Where(w => w.IsMinimized == false)
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
		var active = _windows.FirstOrDefault(w => w.IsActive && w.IsMinimized == false);
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
			.Where(w => w.IsMinimized == false)
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

		win.IsMaximized = (win.IsMaximized == false);
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
	public WindowState GetWindow(string windowId)
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
