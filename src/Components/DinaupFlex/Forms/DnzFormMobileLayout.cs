using System.Drawing;
using Dinaup;

namespace DinaZen.Components.DinaupFlex.Forms;

/// <summary>
/// Reagrupa una pestana para poder pintarla en vertical (una fila por campo).
///
/// El porque de que esto exista: en el DTO, Containers y Controls son dos listas
/// HERMANAS y planas. Un contenedor no tiene hijos: es una card con X/Y/ancho/alto y
/// los campos se pintan encima con sus propias coordenadas. La agrupacion que ve el
/// usuario solo existe en pixeles, asi que para pasarla a vertical hay que deducirla
/// de la geometria. No hay otra fuente.
///
/// Es una funcion pura: mismo Tab -> mismos grupos, en el mismo orden. Importa, porque
/// el servidor devuelve el formulario entero (con coordenadas nuevas) en cada cambio y
/// esto se recalcula en cada sincronizacion; si no fuese determinista, los campos
/// bailarian mientras el usuario escribe.
/// </summary>
public static class DnzFormMobileLayout
{
	/// <summary>
	/// Margen para considerar que dos elementos estan "en la misma fila". Los disenadores
	/// alinean a ojo y dos campos de la misma fila pueden diferir 2-3 px; sin margen se
	/// colarian desordenados.
	/// </summary>
	private const int ToleranciaFila = 12;

	/// <summary>
	/// Un bloque vertical: un contenedor con sus campos, o una tanda de campos sueltos.
	/// </summary>
	public sealed class Grupo
	{
		/// <summary>
		/// Contenedor que lo origina. Null = campos que no caen dentro de ninguno.
		///
		/// Su etiqueta NO se pinta: en la practica son nombres internos del disenador del
		/// formulario (_DESCRIPCION, CONTENEDOR6, _1747287522_3), no titulos que un humano
		/// quiera leer. El contenedor se nota igual, porque sus campos van juntos en su
		/// propia caja.
		/// </summary>
		public VirtualFormDTO.Container Contenedor { get; set; }

		public List<VirtualFormDTO.Control> Controles { get; } = new();
		public List<VirtualFormDTO.ControlButton> Botones { get; } = new();

		/// <summary>
		/// El contenedor es un informe o la lista principal del registro. Estos NO se
		/// desmontan en campos: se pintan enteros, tal cual, a ancho completo.
		/// </summary>
		public bool EsLista => Contenedor != null && (Contenedor.IsPrimaryList || string.IsNullOrEmpty(Contenedor.TokenList) == false);
	}

