using DinaZen.Forms;

namespace DinaZen.Shared
{
	public class OpenFormsManager
	{

		public List<DynamicFormU> LiveForms = new();
		private readonly Timer _timer;
		private int _isRunning = 0; // 0 = no ejecutando, 1 = ejecutando

		public OpenFormsManager()
		{
			_timer = new Timer(TimerCallback, null, TimeSpan.Zero, TimeSpan.FromSeconds(30));
		}


		private void TimerCallback(object state)
		{

			if (Interlocked.Exchange(ref _isRunning, 1) == 1)
				return; // Ya está ejecutándose

			try
			{
				lock (LiveForms)
				{

					foreach (var item in LiveForms)
					{
						try
						{
							if (item.Ping().Result)
							{
							}
						}
						catch (Exception)
						{ }
					}

				}

			}
			finally
			{
				Interlocked.Exchange(ref _isRunning, 0);
			}

		}

		public void Add(DynamicFormU form)
		{
			lock (LiveForms)
				LiveForms.Add(form);
		}

		public void Remove(DynamicFormU form)
		{
			lock (LiveForms)
				LiveForms.Remove(form);
		}
	}
}