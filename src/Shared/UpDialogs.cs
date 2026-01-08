using DemoUp.MyDinaup;
using Dinaup;
using Microsoft.AspNetCore.Components;
using Radzen;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static DemoUp.MyDinaup.SectionsD;

namespace DinaZen.Shared
{
    public class UpDialogs
    {

        DialogService DialogService;

        public UpDialogs(DialogService dialogService)
        {
            DialogService = dialogService;
        }

        public virtual Task<dynamic> OpenAsync<T>(string title, Dictionary<string, object> parameters = null, string width = "70%", string Height = "90%", bool CloseDialogOnOverlayClick = true) where T : ComponentBase
        {

            var options = new DialogOptions()
            {
                Width = width,
                Height = Height,
                ShowClose = false,
                ShowTitle = false,
                Resizable = false,
                Draggable = false,
                CloseDialogOnOverlayClick = CloseDialogOnOverlayClick
            };

            return DialogService.OpenAsync<T>(title, parameters, options);
        }


        public async Task<DinaupDynamicRowDTO> BuscarYSeleccionarRegistroAsync(string Titulo, string seccionID, List<FilterCondition> AdvancedFilter = null)
        {
            throw new NotImplementedException();

        }


        public async Task<dynamic> OpenModalForm(IDinaupRow rowData, bool forzarFormularioEstandar = false)
        {
            rowData.ThrowIf_IsNull(nameof(rowData));
            rowData.Id.ThrowIf_IsEmpty(nameof(rowData) + ".ID");
            rowData.SectionID.ThrowIf_IsEmpty(nameof(rowData) + ".SectionID");
            return await OpenModalForm(rowData.SectionID, rowData.Id, forzarFormularioEstandar);
        }



        public async Task<dynamic> OpenModalForm(Guid sectionId, Guid rowID, bool forzarFormularioEstandar = false)
        {
            return await OpenModalForm(sectionId, rowID, Guid.Empty, forzarFormularioEstandar);
        }
        public async Task<dynamic> OpenModalForm(string SectionId, string rowId, string archivoAdjuntoID = "")
        {
            return await OpenModalForm(SectionId.ToGUID(), rowId.ToGUID(), archivoAdjuntoID.ToGUID());
        }




        public async Task<dynamic> OpenModalForm(Guid SectionId, Guid rowId, Guid archivoAdjuntoId, bool forzarFormularioEstandar = false)
        {
            throw new NotImplementedException();



        }





        public async Task<Guid> OpenModalFormToken(string token)
        {

            throw new NotImplementedException();

        }



        public Task<Guid> OpenModalAddFormAsync(BoardDTO Kanban, BoardDTO.Board_FilaC fila, BoardDTO.Board_Fila_ColumnaC columna)
        {
            throw new NotImplementedException();



        }

        public async Task<Guid> OpenModalAddFormAsync(string SectionId, Dictionary<string, string> autorrellenado = null, List<Dictionary<string, string>> listaautorrellenado = null, Guid archivoAdjuntoID = default)
        {
            throw new NotImplementedException();

        }


        public async Task<Guid> OpenDataFlowModalAsync(VirtualFormDTO _VirtualForm, Dinaup.DataFlowChildDTO DataFlowChild, EventCallback<Dinaup.DataFlowChildDTO> _OnAdd)
        {

            throw new NotImplementedException();

        }




        public async Task BusyDialog(string message)
        {

            //await this.dialogService.OpenAsync("", ds =>
            //{
            //    RenderFragment content = b => { b.OpenElement(0, "RadzenRow"); b.OpenElement(1, "RadzenColumn"); b.AddAttribute(2, "Size", "12"); b.AddContent(3, message); b.CloseElement(); b.CloseElement(); };
            //    return content;
            //}, new DialogOptions() { ShowTitle = false, Style = "min-height:auto;min-width:auto;width:auto", CloseDialogOnEsc = false });
        }


        public async Task<dynamic> OpenDynamicDocument(string DynamicDocumentId, Dictionary<string, string> responsevariables = null, List<DinaupDynamicDocumentDTO> CompatibleDocuments = null)
        {
            throw new NotImplementedException();


            //var dialogParameters = new DialogOptions() { Width = "90%", Height = "99%", ShowClose = false, ShowTitle = false, Resizable = true, Draggable = true, CloseDialogOnOverlayClick = false, };
            //var dialogValues = new Dictionary<string, object> { { nameof(DynamicDocumentDialog.DocId), DynamicDocumentId }, { nameof(DynamicDocumentDialog.VariableValues), responsevariables }, { nameof(DynamicDocumentDialog.CompatibleDocuments), CompatibleDocuments } };
            //return this.dialogService.OpenAsync<DynamicDocumentDialog>("", dialogValues, dialogParameters);
        }
        public async Task<dynamic> OpenReport(string reportId, Dictionary<string, string> responsevariables = null)
        {
            throw new NotImplementedException();


            //var dialogParameters = new DialogOptions() { Width = "90%", Height = "99%", ShowClose = false, ShowTitle = false, Resizable = true, Draggable = true, CloseDialogOnOverlayClick = false, };
            //var dialogValues = new Dictionary<string, object> { { nameof(DynamicDocumentDialog.DocId), DynamicDocumentId }, { nameof(DynamicDocumentDialog.VariableValues), responsevariables }, { nameof(DynamicDocumentDialog.CompatibleDocuments), CompatibleDocuments } };
            //return this.dialogService.OpenAsync<DynamicDocumentDialog>("", dialogValues, dialogParameters);
        }
    }
}
