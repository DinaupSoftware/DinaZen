using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DinaZen.Components.DinaupFlex.DynamicDocuments;
using DinaZen.Components.DinaupFlex.Reports;
using DinaZen.Components.WindowManager;
using DinaZen.Services;
using Dinaup;
using Radzen;

namespace DinaZen.Components.DinaupFlex.Forms;

/// <summary>
/// Despacha las colas que el server adjunta a cada respuesta del formulario.
///
/// Un script del formulario puede pedir cosas que solo el cliente sabe hacer
/// (abrir un registro, abrir un informe, encolar un alta). El server no las
/// ejecuta: las encola y las manda en el JSON de cada respuesta. Esta clase es
/// el consumidor de esas colas.
///
/// Vive aparte porque la comparten DnzFormView y DnzFormByTokenView; los
/// mensajes (DialogList_Msgbox) NO se procesan aqui, se pintan en el markup de
/// cada vista porque son estado declarativo, no eventos.
///
/// Escenarios cubiertos:
///   E1 - abrirregistros  -> interceptor del host, o formulario por seccion+registro
///   E2 - coladeagregado  -> formulario por token (subventana de alta ya creada en server)
///   E3 - abririnformes   -> informe, o documento dinamico si esdocdinamico
/// </summary>
internal static class DnzFormDialogQueue
{
	/// <summary>
	/// Procesa las colas pendientes del formulario.
	/// </summary>
	/// <param name="served">
	/// IDs ya servidos por esta instancia. Es obligatorio: un server antiguo no
	/// vacia las colas al servirlas, asi que las reenvia en cada sincronizacion
	/// y sin este filtro el formulario se reabriria en bucle.
	/// </param>
	internal static async Task ProcessAsync(VirtualFormDTO form, HashSet<string> served, DinaupClientC client, DnzInterceptorService interceptor, DialogService dialogService, DnzWindowManagerService windowManager = null)
	{
		if (form?.MainForm.IsNull() ?? true) return;

		await ProcessOpenRecordsAsync(form, served, client, interceptor, dialogService, windowManager);
		await ProcessAddQueueAsync(form, served, client, dialogService);
		await ProcessOpenReportsAsync(form, served, client, dialogService, windowManager);
	}

	// ── E1: abrir un registro existente ──
	private static async Task ProcessOpenRecordsAsync(VirtualFormDTO form, HashSet<string> served, DinaupClientC client, DnzInterceptorService interceptor, DialogService dialogService, DnzWindowManagerService windowManager)
	{
		var pendientes = form.MainForm.DialogList_FromOpen;
		if (pendientes.IsNull() || pendientes.Count == 0) return;

		foreach (var actual in pendientes.ToList())
		{
			var sectionId = actual.Section?.ID.STR() ?? "";
			if (sectionId.IsEmpty() || actual.ID.IsEmpty()) continue;
			if (served.Add("open|" + sectionId + "|" + actual.ID) == false) continue;

			var titulo = actual.Section?.Label ?? "";
			if (await interceptor.TryOpenRecordAsync(new OpenRecordRequest { SectionId = sectionId, RowId = actual.ID, Title = titulo, Client = client })) continue;

			// Comportamiento por defecto: ventana flotante si la hay, si no modal
			if (windowManager.IsNotNull())
				DnzFormView.OpenAsWindow(windowManager, client, sectionId, actual.ID, title: titulo);
			else
				await DnzFormView.OpenAsync(dialogService, client, sectionId, actual.ID);
		}
	}

	// ── E2: alta encolada (el server ya creo la subventana, solo hay que pintarla) ──
	private static async Task ProcessAddQueueAsync(VirtualFormDTO form, HashSet<string> served, DinaupClientC client, DialogService dialogService)
	{
		var pendientes = form.MainForm.DialogList_FromAdd;
		if (pendientes.IsNull() || pendientes.Count == 0) return;

		foreach (var actual in pendientes.ToList())
		{
			if (actual.Token.IsEmpty()) continue;
			if (served.Add("add|" + actual.Token.STR()) == false) continue;

			// Token compuesto "hijo|padre": la subventana esta encolada, no abierta.
			// Sin el padre el server no la materializa y responde "caducada".
			var tokenCompuesto = actual.Token.STR() + "|" + form.Token;

			await dialogService.OpenAsync<DnzFormByTokenView>("", new Dictionary<string, object>
			{
				{ nameof(DnzFormByTokenView.Client), client },
				{ nameof(DnzFormByTokenView.Token), tokenCompuesto }
			}, new DialogOptions
			{
				Width = "90%",
				Height = "90%",
				CloseDialogOnEsc = true,
				Resizable = true,
				Draggable = true,
				CloseDialogOnOverlayClick = false,
				ShowClose = false,
				ShowTitle = false
			});
		}
	}

	// ── E3: abrir informe o documento dinamico ──
	private static async Task ProcessOpenReportsAsync(VirtualFormDTO form, HashSet<string> served, DinaupClientC client, DialogService dialogService, DnzWindowManagerService windowManager)
	{
		var pendientes = form.MainForm.DialogList_ReportOpen;
		if (pendientes.IsNull() || pendientes.Count == 0) return;

		foreach (var actual in pendientes.ToList())
		{
			if (actual.ID.IsEmpty()) continue;
			if (served.Add("report|" + actual.ID.STR() + "|" + actual.Token.STR()) == false) continue;

			var variables = actual.Variables ?? new Dictionary<string, string>();

			if (actual.IsDynamicDocument)
			{
				await DnzDynamicDocumentView.OpenAsync(dialogService, client, actual.ID.STR(), variables);
				continue;
			}

			if (windowManager.IsNotNull())
				DnzReportView.OpenAsWindow(windowManager, client, actual.ID.STR(), variables);
			else
				await DnzReportView.OpenAsync(dialogService, client, actual.ID.STR(), variables);
		}
	}
}
