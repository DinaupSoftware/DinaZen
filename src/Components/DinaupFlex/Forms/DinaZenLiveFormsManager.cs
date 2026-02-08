namespace DinaZen.Components.DinaupFlex.Forms;

/// <summary>
/// Gestor estatico de formularios vivos. Mantiene un timer que llama a Ping()
/// en cada formulario registrado cada 30 segundos para sincronizar con el servidor.
/// El timer se inicia al registrar el primer formulario y se detiene cuando no quedan.
/// </summary>
public static class DinaZenLiveFormsManager
{
	private static readonly List<ILiveForm> _forms = new();
	private static Timer _timer;
	private static int _isRunning = 0;

	public static void Register(ILiveForm form)
	{
		lock (_forms)
		{
			_forms.Add(form);
			if (_timer == null)
				_timer = new Timer(TimerCallback, null, TimeSpan.FromSeconds(30), TimeSpan.FromSeconds(30));
		}
	}

	public static IReadOnlyList<ILiveForm> GetAll()
	{
		lock (_forms)
		{
			return _forms.ToList();
		}
	}

	public static void Unregister(ILiveForm form)
	{
		lock (_forms)
		{
			_forms.Remove(form);
			if (_forms.Count == 0 && _timer != null)
			{
				_timer.Dispose();
				_timer = null;
			}
		}
	}

	private static void TimerCallback(object state)
	{
		if (Interlocked.Exchange(ref _isRunning, 1) == 1)
			return;

		try
		{
			List<ILiveForm> snapshot;
			lock (_forms)
			{
				snapshot = _forms.ToList();
			}

			foreach (var form in snapshot)
			{
				try { form.Ping(); }
				catch { }
			}
		}
		finally
		{
			Interlocked.Exchange(ref _isRunning, 0);
		}
	}
}

public interface ILiveForm
{
	void Ping();
}
