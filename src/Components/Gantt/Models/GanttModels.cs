
using Microsoft.AspNetCore.Components;

namespace DinaZen.Components.Gantt.Models
{
    public class GanttGroup
    {
        public string Id { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public object Data { get; set; }
        public RenderFragment<GanttGroup> Template { get; set; }
    }

    public sealed class GanttViewport
    {
        public DateTime FocusDate { get; set; } = DateTime.Today;
        public GanttViewMode ViewMode { get; set; } = GanttViewMode.Month;
        public int Zoom { get; set; } = 100;

        public (DateTime From, DateTime To) GetRange()
        {
            return ViewMode switch
            {
                // Hora: 24 horas centradas
                GanttViewMode.Hour => (FocusDate.ComienzoDelDia(), FocusDate.FinDelDia()),

                // Día: 1 día completo (00:00 a 24:00)
                GanttViewMode.Day => (FocusDate.Date, FocusDate.Date.AddDays(1)),

                // Semana: desde el lunes de la semana actual hasta el domingo
                GanttViewMode.Week => (StartOfWeek(FocusDate), StartOfWeek(FocusDate).AddDays(7)),

                // Mes: desde el día 1 hasta el último día del mes
                GanttViewMode.Month => (new DateTime(FocusDate.Year, FocusDate.Month, 1),
                                         new DateTime(FocusDate.Year, FocusDate.Month, 1).AddMonths(1)),

                // Año: desde enero hasta diciembre del año
                GanttViewMode.Year => (new DateTime(FocusDate.Year, 1, 1),
                                         new DateTime(FocusDate.Year + 1, 1, 1)),
                _ => throw new NotSupportedException()
            };
        }

        private DateTime StartOfWeek(DateTime date)
        {
            var diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
            return date.AddDays(-diff).Date;
        }
    }
    public enum GanttViewMode
    {
        Hour,
        Day,
        Week,
        Month,
        Year
    }

    public class GanttColumn
    {
        public DateTime From { get; init; }
        public DateTime To { get; init; }
        public string Text { get; init; } = "";

        public double LeftPercent { get; init; }
        public double WidthPercent { get; init; }


    }




    public class GanttItem
    {
        public string Id { get; init; }

        // Identidad / fila
        public string GroupId { get; init; }      // tarea / empleado / recurso
        public string Text { get; init; } = "";
        public string Tooltip { get; set; } = "";

        public string RowStyle { get; set; } = "";
        // Tiempo real
        public DateTime From { get; init; }
        public DateTime To { get; init; }

        public object Data { get; init; }

        // Layout relativo
        public double LeftPercent { get; set; }
        public double WidthPercent { get; set; }

        public GanttItem(string id, string groupId, string text, DateTime from, DateTime to, object data, string styleX = "")
        {
            Id = id;
            GroupId = groupId;
            Text = text;
            From = from;
            To = to;
            Data = data;
            this.RowStyle = styleX;
        }

    }
}
