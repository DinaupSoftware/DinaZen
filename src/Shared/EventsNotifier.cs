
using Dinaup;
using System.Collections.Concurrent;

namespace DinaZen.Shared;


public partial class EventsNotifier
{
	public static event EventHandler<FormDetailChangedEventArgs> OnFormChanged;

    public static void NotifyFormChanged(Dinaup.VirtualFormDTO.FormDetail oldValue, Dinaup.VirtualFormDTO.FormDetail newValue)
    {


    }





    public class FormDetailChangedEventArgs : EventArgs
    {
        public Dinaup.VirtualFormDTO.FormDetail OldValue { get; set; }
        public Dinaup.VirtualFormDTO.FormDetail NewValue { get; set; }

        public FormDetailChangedEventArgs(Dinaup.VirtualFormDTO.FormDetail oldValue, Dinaup.VirtualFormDTO.FormDetail newValue)
        {
            this.OldValue = oldValue;
            this.NewValue = newValue;
        }
    }
}