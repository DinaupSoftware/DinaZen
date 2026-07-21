using System.Text.Json;
using Microsoft.JSInterop;

namespace DinaZen.Components.DinaupFlex.DnzResponseQuestions;

/// <summary>
/// Recuerda en localStorage las ultimas respuestas que dio el usuario a las variables de un informe
/// o documento dinamico, para no volver a pedirle lo mismo cada vez que lo abre.
///
/// Mismo patron que ReportGridSettingsStore (misma carpeta): instancia manual, sin DI,
/// try/catch vacio porque en el prerender de Blazor Server todavia no hay localStorage.
///
/// Las fechas de un periodo NO se guardan como fechas: se guarda la granularidad elegida
/// (ver DnzResponseQuestions.GrainStorageKey) y el periodo se recalcula respecto a hoy al reabrir.
/// Asi "este mes" sigue siendo este mes el mes que viene.
/// </summary>
public class ResponseQuestionsStore
{
	private readonly IJSRuntime _js;
	private readonly string _key;
	private Dictionary<string, string> _values;
	private bool _loaded;

	public ResponseQuestionsStore(IJSRuntime js, string key)
	{
		_js = js;
		_key = "dnz-vars-" + key;
	}

	/// <summary>Respuestas recordadas. Nunca null tras LoadAsync.</summary>
	public Dictionary<string, string> Current => _values ??= new();

	public async Task LoadAsync()
	{
		if (_loaded) return;
		_loaded = true;
		try
		{
			var json = await _js.InvokeAsync<string>("localStorage.getItem", _key);
			if (json.IsNotEmpty()) _values = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
		}
		catch { }
		_values ??= new();
	}

	public async Task SaveAsync(Dictionary<string, string> values)
	{
		_values = values;
		try
		{
			await _js.InvokeVoidAsync("localStorage.setItem", _key, JsonSerializer.Serialize(values));
		}
		catch { }
	}
}
