using Microsoft.AspNetCore.Components;
using Dinaup;
using static Dinaup.VirtualFormDTO;

namespace DinaZen.Components.DinaupFlex.Forms;

public class DinaZenFormCallbacks
{
	// Client (permite a DinaupFlex renderizar desplegables autonomamente)
	public DinaupClientC Client { get; set; }

	// File/Relations
	public Func<Guid, Task<FileResponse>> OnFileGet { get; set; }
	public Func<string, string, Task> OnOpenModalForm { get; set; }
	public Func<string, Task> OnOpenModalFormToken { get; set; }
	public Func<string, string, Task<string>> OnOpenFormAddRelation { get; set; }
	public Func<string, string, Task<DinaupDynamicRowDTO>> OnBuscarYSeleccionar { get; set; }

	// Control specific
	public Func<string, Task<string>> OnFormatearCodigo { get; set; }
	public Func<Guid, Guid, string, Task> OnVerHistorial { get; set; }

	// Primary List
	public Func<bool> CanAddNewItem { get; set; }
	public Func<ListItem.ListItemRow, bool> CanDeleteItem { get; set; }

	// RenderFragments (host app provides these)
	public RenderFragment<string> ReportTemplate { get; set; }
	public RenderFragment ToolbarExtensions { get; set; }
	public RenderFragment<EventCallback<DinaupFileDTO>> FileUploaderTemplate { get; set; }
	public RenderFragment<FormReportSelectorContext> ReportSelectorTemplate { get; set; }
}

public class FormReportSelectorContext
{
	public string ReportId { get; set; }
	public EventCallback<DinaupDynamicRowDTO> OnSelect { get; set; }
	public bool AutoSelect { get; set; }
}