	/// <summary>
	/// Devuelve los grupos de la pestana en orden de lectura. Vacio si no hay nada que pintar.
	/// </summary>
	public static List<Grupo> Agrupar(VirtualFormDTO.Tab tab)
	{
		var grupos = new List<Grupo>();
		if (tab == null) return grupos;

		var contenedores = (tab.Containers?.Values ?? Enumerable.Empty<VirtualFormDTO.Container>()).ToList();
		var controles = (tab.Controls ?? new List<VirtualFormDTO.Control>()).Where(c => c.IsVisible).ToList();
		var botones = (tab.Buttons?.Values ?? Enumerable.Empty<VirtualFormDTO.ControlButton>()).ToList();

		// Un grupo por contenedor, creado de antemano para poder ir metiendole campos.
		var porToken = new Dictionary<string, Grupo>();
		foreach (var contenedor in contenedores)
			porToken[contenedor.Token] = new Grupo { Contenedor = contenedor };

		// Anclas = lo que decide el orden de lectura final. Ancla un contenedor (por su
		// esquina) y ancla un campo suelto (por la suya). Un campo que cae DENTRO de un
		// contenedor no ancla: su sitio ya lo marca el contenedor que lo agrupa.
		var anclas = new List<Ancla>();

		foreach (var contenedor in contenedores)
			anclas.Add(new Ancla { X = contenedor.X, Y = contenedor.Y, Grupo = porToken[contenedor.Token] });

		foreach (var control in controles)
		{
			var dueno = DuenoDe(contenedores, control.Rec);
			if (dueno == null)
				anclas.Add(new Ancla { X = control.X, Y = control.Y, Control = control });
			else
				porToken[dueno.Token].Controles.Add(control);
		}

		foreach (var boton in botones)
		{
			var dueno = DuenoDe(contenedores, new Rectangle(boton.X, boton.Y, boton.Width, boton.Height));
			if (dueno == null)
				anclas.Add(new Ancla { X = boton.X, Y = boton.Y, Boton = boton });
			else
				porToken[dueno.Token].Botones.Add(boton);
		}

		// Recorrido en orden de lectura. Los sueltos consecutivos se acumulan en un grupo
		// sin titulo, que se cierra en cuanto aparece un contenedor: asi se respeta el
		// "campos de arriba -> caja A -> mas campos -> caja B" del formulario original.
		Grupo sueltosEnCurso = null;
		foreach (var ancla in OrdenLectura(anclas, a => a.X, a => a.Y))
		{
			if (ancla.Grupo != null)
			{
				grupos.Add(ancla.Grupo);
				sueltosEnCurso = null;
				continue;
			}

			if (sueltosEnCurso == null)
			{
				sueltosEnCurso = new Grupo();
				grupos.Add(sueltosEnCurso);
			}

			if (ancla.Control != null)
				sueltosEnCurso.Controles.Add(ancla.Control);
			else
				sueltosEnCurso.Botones.Add(ancla.Boton);
		}

		// Dentro de cada contenedor manda tambien el orden de lectura. Los sueltos ya
		// entraron ordenados por el recorrido de arriba.
		foreach (var grupo in grupos.Where(g => g.Contenedor != null))
		{
			var ordenados = OrdenLectura(grupo.Controles, c => c.X, c => c.Y);
			grupo.Controles.Clear();
			grupo.Controles.AddRange(ordenados);
		}

		// Una caja decorativa vacia (sin campos, sin botones y sin lista) no pinta nada
		// en vertical: solo aportaria un titulo huerfano.
		return grupos.Where(g => g.EsLista || g.Controles.Count > 0 || g.Botones.Count > 0).ToList();
	}

	/// <summary>
	/// Contenedor al que pertenece visualmente un rectangulo, o null si esta suelto.
	/// </summary>
	private static VirtualFormDTO.Container DuenoDe(List<VirtualFormDTO.Container> contenedores, Rectangle rec)
	{
		// Se mira el CENTRO, no el rectangulo entero: un campo puede desbordar un par de
		// pixeles su caja, y con una interseccion se lo llevaria tambien el contenedor de
		// al lado.
		var centro = new Point(rec.X + rec.Width / 2, rec.Y + rec.Height / 2);

		VirtualFormDTO.Container mejor = null;
		foreach (var contenedor in contenedores)
		{
			if (contenedor.Rec.Contains(centro) == false) continue;

			// Cajas anidadas: gana la mas pequena, que es la que de verdad agrupa.
			if (mejor == null || Area(contenedor) < Area(mejor)) mejor = contenedor;
		}
		return mejor;
	}

	private static long Area(VirtualFormDTO.Container contenedor) => (long)contenedor.Width * contenedor.Height;

	/// <summary>
	/// Orden de lectura: arriba a abajo, y dentro de cada fila de izquierda a derecha.
	/// </summary>
	private static List<T> OrdenLectura<T>(IEnumerable<T> elementos, Func<T, int> x, Func<T, int> y)
	{
		var porAltura = elementos.OrderBy(y).ThenBy(x).ToList();
		var salida = new List<T>(porAltura.Count);

		var fila = new List<T>();
		var alturaFila = 0;

		foreach (var elemento in porAltura)
		{
			if (fila.Count == 0)
			{
				alturaFila = y(elemento);
			}
			else if (y(elemento) - alturaFila > ToleranciaFila)
			{
				salida.AddRange(fila.OrderBy(x));
				fila.Clear();
				alturaFila = y(elemento);
			}
			fila.Add(elemento);
		}
		salida.AddRange(fila.OrderBy(x));

		return salida;
	}

	private sealed class Ancla
	{
		public int X { get; set; }
		public int Y { get; set; }

		/// <summary>Informado si el ancla es un contenedor.</summary>
		public Grupo Grupo { get; set; }

		/// <summary>Informado si el ancla es un campo suelto.</summary>
		public VirtualFormDTO.Control Control { get; set; }

		/// <summary>Informado si el ancla es un boton suelto.</summary>
		public VirtualFormDTO.ControlButton Boton { get; set; }
	}
}
