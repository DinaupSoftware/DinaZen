//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using System.Threading.Tasks;

//namespace DinaZen.Components
//{
//	public partial class DinazenDropDownDinaupRow
//	{

//		private string getIconURL(dynamic context)
//		{
//			if (IconoProperty.IsNotEmpty() && IconoPropertyProp.IsNotNull())
//			{
//				var cp = IconoPropertyProp.GetValue(context, null);

//				if (cp is Guid guidValue && guidValue != Guid.Empty)
//				{
//					return guidValue.ToString();
//				}
//			}

//			return "";
//		}




//		private Dinaup.EnumEstilosTextoEE getColor(dynamic context)
//		{

//			try
//			{

//				if (ColorProperty.IsNotEmpty() && ColorPropertyProp.IsNotNull())
//				{
//					var cp = ColorPropertyProp.GetValue(context, null) as string;
//					if (cp.IsNotNull())
//					{
//						if (Enum.TryParse(typeof(Dinaup.EnumEstilosTextoEE), cp, out var parsedColor))
//							return (Dinaup.EnumEstilosTextoEE)parsedColor;
//					}

//				}

//			}
//			catch (Exception)
//			{
//			}

//			return Dinaup.EnumEstilosTextoEE.Indefinido;
//		}




//	}
//}
