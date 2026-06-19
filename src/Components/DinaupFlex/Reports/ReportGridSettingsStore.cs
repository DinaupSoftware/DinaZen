using System.Text.Json;
using System.Threading.Tasks;
using Dinaup;
using Microsoft.JSInterop;
using Radzen;

namespace DinaZen.Components.DinaupFlex.Reports;

// Persiste en localStorage la configuración de columnas/orden de la rejilla (por ruta + informe).
// Saca el JS interop y la (de)serialización fuera del componente.
public class ReportGridSettingsStore
{
	private readonly IJSRuntime _js;
	private readonly string _key;
	private DataGridSettings _settings;
	private bool _loaded;

	public ReportGridSettingsStore(IJSRuntime js, string key)
	{
		_js = js;
		_key = key;
	}

	public DataGridSettings Current => _settings;

	public async Task LoadAsync()
	{
		if (_loaded) return;
		_loaded = true;
		try
		{
			var json = await _js.InvokeAsync<string>("localStorage.getItem", _key);
			if (json.IsNotEmpty())
			{
				_settings = JsonSerializer.Deserialize<DataGridSettings>(json);
				if (_settings.IsNotNull()) _settings.CurrentPage = 0;
			}
		}
		catch { }
	}

	public async Task SaveAsync(DataGridSettings x)
	{
		try
		{
			_settings = x;
			await _js.InvokeVoidAsync("localStorage.setItem", _key, JsonSerializer.Serialize(x));
		}
		catch { }
	}
}
