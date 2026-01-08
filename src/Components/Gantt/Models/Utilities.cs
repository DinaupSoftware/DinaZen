using DinaZen.Components.Gantt.Models;
using System.Globalization;

namespace DinaZen.Components.Gantt
{

    public static class Utilities
    {
        private static DateTime StartOfWeek(DateTime date)
        {
            var diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
            return date.AddDays(-diff).Date;
        }



        public static IReadOnlyList<GanttItem> GenerateItems(IEnumerable<GanttItem> source, GanttViewport viewport)
        {

            var (viewportFrom, viewportTo) = viewport.GetRange();


            var retornar = new List<GanttItem> ();


            var totalTicks = (viewportTo - viewportFrom).Ticks;

            foreach (var s in source)
            {
                // fuera del viewport → se ignora (o no, a tu elección)
                if (s.To <= viewportFrom || s.From >= viewportTo)
                    continue;

                var from = s.From < viewportFrom ? viewportFrom : s.From;
                var to = s.To > viewportTo ? viewportTo : s.To;

                var leftTicks = (from - viewportFrom).Ticks;
                var widthTicks = (to - from).Ticks;

                s.Tooltip = $"{s.Text}\n{s.From:dd/MM/yyyy HH:mm} - {s.To:dd/MM/yyyy HH:mm}";
                s.LeftPercent = leftTicks * 100d / totalTicks;
                s.WidthPercent = widthTicks * 100d / totalTicks;
                retornar.Add(s);
 
            }

            return retornar;
        }


        public static IReadOnlyList<GanttColumn> GenerateColumns(GanttViewport viewport, GanttViewMode viewMode, int hourStep = 1)
        {
            var (viewportFrom, viewportTo) = viewport.GetRange();




            var columns = new List<GanttColumn>();
            var totalTicks = (viewportTo - viewportFrom).Ticks;

            void AddColumn(DateTime from, DateTime to, string text)
            {
                // Ajustar al viewport visible
                var clampedFrom = from < viewportFrom ? viewportFrom : from;
                var clampedTo = to > viewportTo ? viewportTo : to;

                if (clampedFrom >= clampedTo) return;

                var leftTicks = (clampedFrom - viewportFrom).Ticks;
                var widthTicks = (clampedTo - clampedFrom).Ticks;

                columns.Add(new GanttColumn
                {
                    From = from,
                    To = to,
                    Text = text,
                    LeftPercent = leftTicks * 100d / totalTicks,
                    WidthPercent = widthTicks * 100d / totalTicks
                });
            }

            // Determinar qué tipo de columna generar según el modo de vista
            var columnType = GetColumnTypeForViewMode(viewMode);

            switch (columnType)
            {
                case GanttViewMode.Hour:
                    {
                        var cursor = new DateTime(viewportFrom.Year, viewportFrom.Month, viewportFrom.Day, viewportFrom.Hour, 0, 0);

                        while (cursor < viewportTo)
                        {
                            var next = cursor.AddHours(hourStep);
                            AddColumn(cursor, next, cursor.ToString("HH:mm"));
                            cursor = next;
                        }

                        break;
                    }

                case GanttViewMode.Day:
                    {
                        var cursor = viewportFrom.Date;

                        while (cursor < viewportTo)
                        {
                            AddColumn(
                                cursor,
                                cursor.AddDays(1),
                                cursor.ToString("dd MMM"));

                            cursor = cursor.AddDays(1);
                        }

                        break;
                    }

                case GanttViewMode.Week:
                    {
                        var cursor = StartOfWeek(viewportFrom);

                        while (cursor < viewportTo)
                        {
                            AddColumn(
                                cursor,
                                cursor.AddDays(7),
                                $"Sem {ISOWeek.GetWeekOfYear(cursor)}");

                            cursor = cursor.AddDays(7);
                        }

                        break;
                    }

                case GanttViewMode.Month:
                    {
                        var cursor = new DateTime(viewportFrom.Year, viewportFrom.Month, 1);

                        while (cursor < viewportTo)
                        {
                            AddColumn(
                                cursor,
                                cursor.AddMonths(1),
                                cursor.ToString("MMM yyyy"));

                            cursor = cursor.AddMonths(1);
                        }

                        break;
                    }

                case GanttViewMode.Year:
                    {
                        var cursor = new DateTime(viewportFrom.Year, 1, 1);

                        while (cursor < viewportTo)
                        {
                            AddColumn(
                                cursor,
                                cursor.AddYears(1),
                                cursor.Year.ToString());

                            cursor = cursor.AddYears(1);
                        }

                        break;
                    }
            }

            return columns;
        }

        /// <summary>
        /// Determina el tipo de columna a mostrar según el modo de vista.
        /// </summary>
        private static GanttViewMode GetColumnTypeForViewMode(GanttViewMode viewMode)
        {
            return viewMode switch
            {
                GanttViewMode.Hour => GanttViewMode.Hour,   // Hora → columnas por hora
                GanttViewMode.Day => GanttViewMode.Hour,    // Día → columnas por hora
                GanttViewMode.Week => GanttViewMode.Day,    // Semana → columnas por día
                GanttViewMode.Month => GanttViewMode.Day,   // Mes → columnas por día
                GanttViewMode.Year => GanttViewMode.Month,  // Año → columnas por mes
                _ => GanttViewMode.Day
            };
        }

    }

}
