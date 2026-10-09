// Hook PostToolUse de Edit, Write y MultiEdit: pasa sobre las líneas que acaba de escribir la IA los
// detectores de doc-in (codigo/review-pre-commit) y le avisa en ese momento, antes de que llegue al PR.
// Copia de doc-in (revision/claude/hooks). No se edita aquí: se cambia en doc-in y se copia con revision/sincronizar.mjs.
//   🔴 va contra una regla escrita: se corrige antes de seguir.
//   🟡 criterio: se corrige, o se explica en la entrega por qué se queda.
// Solo mira lo que se acaba de escribir, no la deuda que ya había en el fichero.
// Un fallo del propio hook nunca para a la IA: sale sin decir nada.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

let datos = {};
try {
    datos = JSON.parse(fs.readFileSync(0, "utf8"));
} catch {
    process.exit(0);
}

const herramienta = datos.tool_name || "";
const entrada = datos.tool_input || {};
const fichero = entrada.file_path || ((entrada.edits || [])[0] || {}).file_path || "";
const extension = path.extname(fichero).toLowerCase();
const rutaNormal = fichero.split("\\").join("/");
if ([".cs", ".vb", ".razor", ".css", ".csproj", ".vbproj"].includes(extension) === false) process.exit(0);
if (/\/(bin|obj|node_modules|\.claude)\//.test(rutaNormal) || /\/wwwroot\/lib\//.test(rutaNormal)) process.exit(0);
if (fs.existsSync(fichero) === false) process.exit(0);

const carpeta = path.dirname(fichero);
function git(args, cwd) {
    return execFileSync("git", args, { cwd: cwd || carpeta, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 10000 });
}
let raizRepo = process.env.CLAUDE_PROJECT_DIR || datos.cwd || carpeta;
try {
    raizRepo = git(["rev-parse", "--show-toplevel"]).trim();
} catch { }

// Tipo base para comparar firmas: sin Task<>, sin ?, y con el mismo nombre en C# y en VB.
function tipoBase(tipo) {
    let t = (tipo || "").replace(/\s+/g, "").replace(/^(ByVal|ByRef|this)/i, "");
    const tarea = t.match(/^(?:Task|ValueTask)(?:<(.+)>|\(Of(.+)\))$/i);
    if (tarea) t = tarea[1] || tarea[2];
    t = t.replace(/\?$/, "").replace(/^Nullable(?:<(.+)>|\(Of(.+)\))$/i, "$1$2");
    const alias = { date: "datetime", datetime: "datetime", dateonly: "dateonly", string: "string", integer: "int", int: "int", int32: "int", long: "long", int64: "long", decimal: "decimal", double: "double", boolean: "bool", bool: "bool", guid: "guid", timeonly: "timeonly", timespan: "timespan", object: "object" };
    return alias[t.toLowerCase()] || t.toLowerCase();
}

// Palabras de un nombre (ParseFechaUTC → parse, fecha, utc), con su equivalente en inglés, para cruzarlas con el SDK.
function palabras(nombre) {
    const equivalentes = { fecha: "date", fechas: "date", hora: "hour", horas: "hour", minuto: "minute", minutos: "minute", dia: "day", dias: "day", semana: "week", mes: "month", año: "year", anio: "year", cadena: "string", numero: "int", entero: "int", importe: "decimal", vacio: "empty", correo: "email" };
    const vacias = new Set(["get", "set", "async", "del", "las", "los", "para", "con", "por", "desde", "from", "value", "valor", "new", "nuevo", "item", "data", "datos", "texto", "text", "string"]);
    const lista = nombre.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2").replace(/_/g, " ").toLowerCase().split(/\s+/).filter(p => p.length > 2 && vacias.has(p) === false);
    return new Set(lista.map(p => equivalentes[p] || p));
}

const texto = fs.readFileSync(fichero, "utf8");
const lineas = texto.split(/\r?\n/);

// 1. Qué líneas acaba de escribir la IA (índices desde 0).
const escritas = new Set();
let esFicheroNuevo = false;
if (herramienta === "Edit" || herramienta === "MultiEdit") {
    const cambios = herramienta === "Edit" ? [entrada] : (entrada.edits || []);
    for (const cambio of cambios) {
        const nuevo = cambio.new_string || "";
        if (nuevo.trim() === "") continue;
        const antes = new Set((cambio.old_string || "").split(/\r?\n/).map(l => l.trim()));
        const nuevasLineas = nuevo.split(/\r?\n/);
        let buscado = nuevo;
        if (texto.includes(buscado) === false) buscado = nuevo.replace(/\r?\n/g, "\r\n");
        let desde = 0;
        let encontrado = false;
        while (texto.includes(buscado, desde)) {
            const posicion = texto.indexOf(buscado, desde);
            const inicio = texto.slice(0, posicion).split("\n").length - 1;
            nuevasLineas.forEach((linea, k) => {
                if (linea.trim() !== "" && antes.has(linea.trim()) === false) escritas.add(inicio + k);
            });
            encontrado = true;
            desde = posicion + buscado.length;
            if (cambio.replace_all !== true) break;
        }
        if (encontrado === false) {
            const buscadas = new Set(nuevasLineas.map(l => l.trim()).filter(l => l !== "" && antes.has(l) === false));
            lineas.forEach((linea, i) => {
                if (buscadas.has(linea.trim())) escritas.add(i);
            });
        }
    }
}
// La rutina que revisa un PR lo llama con REVISAR_DESDE=<commit base>: cuenta como escrito todo lo que el PR cambia.
const desde = process.env.REVISAR_DESDE || "HEAD";
if (herramienta === "Write") {
    let diff = "";
    try {
        git(["ls-files", "--error-unmatch", "--", fichero]);
        git(["cat-file", "-e", `${desde}:${path.relative(raizRepo, fichero).split("\\").join("/")}`]);
        diff = git(["diff", "--no-color", "-U0", desde, "--", fichero]);
    } catch {
        esFicheroNuevo = true;
    }
    if (esFicheroNuevo) {
        lineas.forEach((linea, i) => {
            if (linea.trim() !== "") escritas.add(i);
        });
    } else {
        let numero = 0;
        for (const linea of diff.split(/\r?\n/)) {
            const trozo = linea.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
            if (trozo) {
                numero = Number(trozo[1]) - 1;
                continue;
            }
            if (linea.startsWith("+++") || linea.startsWith("---")) continue;
            if (linea.startsWith("+")) {
                if (linea.slice(1).trim() !== "") escritas.add(numero);
                numero++;
            }
        }
    }
}
if (escritas.size === 0 && esFicheroNuevo === false) process.exit(0);

// 2. Lo que se sabe del fichero entero.
const esRazor = extension === ".razor";
const esVb = extension === ".vb";
const esCodigo = [".cs", ".vb", ".razor"].includes(extension);
const esTest = /(^|\/)tests?\//i.test(rutaNormal) || /Tests?\.(cs|vb)$/.test(rutaNormal) || /\[(Fact|Theory|Test|TestMethod)\]/.test(texto);
const esService = /\b(class|Class|Module)\s+\w+Service\b/.test(texto);
const nombreFichero = path.basename(fichero);
// El Servidor no tiene contenedor de DI (sus servicios son Shared) y DinaZen es la librería que envuelve a Radzen.
const esServidor = /dinaupservidor/i.test(path.basename(raizRepo));
const esDinaZen = /dinazen/i.test(path.basename(raizRepo));
const esSdk = /^dinaup$/i.test(path.basename(raizRepo)) && /(^|\/)src\//.test(rutaNormal);
// Las líneas de cada bloque `@code { … }` de un .razor, contando llaves: puede haber varios, y de una sola línea.
const enBloqueCode = new Array(lineas.length).fill(false);
for (let i = 0; esRazor && i < lineas.length; i++) {
    if (/^\s*@code\b/.test(lineas[i]) === false) continue;
    let abiertas = 0;
    let empezado = false;
    for (let k = i; k < lineas.length; k++) {
        enBloqueCode[k] = true;
        abiertas += (lineas[k].match(/\{/g) || []).length - (lineas[k].match(/\}/g) || []).length;
        if (lineas[k].includes("{")) empezado = true;
        if (empezado && abiertas <= 0) {
            i = k;
            break;
        }
    }
}
const esCSharpDeRazor = i => esRazor === false || enBloqueCode[i];

// Los pies de diálogo: qué líneas caen dentro de un <FooterContent> y si ese pie confirma algo.
const pieDeLinea = new Array(lineas.length).fill(null);
let pie = null;
lineas.forEach((linea, i) => {
    if (linea.includes("<FooterContent")) pie = { confirma: false };
    if (pie !== null) {
        pieDeLinea[i] = pie;
        if (/ButtonStyle\.Success|Text="Aceptar"/.test(linea)) pie.confirma = true;
    }
    if (linea.includes("</FooterContent>")) pie = null;
});

// Las líneas dentro del `<Start>` o el `<End>` de un `RadzenFormField`, que se pintan dentro de la caja del campo.
const enCajaDeCampo = new Array(lineas.length).fill(false);
let camposAbiertos = 0;
let ranuraAbierta = false;
for (let i = 0; esRazor && i < lineas.length; i++) {
    camposAbiertos += (lineas[i].match(/<RadzenFormField\b/g) || []).length;
    if (camposAbiertos > 0 && /<(?:Start|End)>/.test(lineas[i])) ranuraAbierta = true;
    enCajaDeCampo[i] = ranuraAbierta;
    if (/<\/(?:Start|End)>/.test(lineas[i])) ranuraAbierta = false;
    camposAbiertos = Math.max(0, camposAbiertos - (lineas[i].match(/<\/RadzenFormField>/g) || []).length);
}

// Las cadenas de varias líneas (el SQL del Servidor, @"…" y """…""" de C#): lo que va dentro es texto, no código.
// empiezaEnCadena[i]: la línea i empieza dentro de una; acabaEnCadena[i]: la deja abierta al acabar.
const empiezaEnCadena = [];
const acabaEnCadena = [];
let enCadena = false;
let enCruda = false;
for (const l of lineas) {
    empiezaEnCadena.push(enCadena || enCruda);
    for (let c = 0; c < l.length; c++) {
        if (enCruda) {
            if (l.startsWith('"""', c)) {
                enCruda = false;
                c += 2;
            }
            continue;
        }
        if (enCadena) {
            if (l[c] === '"' && l[c + 1] === '"') c++;
            else if (l[c] === '"') enCadena = false;
            continue;
        }
        if (esVb && l[c] === "'") break;
        if (esVb && l[c] === '"') enCadena = true;
        if (esVb) continue;
        if (l.startsWith("//", c)) break;
        if (l.startsWith("'\\''", c) || l.startsWith("'\\\"'", c)) c += 3;
        else if (l.startsWith("'\"'", c)) c += 2;
        else if (l.startsWith('"""', c)) {
            enCruda = true;
            c += 2;
        } else if (l[c] === '"' && (l[c - 1] === "@" || (l[c - 1] === "$" && l[c - 2] === "@"))) enCadena = true;
        else if (l[c] === '"') {
            // Cadena normal de C#: acaba en la misma línea.
            c++;
            while (c < l.length && l[c] !== '"') c += l[c] === "\\" ? 2 : 1;
        }
    }
    acabaEnCadena.push(enCadena || enCruda);
}
// ¿La posición `hasta` de la línea cae fuera de las comillas? Cuenta las comillas de antes, sin las escapadas.
function fueraDeCadena(linea, hasta) {
    const antes = linea.slice(0, hasta).replace(/'\\?"'/g, "").replace(esVb ? /""/g : /\\"|""/g, "");
    return (antes.match(/"/g) || []).length % 2 === 0;
}

// Una lectura del primario (`QueryRW`) dice al lado por qué no va a la réplica: en la línea, encima en la misma función o en
// su cabecera. No cuentan las que van en una transacción ni las que lanzan una escritura (UPDATE, INSERT … RETURNING).
const motivoDelPrimario = /primario|r[eé]plica|reci[eé]n (?:guardad|escrit|cread|insertad|subid)|acaban? de (?:guardar|escribir|crear|insertar|subir)|marca de agua|decide (?:una|la|qu[eé]|si se) escri|transacci[oó]n|arranque|estado real|\bRW\b/i;
function rwSinMotivo(i) {
    const linea = lineas[i];
    if (/\bFunction\s|\bQuery\w*RO\s*\(|RW\s*\(\s*(?:TR|Tr|tr|[Tt]ransacci)\w*\s*,|RW\s*\(\s*(?:Ell)?SQL\s*,\s*(?:timeoutsegundos\s*,\s*)?motivo\s*\)/.test(linea)) return false;
    if (/'/.test(linea.replace(/"[^"]*"/g, ""))) return false;
    const variable = (linea.match(/RW\s*\(\s*(?:Nothing\s*,\s*)?([A-Za-z_]\w*)\s*[,)]/) || [])[1];
    let desde = i;
    while (variable !== undefined && desde > 0 && desde > i - 80 && new RegExp(`\\b${variable}\\s*=`).test(lineas[desde]) === false) desde--;
    if (/\b(?:update\s+\S+\s+set|insert\s+into|delete\s+from|on\s+conflict|returning)\b/i.test(lineas.slice(desde, i + 4).join("\n"))) return false;
    for (let k = i - 1; k >= 0 && k >= i - 80; k--) {
        if (/^\s*'/.test(lineas[k]) && motivoDelPrimario.test(lineas[k])) return false;
        if (/^\s*(?:(?:Public|Private|Friend|Protected|Shared|Async|Overrides|Overridable|Iterator)\s+)*(?:Function|Sub)\s/.test(lineas[k]) === false) continue;
        for (let j = k - 1; j >= 0 && /^\s*'/.test(lineas[j]); j--) if (motivoDelPrimario.test(lineas[j])) return false;
        return true;
    }
    return true;
}

const anchosDeLaTabla = ["min(95%,1806px)", "min(96%,1200px)", "min(96%,1100px)", "min(95%,900px)", "min(95%,700px)", "min(95%,480px)"];
const ciclosDeVida = new Set(["OnInitialized", "OnInitializedAsync", "OnParametersSet", "OnParametersSetAsync", "OnAfterRender", "OnAfterRenderAsync", "SetParametersAsync", "ShouldRender", "BuildRenderTree", "Dispose", "DisposeAsync", "ToString", "Equals", "GetHashCode", "Main", "Configure", "ConfigureServices", "OpenAsync", "Opciones"]);
const palabrasReservadas = new Set(["return", "await", "new", "throw", "else", "case", "yield", "using", "var", "if", "while", "for", "foreach", "switch", "catch", "lock", "goto", "in", "is", "as", "typeof", "nameof", "default", "base", "this", "out", "ref", "params", "await", "when", "select", "from", "where", "let", "not", "and", "or"]);

// 3. Los detectores. `donde`: extensiones; `si`: condición extra sobre la línea i.
const detectores = [
    { nivel: "🔴", donde: [".cs", ".vb", ".razor"], re: /\.TryGetValue\(|\.ContainsKey\(/, dice: "`TryGetValue` o `ContainsKey`: usa `dic.GetM(\"clave\")` o `dic.GetM(\"clave\", porDefecto)`.", regla: "codigo/no-hacer" },
    { nivel: "🔴", donde: [".cs", ".vb", ".razor"], re: /Is(?:Not)?Empty\(\)\s*(?:==|=)\s*[Ff]alse|![\w.]+\.Is(?:Not)?Empty\(|\bNot\s+[\w.]+\.Is(?:Not)?Empty\(/, dice: "`IsEmpty` / `IsNotEmpty` negado: usa la inversa.", regla: "codigo/reglas-duras" },
    { nivel: "🔴", donde: [".cs", ".razor"], re: /\b(?:DateTime|DateOnly|TimeOnly|TimeSpan|decimal|double|float|int|long|short|byte|bool|Guid|char|string)\?(?![.?\[])/, dice: "Tipo nulable: usa el sentinel (`DateTime.MinValue`, `0`, `Guid.Empty`, `\"\"`). Si es imprescindible, dilo en un comentario.", regla: "codigo/reglas-duras" },
    { nivel: "🔴", donde: [".vb"], re: /\bAs\s+(?:New\s+)?(?:Date|DateTime|DateOnly|TimeOnly|Decimal|Double|Integer|Long|Short|Byte|Boolean|Guid)\?|Nullable\(Of\b/, dice: "Tipo nulable: usa el sentinel (`Date.MinValue`, `0`, `Guid.Empty`, `\"\"`). Si es imprescindible, dilo en un comentario.", regla: "codigo/reglas-duras" },
    { nivel: "🟡", donde: [".cs", ".vb", ".razor"], re: /\.ToString\(\)/, dice: "`.ToString()`: usa `.STR()`.", regla: "codigo/reglas-duras" },
    { nivel: "🔴", donde: [".cs", ".razor"], re: /^\s*(?:(?:public|private|protected|internal|static|async|override|virtual|sealed|new|partial|readonly|unsafe|extern)\s+)*(?!return\b|await\b|new\b|var\b|case\b|else\b|if\b|throw\b|yield\b|RenderFragment\b)[\w<>\[\],.?]+\s+[A-Za-z_]\w*\s*(?:<[^>(]*>)?\s*\([^;]*\)\s*=>/, dice: "Cuerpo con `=>`: llaves y `return`, una condición por línea.", regla: "codigo/reglas-duras" },
    { nivel: "🔴", donde: [".cs", ".razor"], re: /^\s*(?:(?:public|private|protected|internal|static|override|virtual|sealed|new)\s+)+(?!RenderFragment\b)[\w<>\[\],.?]+\s+[A-Za-z_]\w*\s*=>/, dice: "Propiedad con `=>`: llaves y `return`.", regla: "codigo/reglas-duras" },
    { nivel: "🟡", donde: [".vb"], re: /^\s*(?:Else)?If\b.*\bThen\s*$/, si: i => /^\s*Else(?:If\b|\s*$)/.test(lineas[i + 1] || ""), dice: "`If` vacío con el trabajo en el `ElseIf` o el `Else`: escribe la condición de lo que hace algo y, si es larga, en una variable con nombre justo encima.", regla: "codigo/reglas-duras" },
    { nivel: "🟡", donde: [".cs", ".razor"], re: /^\s*(?:@|\}\s*)?(?:else\s+)?if\s*\(/, si: i => /\{\s*\}\s*else\b/.test(lineas[i]) || (/\{\s*\}\s*$/.test(lineas[i]) && /^\s*else\b/.test(lineas[i + 1] || "")) || (/\)\s*$/.test(lineas[i]) && /^\s*\{\s*$/.test(lineas[i + 1] || "") && /^\s*\}\s*$/.test(lineas[i + 2] || "") && /^\s*else\b/.test(lineas[i + 3] || "")), dice: "`if` vacío con el trabajo en el `else`: escribe la condición de lo que hace algo y, si es larga, en una variable con nombre justo encima.", regla: "codigo/reglas-duras" },
    { nivel: "🔴", donde: [".cs", ".vb"], re: /\b(?:class|Class|Module|interface|Interface)\s+\w+Factory\b/, dice: "Factoría: se crea con `new` o por DI.", regla: "codigo/client-y-service" },
    { nivel: "🔴", donde: [".cs", ".vb", ".razor"], re: /\b(?:static|Shared)\s+(?:readonly\s+|ReadOnly\s+)?(?:\w+\s+)?Instance\b.*(?:=\s*new\b|As\s+New\b)/, si: () => esServidor === false, dice: "Singleton a mano: regístralo en DI e inyéctalo.", regla: "codigo/client-y-service" },
    { nivel: "🟡", donde: [".cs", ".vb"], re: /\.Iniciar\(\s*\w*[Aa]ll[Ss]ervices/, si: () => esServidor === false, dice: "Servicio guardado en un estático con `Iniciar(allServices)`: inyéctalo.", regla: "codigo/client-y-service" },
    { nivel: "🟡", donde: [".cs", ".vb"], re: /new HttpClient\(|New HttpClient\(|new SmtpClient\(|New SmtpClient\(|ConnectionMultiplexer\.Connect|new NpgsqlConnection|New NpgsqlConnection/, si: () => esService, dice: "Conector dentro de un `Service`: va en un `Client` que el `Service` recibe.", regla: "codigo/client-y-service" },
    { nivel: "🟡", donde: [".cs", ".vb"], re: /\S\s*(?:\(|,|, _)\s*$/, enCadena: true, si: i => acabaEnCadena[i] === false && (/\(\s*$/.test(lineas[i]) || (lineas[i].match(/\(/g) || []).length > (lineas[i].match(/\)/g) || []).length), dice: "Firma o llamada partida en varias líneas: va entera en una.", regla: "codigo/no-hacer" },
    { nivel: "🔴", donde: [".razor"], re: /<RadzenCard\b/, si: () => esDinaZen === false, dice: "`RadzenCard`: usa `DnzCard`, que se pinta sola según su profundidad.", regla: "codigo/reglas-criticas-ui" },
    { nivel: "🔴", donde: [".razor"], re: /<RadzenStack\b/, si: () => esDinaZen === false, dice: "`RadzenStack`: usa un `<div class=\"d-flex …\">` de Bootstrap.", regla: "codigo/reglas-criticas-ui" },
    { nivel: "🔴", donde: [".razor"], re: /style="[^"]*\b(?:gap|padding|margin)(?:-(?:top|bottom|left|right))?\s*:\s*(?:0\.25|\.25|0\.5|\.5|1|1\.5|3)rem/, dice: "Espaciado en `style`: usa `gap-N`, `p-N` o `m-N`.", regla: "codigo/reglas-forzadas" },
    { nivel: "🔴", donde: [".razor"], re: /<InputFile\b/, dice: "`InputFile`: usa `DnzFileUploaderButton`.", regla: "codigo/reglas-criticas-ui" },
    { nivel: "🔴", donde: [".razor"], re: /<RadzenLink\b[^>]*doc\.dinaup\.com|<a\b[^>]*doc\.dinaup\.com[^>]*>\s*[^<\s]/, si: () => esDinaZen === false && /\/Pages\/Apps\/Ayuda\//.test(rutaNormal) === false, dice: "Enlace suelto a la doc: usa `AyudaDocU`, el «?» gris de la ayuda.", regla: "codigo/reglas-criticas-ui" },
    { nivel: "🔴", donde: [".razor"], re: /<RadzenTextBox\b[^>]*(?:@bind-Value:event="oninput"|@oninput)/, si: i => esDinaZen === false && /busc|search|filtr/i.test(lineas[i]), dice: "Buscador con `RadzenTextBox` y `@oninput`: usa `DnzSearchInput`, que espera a que se deje de teclear.", regla: "codigo/reglas-criticas-ui" },
    { nivel: "🔴", donde: [".razor"], re: /<RadzenTextBox\b[^>]*@bind-Value="?@?\(?(?:\w+\.)*Icono?(?:Name|Nombre)?\b/i, si: () => esDinaZen === false, dice: "Casilla para escribir el nombre de un icono: se elige en el buscador de iconos de play (`IconSearchU`, o `UpDialogs.SeleccionarIconoAsync`), con un botón que enseña el elegido.", regla: "codigo/reglas-criticas-ui" },
    { nivel: "🔴", donde: [".razor"], re: /<RadzenButton\b[^>]*\bDisabled="?@\((?:[^()]|\([^()]*\))*?(?:IsNullOrWhiteSpace|IsNullOrEmpty|\.IsEmpty\(\)|Count\s*==\s*0|\.Any\(\)\s*==\s*false)/, si: () => esDinaZen === false, dice: "Botón desactivado porque faltan datos: va habilitado y, al pulsarlo, `NotificationService.Notify` dice qué falta. `Disabled` solo para lo que el rol o los permisos no dejan.", regla: "codigo/reglas-criticas-ui" },
    { nivel: "🔴", donde: [".razor"], re: /<(?:RadzenButton|RadzenToggleButton|RadzenSplitButton|button)\b/, si: i => esDinaZen === false && enCajaDeCampo[i], dice: "Botón dentro de la caja de un campo (`<End>` o `<Start>` del `RadzenFormField`): va aparte, a la derecha del campo.", regla: "codigo/reglas-criticas-ui" },
    { nivel: "🔴", donde: [".razor"], re: /<RadzenFormField\b[^>]*\bVariant\s*=\s*"(?:@?Variant\.)?(?:Outlined|Filled|Text)"/, si: () => esDinaZen === false && /controlu/i.test(rutaNormal) === false, dice: "Campo con caja: `RadzenFormField Variant=\"Variant.Flat\"`, que `site.css` pinta sin caja.", regla: "codigo/reglas-criticas-ui" },
    { nivel: "🔴", donde: [".razor"], re: /\bProperty="[A-Z]\w*"/, dice: "Nombre de propiedad escrito a mano: `Property=\"@nameof(Tipo.Campo)\"`.", regla: "codigo/reglas-duras" },
    { nivel: "🟡", donde: [".razor"], re: /style="[^"]*#[0-9a-fA-F]{3,8}\b/, si: i => /style="[^"]*#[0-9a-fA-F]{3,8}\b/.test(lineas[i].replace(/var\([^()]*\)/g, "")), dice: "Color escrito a mano: usa las variables de Radzen.", regla: "codigo/no-hacer" },
    { nivel: "🟡", donde: [".css"], re: /^\s*(?!--)[\w-]+\s*:[^;]*#[0-9a-fA-F]{3,8}\b/, si: i => /#[0-9a-fA-F]{3,8}\b/.test(lineas[i].replace(/var\([^()]*\)/g, "")), dice: "Color escrito a mano: usa las variables de Radzen.", regla: "codigo/no-hacer" },
    { nivel: "🔴", donde: [".razor"], re: /\bBusyText=/, si: i => pieDeLinea[i] !== null, dice: "`BusyText` en el pie: basta `IsBusy`, el rótulo no cambia al guardar.", regla: "codigo/dialogos-play" },
    { nivel: "🔴", donde: [".razor"], re: /\bText="Guardar"/, si: i => pieDeLinea[i] !== null, dice: "El botón que confirma dice «Aceptar».", regla: "codigo/tono-de-voz" },
    { nivel: "🔴", donde: [".razor"], re: /\bText="Cerrar"/, si: i => pieDeLinea[i] !== null && pieDeLinea[i].confirma, dice: "Con «Aceptar» en el pie, el que sale sin guardar dice «Cancelar».", regla: "codigo/tono-de-voz" },
    { nivel: "🔴", donde: [".razor"], re: /^\s*@if\s*\(\s*\w+\s*==\s*null\s*\)\s*return;/, dice: "Ventana en blanco mientras carga: `IsLoading` en `DnzDialogLayout`.", regla: "codigo/dialogos-play" },
    { nivel: "🟡", donde: [".razor", ".cs"], re: /^\s*Width\s*=\s*"[^"]*"\s*,?\s*(?:\/\/.*)?$/, si: i => esCSharpDeRazor(i) && texto.includes("DialogOptions") && anchosDeLaTabla.includes(lineas[i].match(/"([^"]*)"/)[1].replace(/\s+/g, "")) === false && /\/\/|'/.test(lineas[i]) === false && /^\s*\/\//.test(lineas[i - 1] || "") === false, dice: "Ancho de diálogo fuera de la tabla: uno de los seis, o un comentario con el motivo.", regla: "codigo/dialogos-play" },
    { nivel: "🟡", donde: [".razor", ".cs"], re: /^\s*Height\s*=\s*"\d+px"\s*,?\s*(?:\/\/.*)?$/, si: i => esCSharpDeRazor(i) && /\/\//.test(lineas[i]) === false && /^\s*\/\//.test(lineas[i - 1] || "") === false, dice: "Alto fijo en px: `AltoAuto=true` y `Height = null`, o un comentario con el motivo.", regla: "codigo/dialogos-play" },
    { nivel: "🟡", donde: [".razor"], re: /<RadzenTemplateForm[^>]*\bSubmit=|Key\s*==\s*"Enter"/, dice: "Esta entrada no tiene el cerrojo del botón: el método que guarda empieza con `if (guardando) return;`.", regla: "codigo/una-sola-vez" },
    { nivel: "🟡", donde: [".razor"], re: /@onkeydown=.*@onkeypress=|@onkeypress=.*@onkeydown=/, dice: "`@onkeydown` y `@onkeypress` en el mismo elemento: Enter dispara los dos. Un evento por acción.", regla: "codigo/una-sola-vez" },
    { nivel: "🔴", donde: [".cs", ".vb", ".razor"], re: /^\s*(?:await\s+|Await\s+)[\w.]+\.RunWriteOperationAsync\(/, si: () => esTest === false, dice: "Respuesta de `RunWriteOperationAsync` descartada: guárdala y enseña `resp.UserError` si falla.", regla: "codigo/escribir-datos" },
    { nivel: "🔴", donde: [".cs", ".vb", ".razor"], re: /Data(?:Main|List)Row.*\.Add\("(?:fecha|fecham|fechaia|fechasyn|modificado|plantillapid|usuarioid|ubicacionid|ubicacion)"/, dice: "Campo que pone el servidor: se borra del envío sin avisar. Usa el campo de negocio de la sección.", regla: "codigo/escribir-datos" },
    { nivel: "🟡", donde: [".cs", ".vb", ".razor"], re: /Guid\.NewGuid\b/, si: i => esTest === false && /Token\s*=\s*Guid\.NewGuid/.test(lineas[i]) === false && /WriteOperation|DataMainRow|DataListRow|\.Add\("id"/i.test(lineas[i]), dice: "Id de una fila nueva inventado en el cliente: el alta va con `Guid.Empty` y el id lo da el servidor.", regla: "codigo/escribir-datos" },
    { nivel: "🟡", donde: [".cs", ".vb", ".razor"], re: /SectionsD\.\w+D\.GetRows/, dice: "Listar por la API de secciones recorta a 500 filas sin avisar: un informe con `LoadAllRowsAsync`.", regla: "codigo/dinaupclient" },
    { nivel: "🟡", donde: [".cs", ".vb", ".razor"], re: /\bOp\s*=\s*"IN"|\bids\w*\.Chunk\(/i, si: () => esSdk === false, dice: "Leer fichas por bloques de ids para cruzarlas después: trae esos datos por ruta de relación en la consulta principal.", regla: "codigo/una-consulta-por-pantalla" },
    { nivel: "🟡", donde: [".vb"], re: /\bQuery(?:SuperUser)?(?:Value|List|HashSet|Dic|Json|WithColumns)?RW\s*\(/, si: i => esServidor && esTest === false && rwSinMotivo(i), dice: "`QueryRW` sin decir por qué va al primario: si la lectura aguanta unos segundos de retraso, `QueryRO` (la réplica). Si no, escribe al lado el motivo: decide una escritura, avanza una marca de agua o lee lo que el usuario acaba de guardar.", regla: "codigo/sql-postgres" },
    { nivel: "🔴", donde: [".cs", ".vb", ".razor"], re: /(?:\*|\+=)\s*\w*(?:campos|cols|fields)\.Length/, dice: "Modelo armado a mano desde el array de `ReadCopy`: `QueryListAsync` o `ReadObjectListAsync`.", regla: "codigo/leer-db0" },
    { nivel: "🔴", donde: [".cs"], re: /static\s+\w+\s+Desde\s*\(\s*Dictionary<string,\s*string>/, dice: "Mapeador de fila propio: `FromDic` de `BaseModelConverter`.", regla: "codigo/leer-db0" },
    { nivel: "🔴", donde: [".cs", ".vb", ".razor"], re: /Referencia\w*.*Value\s*=\s*"0"|Value\s*=\s*"0".*Referencia/, enCadena: true, dice: "Referencia vacía: `Guid.Empty.STR()`, no `\"0\"`.", regla: "codigo/reglas-duras" },
    { nivel: "🟡", donde: [".cs", ".razor"], re: /Is(?:Not)?Null\(\)\s*\?\s*""\s*:/, dice: "Guarda nula que sobra: `x?.Campo`, o `x?.Campo ?? \"\"` si el destino es un `string` propio.", regla: "codigo/reglas-duras" },
    { nivel: "🔴", donde: [".cs", ".vb", ".razor"], re: /Request\.Host.*(?:localhost|127\.0\.0\.1|::1)|(?:localhost|127\.0\.0\.1).*Request\.Host/, enCadena: true, dice: "Permiso decidido con la cabecera `Host`, que la manda el cliente.", regla: "tests/contra-una-licencia" },
    { nivel: "🟡", donde: [".cs", ".vb"], re: /Debugger\.IsAttached/, dice: "`Debugger.IsAttached`: con el depurador el código hace otra cosa que en producción. Un permiso nunca depende de él.", regla: "tests/contra-una-licencia" },
    { nivel: "🟡", donde: [".cs", ".vb"], re: /if\s*\(.*(?:IsNullOrEmpty|IsEmpty\(\)|==\s*null).*\)\s*return\s*;|If\s.*(?:IsNullOrEmpty|IsEmpty\(\)|Is Nothing).*Then\s+Return\s*$/, si: () => esTest, dice: "Test que sale en verde sin credenciales: que falle, o `Skip.If(…, motivo)`.", regla: "tests/contra-una-licencia" },
    { nivel: "🟡", donde: [".cs", ".vb", ".csproj", ".vbproj"], re: /\bMock<|Substitute\.For<|Include="(?:Moq|NSubstitute|FakeItEasy|WireMock\.Net|RichardSzalay\.MockHttp)"/, dice: "Doble de algo que da una licencia de prueba: prueba contra la licencia.", regla: "tests/contra-una-licencia" },
    { nivel: "🟡", donde: [".vb"], re: /\bFunction\s+FJson_\w+\s*\(/, si: () => esServidor, dice: "Función nueva de la API del Servidor: ¿la necesita el propio Servidor (ticks, kiosco, registro legal, permisos) o solo la va a llamar Play? Si solo Play, va en Dinaup.Play.", regla: "codigo/donde-va-cada-funcion" },
    { nivel: "🟡", donde: [".vb", ".cs"], re: /^\s*(?:Public|public)\s+(?:(?:Shared|Async|Overridable|Overloads|static|async|virtual)\s+)*(?:Function|Sub|[\w<>\[\],.?]+\s+[A-Z]\w*\s*\()/, si: () => esSdk && esTest === false, dice: "Función pública nueva en el SDK: ¿quién la llama hoy, aparte de Play? Si solo Play, va en Dinaup.Play (el cliente de una función del Servidor, en `PlaySesion`), aunque el trabajo lo haga el Servidor. «La podría usar cualquier integración» no la mete en el SDK.", regla: "codigo/donde-va-cada-funcion" },
    { nivel: "🟡", donde: [".razor"], re: /\bCalcular\w*\([^;]*\bawait\b[^;]*\.Recibir\w*\(/, dice: "La pantalla encadena el cargador y el cálculo: una sola llamada al servicio con el dato de negocio (`Recibir_LogoEmpresa(concepto)`), que carga y calcula por dentro.", regla: "codigo/donde-va-cada-funcion" },
    { nivel: "🟡", donde: [".cs", ".vb", ".razor"], re: /\b(?:Function|Sub)\s+Migra\w*\s*\(|\b(?:Task(?:<[^>]*>)?|void)\s+Migra\w*\s*\(/, si: () => esTest === false, dice: "¿Una migración? No se migran datos: cuando un dato pasa a otro sitio, lo nuevo empieza vacío.", regla: "codigo/codigo-lineal" },
    { nivel: "🟡", donde: [".vb", ".cs"], re: /\bReportarEstado\(|\bEstadoDeInicioDelSistema\s*=/, si: i => /"crash::/.test(lineas[i]) === false && (lineas[i].match(/"(?:[^"]|"")*"/g) || []).join(" ").split(/\s+/).filter(p => /[\p{L}\d]/u.test(p)).length > 12, dice: "Estado de más de 12 palabras: di qué está pasando en pocas palabras, sin cómo funciona por dentro ni por qué tarda («Reindexando tabla recambios»).", regla: "codigo/tono-de-voz" },
    { nivel: "🟡", donde: [".cs", ".vb", ".razor"], re: /(?:solo|sólo) para (?:los )?tests?|para poder probarl[oa]|inyectable para tests?/i, si: () => esTest === false, comentario: true, enCadena: true, dice: "Código de producción deformado para un test.", regla: "tests/contra-una-licencia" }
];

// 4. Pasar los detectores por las líneas escritas.
const avisos = [];
const ordenadas = [...escritas].sort((a, b) => a - b);
for (const i of ordenadas) {
    const linea = lineas[i] || "";
    const recortada = linea.trim();
    const esComentario = recortada.startsWith("//") || recortada.startsWith("@*") || recortada.startsWith("*") || recortada.startsWith("<!--") || (esVb && recortada.startsWith("'"));
    if (empiezaEnCadena[i]) continue;
    for (const d of detectores) {
        if (d.donde.includes(extension) === false) continue;
        if (esComentario && d.comentario !== true) continue;
        const encontrado = d.re.exec(linea);
        if (encontrado === null) continue;
        // En un .razor no: en la maqueta, lo que va entre comillas tras una @ también es C#.
        if (d.enCadena !== true && esRazor === false && fueraDeCadena(linea, encontrado.index) === false) continue;
        if (d.si !== undefined && d.si(i) === false) continue;
        avisos.push({ nivel: d.nivel, linea: i + 1, dice: d.dice, regla: d.regla });
    }
}

// Cada función de la API del Servidor dice quién la usa: Public_ (cualquier integración) o Play_ (solo Play).
if (esServidor && nombreFichero === "Enumeraciones.cs") {
    const inicioEnum = lineas.findIndex(l => /\benum\s+APIFunctionE\b/.test(l));
    const finEnum = inicioEnum < 0 ? -1 : lineas.findIndex((l, k) => k > inicioEnum && /^\s*}/.test(l));
    for (const i of ordenadas) {
        if (i <= inicioEnum || i >= finEnum) continue;
        const miembro = lineas[i].match(/^\s*([A-Za-z_]\w*)\s*(?:=|,|$)/);
        if (miembro === null || miembro[1] === "Indefinido" || /^(?:Public|Play)_/.test(miembro[1])) continue;
        avisos.push({ nivel: "🔴", linea: i + 1, dice: `\`${miembro[1]}\` no dice quién la usa: \`Public_\` si la puede llamar cualquier integración, \`Play_\` si solo la llama Play. Antes, lee si debe estar en el Servidor.`, regla: "codigo/donde-va-cada-funcion" });
    }
}

// El catálogo de DinaScript es lo que lee quien escribe un script (la ventana «Funciones» de play, Yudo): va entero en
// inglés, y cada parámetro con su nombre y su descripción. El castellano solo entra entre «», al citar lo que devuelve.
if (esServidor && esVb && /FuncionDinamicaC|\.AddParametro\(/.test(texto)) {
    const enCastellano = frase => /[áéíóúñÁÉÍÓÚÑ¿¡]|\b(?:que|del|los|las|para|con|una|valor|fecha|texto|campo)\b/i.test(frase.replace(/«[^»]*»/g, ""));
    for (const i of ordenadas) {
        const linea = lineas[i];
        if (/^\s*'/.test(linea)) continue;
        const descripcion = linea.match(/\.Descripcion\s*=\s*"((?:[^"]|"")*)"/);
        if (descripcion && enCastellano(descripcion[1])) {
            avisos.push({ nivel: "🔴", linea: i + 1, dice: "Descripción de una función de DinaScript en castellano: el catálogo va entero en inglés.", regla: "codigo/dinascript-funciones" });
        }
        const inicio = linea.indexOf(".AddParametro(");
        if (inicio < 0) continue;
        // Los argumentos: (ranura, tipo, nombre, descripción[, tabla]). Las comas de dentro de una cadena o un paréntesis no parten.
        const argumentos = [];
        let actual = "";
        let nivel = 0;
        let enTexto = false;
        for (const letra of linea.slice(inicio + ".AddParametro(".length)) {
            if (letra === "\"") enTexto = enTexto === false;
            if (enTexto === false && letra === "(") nivel++;
            if (enTexto === false && letra === ")") {
                if (nivel === 0) break;
                nivel--;
            }
            if (enTexto === false && nivel === 0 && letra === ",") {
                argumentos.push(actual.trim());
                actual = "";
                continue;
            }
            actual += letra;
        }
        argumentos.push(actual.trim());
        const nombre = /^"(?:[^"]|"")*"$/.test(argumentos[2] || "") ? argumentos[2].slice(1, -1) : null;
        const ayuda = /^"(?:[^"]|"")*"$/.test(argumentos[3] || "") ? argumentos[3].slice(1, -1) : null;
        if (nombre !== null && (nombre.trim() === "" || /^v\d+$/i.test(nombre.trim()))) {
            avisos.push({ nivel: "🔴", linea: i + 1, dice: "Parámetro de DinaScript sin nombre: el tercer argumento es el que lee quien escribe el script (`Value`, `Decimals`), nunca `v1`.", regla: "codigo/dinascript-funciones" });
        }
        if (ayuda !== null && ayuda.trim() === "") {
            avisos.push({ nivel: "🔴", linea: i + 1, dice: "Parámetro de DinaScript sin descripción: el cuarto argumento dice qué recibe, en inglés.", regla: "codigo/dinascript-funciones" });
        }
        if (enCastellano((nombre || "") + " " + (ayuda || ""))) {
            avisos.push({ nivel: "🔴", linea: i + 1, dice: "Parámetro de DinaScript en castellano: el nombre y la descripción van en inglés.", regla: "codigo/dinascript-funciones" });
        }
    }
}

// Una ventana que se abre sin alto (`Height = null`, sin `Height`, sin opciones, o `MostrarDialogGenerico` con `alto: null`)
// necesita `AltoAuto=true` en su maqueta (`DnzDialogLayout`, o las de play que la envuelven: `AgentDialogLayout` y
// `DialogLayout`): sin él se queda en 150 px, el mínimo de Radzen. Se cruzan la maqueta y las llamadas que la abren.
// Las etiquetas de maqueta sin AltoAuto, con su primera y su última línea.
function maquetasSinAltoAuto(ls) {
    const sin = [];
    ls.forEach((l, i) => {
        if (/<(?:Dnz|Agent)?DialogLayout\b/.test(l) === false) return;
        let etiqueta = "";
        let fin = i;
        for (; fin < Math.min(ls.length, i + 10); fin++) {
            etiqueta += " " + ls[fin];
            if (/(?:^|[^=])>\s*$|\/>/.test(ls[fin])) break;
        }
        if (/\bAltoAuto\b(?!\s*=\s*"?\s*false\b)/.test(etiqueta) === false) sin.push({ inicio: i, fin });
    });
    return sin;
}
// Con qué alto abre la llamada `OpenAsync<X>(…)` o `MostrarDialogGenerico<X>(…)` de la línea j: "nulo", "fijo", o ""
// si no se ve desde este fichero. `desde` y `hasta` son las líneas de donde salen sus opciones.
const abreVentana = /(OpenAsync|MostrarDialogGenerico)<(?:\w+\.)*(\w+)>\s*\(/;
function altoAlAbrir(ls, j) {
    const metodo = ls[j].match(abreVentana);
    // Sin comentarios `// …` (pueden llevar comas y comillas) ni flechas `=>` (el `>` no cierra nada).
    const resto = (ls[j].slice(metodo.index) + "\n" + ls.slice(j + 1, j + 25).join("\n")).replace(/(^|\s)\/\/.*$/gm, "$1").replace(/=>/g, "  ");
    // Los argumentos, partidos por las comas de fuera: sin contar las de cadenas, llaves, paréntesis ni genéricos.
    const argumentos = [];
    let actual = "";
    let nivel = 0;
    let genericos = 0;
    let enCadena = false;
    let cierre = -1;
    for (let c = resto.indexOf("(") + 1; c < resto.length; c++) {
        const letra = resto[c];
        if (enCadena) {
            if (letra === "\\") c++;
            else if (letra === "\"") enCadena = false;
            continue;
        }
        if (letra === "\"") {
            enCadena = true;
            continue;
        }
        if ("([{".includes(letra)) nivel++;
        if (")]}".includes(letra)) nivel--;
        if (letra === "<" && /\w/.test(resto[c - 1])) genericos++;
        if (letra === ">" && genericos > 0 && /[\w\]?>]/.test(resto[c - 1])) genericos--;
        if (nivel < 0) {
            cierre = c;
            break;
        }
        if (letra === "," && nivel === 0 && genericos === 0) {
            argumentos.push(actual);
            actual = "";
            continue;
        }
        actual += letra;
    }
    if (cierre < 0) return { alto: "" };
    argumentos.push(actual);
    const hastaLlamada = j + resto.slice(0, cierre).split("\n").length - 1;
    // `MostrarDialogGenerico(titulo, valores, ancho = "800px", alto = "90%")`: sin alto, abre al 90 %.
    if (metodo[1] === "MostrarDialogGenerico") {
        const alto = argumentos.find(a => /^\s*alto\s*:/.test(a)) || argumentos[3] || "";
        return { alto: /^\s*(?:alto\s*:)?\s*null\s*$/.test(alto) ? "nulo" : "fijo", desde: j, hasta: hastaLlamada };
    }
    const nombrado = argumentos.find(a => /^\s*options\s*:/.test(a));
    const opciones = nombrado === undefined ? argumentos[2] : nombrado.replace(/^\s*options\s*:/, "");
    if (opciones === undefined || /^\s*null\s*$/.test(opciones)) return { alto: "nulo", desde: j, hasta: hastaLlamada };
    // Las opciones salen de una función del fichero (`Opciones()`), de una variable de más arriba o de un `new` en la llamada.
    let desde = j;
    let hasta = hastaLlamada;
    const funcion = opciones.match(/^\s*(\w+)\(\)\s*$/);
    const variable = opciones.match(/^\s*(\w+)\s*$/);
    if (funcion) {
        desde = ls.findIndex(l => new RegExp(`DialogOptions\\s+${funcion[1]}\\s*\\(`).test(l));
        if (desde < 0) return { alto: "" };
        let llaves = 0;
        for (hasta = desde; hasta < Math.min(ls.length, desde + 40); hasta++) {
            llaves += (ls[hasta].match(/\{/g) || []).length - (ls[hasta].match(/\}/g) || []).length;
            if (llaves <= 0 && (hasta > desde ? /[;}]\s*$/ : /;\s*$/).test(ls[hasta])) break;
        }
    } else if (variable) {
        desde = -1;
        for (let k = j; k >= 0 && desde < 0; k--) {
            if (new RegExp(`\\b${variable[1]}\\s*=\\s*new\\b`).test(ls[k])) desde = k;
        }
        if (desde < 0) return { alto: "" };
    } else if (/^\s*new\b/.test(opciones) === false) {
        return { alto: "" };
    }
    const bloque = ls.slice(desde, hasta + 1).join("\n").replace(/(^|\s)\/\/.*$/gm, "$1");
    if (/\bHeight\s*=\s*null\b/.test(bloque)) return { alto: "nulo", desde, hasta };
    if (/\bHeight\s*=/.test(bloque)) return { alto: "fijo", desde, hasta };
    return { alto: "nulo", desde, hasta };
}
if (esRazor || extension === ".cs") {
    const nombreVentana = path.basename(fichero, extension);
    const avisadas = new Set();
    const avisarDelAlto = (i, ventana) => {
        if (avisadas.has(i)) return;
        avisadas.add(i);
        avisos.push({ nivel: "🔴", linea: i + 1, dice: `\`${ventana}\` se abre sin alto y su maqueta no lleva \`AltoAuto=true\`: se queda en 150 px, el mínimo de Radzen.`, regla: "codigo/dialogos-play" });
    };
    // Si la maqueta de una ventana deja alguna etiqueta sin AltoAuto. La de otra ventana se busca por su nombre en el repo.
    const sinAltoAuto = new Map();
    const maquetaSinAltoAuto = ventana => {
        if (sinAltoAuto.has(ventana)) return sinAltoAuto.get(ventana);
        let maqueta = [];
        if (ventana === nombreVentana && esRazor) maqueta = lineas;
        else {
            try {
                const ruta = git(["ls-files", "--", `*/${ventana}.razor`, `${ventana}.razor`], raizRepo).split(/\r?\n/)[0];
                if (ruta) maqueta = fs.readFileSync(path.resolve(raizRepo, ruta), "utf8").split(/\r?\n/);
            } catch { }
        }
        sinAltoAuto.set(ventana, maquetasSinAltoAuto(maqueta).length > 0);
        return sinAltoAuto.get(ventana);
    };
    // 1. Una etiqueta de maqueta recién escrita sin AltoAuto: ¿la abre sin alto alguna llamada, aquí o en otro fichero?
    const etiquetasEscritas = esRazor ? maquetasSinAltoAuto(lineas).filter(e => ordenadas.some(i => i >= e.inicio && i <= e.fin)) : [];
    if (etiquetasEscritas.length > 0) {
        const altos = [];
        lineas.forEach((l, j) => {
            const llamada = l.match(abreVentana);
            if (llamada && llamada[2] === nombreVentana) altos.push(altoAlAbrir(lineas, j).alto);
        });
        let fuera = "";
        try {
            fuera = git(["grep", "-n", "-E", `(OpenAsync|MostrarDialogGenerico)<([A-Za-z0-9_]+\\.)*${nombreVentana}>`, "--", "*.cs", "*.razor"], raizRepo);
        } catch { }
        for (const fila of fuera.split(/\r?\n/)) {
            const partes = fila.match(/^(.+?):(\d+):/);
            if (partes === null || path.resolve(raizRepo, partes[1]) === path.resolve(fichero)) continue;
            try {
                altos.push(altoAlAbrir(fs.readFileSync(path.resolve(raizRepo, partes[1]), "utf8").split(/\r?\n/), Number(partes[2]) - 1).alto);
            } catch { }
        }
        if (altos.includes("nulo")) etiquetasEscritas.forEach(e => avisarDelAlto(e.inicio, nombreVentana));
    }
    // 2. Una llamada recién escrita, o el `Height = null` de sus opciones: la ventana que abre sin alto no lleva AltoAuto.
    lineas.forEach((l, j) => {
        const llamada = l.match(abreVentana);
        if (llamada === null) return;
        if (llamada[2] === nombreVentana && etiquetasEscritas.length > 0) return;
        const alto = altoAlAbrir(lineas, j);
        if (alto.alto !== "nulo") return;
        let aviso = escritas.has(j) ? j : -1;
        for (let i = alto.desde; i <= alto.hasta && aviso < 0; i++) {
            if (escritas.has(i) && /\bHeight\s*=\s*null\b/.test(lineas[i])) aviso = i;
        }
        if (aviso >= 0 && maquetaSinAltoAuto(llamada[2])) avisarDelAlto(aviso, llamada[2]);
    });
}

// Ficheros nuevos con nombre de cajón o de code-behind.
if (esFicheroNuevo && /\.(?:Helpers?|Utils?|Utilities|Varios|Misc|Common)\.(?:cs|vb)$/.test(nombreFichero)) {
    avisos.push({ nivel: "🔴", linea: 1, dice: "Fichero cajón: el nombre dice el tema que contiene, `Servicio.Tema.ext`.", regla: "codigo/client-y-service" });
}
if (esFicheroNuevo && nombreFichero.includes("__")) {
    avisos.push({ nivel: "🔴", linea: 1, dice: "Parcial con `__` en el nombre: se parte con punto, `Tipo.Tema.ext`.", regla: "codigo/client-y-service" });
}
if (esFicheroNuevo && nombreFichero.endsWith(".razor.cs")) {
    avisos.push({ nivel: "🔴", linea: 1, dice: "Code-behind: todo en `@code { }` del `.razor`.", regla: "codigo/reglas-forzadas" });
}

// 5. IsBusy sin guarda: el método del Click tiene que empezar comprobando el mismo flag.
if (esRazor) {
    for (const i of ordenadas) {
        if (/IsBusy=/.test(lineas[i]) === false) continue;
        let inicio = i;
        while (inicio > 0 && i - inicio < 6 && /<RadzenButton\b/.test(lineas[inicio]) === false) inicio--;
        let fin = i;
        while (fin < lineas.length - 1 && fin - i < 6 && /\/>|<\/RadzenButton>/.test(lineas[fin]) === false) fin++;
        const etiqueta = lineas.slice(inicio, fin + 1).join(" ");
        const flag = (etiqueta.match(/IsBusy="?@\(?(\w+)\)?"?/) || [])[1];
        const metodo = (etiqueta.match(/Click="?@\(?(\w+)\)?"?/) || [])[1];
        if (flag === undefined || metodo === undefined) continue;
        const declaracion = lineas.findIndex(l => new RegExp(`^\\s*(?:(?:private|public|protected|internal|async|static)\\s+)*(?:Task|void)\\s+${metodo}\\s*\\(`).test(l));
        if (declaracion < 0) continue;
        let k = declaracion;
        while (k < lineas.length && lineas[k].includes("{") === false) k++;
        k++;
        while (k < lineas.length && (lineas[k].trim() === "" || lineas[k].trim().startsWith("//"))) k++;
        const primera = (lineas[k] || "") + " " + (lineas[k + 1] || "");
        // Solo cuenta si el método escribe: recargar dos veces no crea nada.
        let cierre = declaracion;
        let abiertas = 0;
        for (; cierre < lineas.length; cierre++) {
            abiertas += (lineas[cierre].match(/\{/g) || []).length - (lineas[cierre].match(/\}/g) || []).length;
            if (cierre > declaracion && abiertas <= 0) break;
        }
        const cuerpoDelMetodo = lineas.slice(declaracion, cierre + 1).join("\n");
        const escribe = /RunWriteOperation|WriteOperation|\b(?:Save|Guardar|Upsert|Insert|Update|Delete|Crear|Borrar|Eliminar|Escribir|Cobrar|Finalizar|Enviar|Send|Post|Importar|Publicar|Registrar|Fichar)\w*\s*\(/.test(cuerpoDelMetodo);
        if (escribe && new RegExp(`^\\s*if\\s*\\(\\s*${flag}\\s*\\)\\s*(?:\\{\\s*)?return\\s*;`).test(primera) === false) {
            avisos.push({ nivel: "🔴", linea: declaracion + 1, dice: `\`${metodo}\` no empieza con \`if (${flag}) return;\`: \`IsBusy\` solo pinta, y Enter o un segundo disparo entran igual.`, regla: "codigo/una-sola-vez" });
        }
    }
}

// 6. Funciones nuevas: ¿ya existe en el repo o en el SDK? ¿es una microfunción?
let catalogo = null;
if (esCodigo) {
    for (const i of ordenadas) {
        const linea = lineas[i];
        let nombre = "";
        let modificadores = "";
        let devuelve = "";
        let parametros = "";
        const vb = esVb ? linea.match(/^\s*((?:(?:Public|Private|Friend|Protected|Shared|Async|Overrides|Overridable|Iterator|Partial|Overloads|NotOverridable)\s+)*)(Function|Sub)\s+(\w+)\s*(?:\(Of[^)]*\))?\s*\((.*)$/) : null;
        const cs = esVb ? null : linea.match(/^\s*((?:(?:public|private|protected|internal|static|async|override|virtual|sealed|partial|new|extern|unsafe)\s+)*)([\w.]+(?:<[^()]*?>)?(?:\[\])?\??)\s+([A-Z]\w*)\s*(?:<[^()]*?>)?\s*\((.*)$/);
        if (vb) {
            modificadores = vb[1];
            nombre = vb[3];
            let nivel = 1;
            let corte = 0;
            for (; corte < vb[4].length && nivel > 0; corte++) {
                if (vb[4][corte] === "(") nivel++;
                if (vb[4][corte] === ")") nivel--;
            }
            parametros = vb[4].slice(0, corte - 1);
            devuelve = vb[2] === "Sub" ? "" : ((vb[4].slice(corte).match(/^\s*As\s+(.+?)\s*$/) || [])[1] || "");
        }
        if (cs) {
            if (palabrasReservadas.has(cs[2]) || /=/.test(linea.slice(0, linea.length - cs[4].length))) continue;
            modificadores = cs[1];
            devuelve = cs[2] === "void" ? "" : cs[2];
            nombre = cs[3];
            let nivel = 1;
            let corte = 0;
            for (; corte < cs[4].length && nivel > 0; corte++) {
                if (cs[4][corte] === "(") nivel++;
                if (cs[4][corte] === ")") nivel--;
            }
            parametros = cs[4].slice(0, corte - 1);
            if (/^\s*;/.test(cs[4].slice(corte))) continue;
        }
        if (nombre === "" || ciclosDeVida.has(nombre) || /\b(override|Overrides)\b/.test(modificadores)) continue;
        const abreUnDialogo = /^(Open|Abrir|Mostrar|Show|Nuevo|New)\w*$/.test(nombre) || /DialogService/.test(parametros);
        const estatica = /\b(static|Shared)\b/.test(modificadores);
        const privada = /\b(private|Private)\b/.test(modificadores) || (esRazor && /\b(public|protected|internal)\b/.test(modificadores) === false);
        if (estatica === false && privada === false) continue;

        // Tipo del primer parámetro, para comparar con el repo y con el SDK.
        let primero = "";
        let nivel = 0;
        for (const c of parametros) {
            if (c === "(" || c === "<") nivel++;
            if (c === ")" || c === ">") nivel--;
            if (c === "," && nivel === 0) break;
            primero += c;
        }
        let tipoPrimero = "";
        if (esVb) {
            const p = primero.match(/(\w+)(\(\))?\s+As\s+(.+)$/);
            tipoPrimero = p === null ? "" : p[3] + (p[2] || "");
        } else {
            const p = primero.trim().replace(/^(this|ref|out|in|params)\s+/, "").match(/^(.+?)\s+\w+(\s*=.*)?$/);
            tipoPrimero = p === null ? "" : p[1];
        }

        // 6a. La misma función estática en otro fichero del repo.
        if (estatica && abreUnDialogo === false) {
            let encontradas = "";
            try {
                encontradas = git(["grep", "-n", "-w", nombre, "--", "*.cs", "*.vb", "*.razor"], raizRepo);
            } catch { }
            for (const fila of encontradas.split(/\r?\n/)) {
                const partes = fila.match(/^(.+?):(\d+):(.*)$/);
                if (partes === null) continue;
                const otro = path.resolve(raizRepo, partes[1]);
                if (otro === path.resolve(fichero) || otro.split("\\").join("/") === rutaNormal) continue;
                const esDeclaracion = new RegExp(`\\b(static|Shared)\\b.*\\b(Function|Sub)?\\s*${nombre}\\s*(\\(|<)`).test(partes[3]) && new RegExp(`[.=]\\s*${nombre}\\s*\\(`).test(partes[3]) === false;
                if (esDeclaracion === false) continue;
                // Misma entrada y misma salida: casi seguro la misma función. Si no, puede ser otra con el mismo nombre.
                const suya = partes[3];
                const mismaFirma = tipoPrimero !== "" && suya.includes(tipoPrimero.trim()) && (devuelve === "" || suya.includes(devuelve.trim().replace(/\?$/, "")));
                const relativa = path.relative(raizRepo, otro).split("\\").join("/");
                avisos.push({ nivel: mismaFirma ? "🔴" : "🟡", linea: i + 1, dice: `\`${nombre}\` ya existe en \`${relativa}:${partes[2]}\`${mismaFirma ? "" : ", quizá con otro fin"}: reutilízala. Si hace falta en varios sitios, súbela a \`<Servicio>.Extensions\` o proponla para el SDK.`, regla: "codigo/no-hacer" });
                break;
            }
        }

        // 6b. El SDK ya tiene algo que recibe lo mismo, devuelve lo mismo y se llama parecido.
        if (tipoPrimero !== "" && devuelve !== "" && abreUnDialogo === false && /^(Task|ValueTask)\b/.test(devuelve.trim()) === false) {
            if (catalogo === null) {
                catalogo = [];
                try {
                    for (const fila of fs.readFileSync(path.join(raizRepo, ".claude", "sdk-catalogo.md"), "utf8").split(/\r?\n/)) {
                        const m = fila.match(/^- `(\w+)\((.*)\)` → `(.+?)`/);
                        if (m === null) continue;
                        let recibe = m[2];
                        if (/\bAs\b/.test(recibe)) {
                            let hasta = "";
                            let n = 0;
                            for (const c of recibe) {
                                if (c === "(") n++;
                                if (c === ")") n--;
                                if (c === "," && n === 0) break;
                                hasta += c;
                            }
                            const p = hasta.match(/(\w+)(\(\))?\s+As\s+(.+)$/);
                            recibe = p === null ? hasta : p[3] + (p[2] || "");
                        }
                        catalogo.push({ nombre: m[1], recibe: tipoBase(recibe), devuelve: tipoBase(m[3]) });
                    }
                } catch { }
            }
            const entra = tipoBase(tipoPrimero);
            const sale = tipoBase(devuelve);
            const suyas = palabras(nombre);
            const parecidas = catalogo.filter(e => e.recibe === entra && e.devuelve === sale).map(e => ({ ...e, comunes: [...palabras(e.nombre)].filter(p => suyas.has(p)).length })).filter(e => e.comunes > 0);
            parecidas.sort((a, b) => b.comunes - a.comunes || a.nombre.localeCompare(b.nombre));
            const nombres = [...new Set(parecidas.map(e => e.nombre))];
            if (nombres.length > 0 && nombres.includes(nombre) === false) {
                const lista = nombres.slice(0, 8).map(n => `\`${n}\``).join(", ") + (nombres.length > 8 ? ` y ${nombres.length - 8} más` : "");
                avisos.push({ nivel: "🟡", linea: i + 1, dice: `\`${nombre}\` recibe ${tipoPrimero.trim()} y devuelve ${devuelve.trim()}, como ${lista} del SDK. ¿No te vale una? Están en \`.claude/sdk-catalogo.md\`.`, regla: "codigo/codigo-lineal" });
            }
        }

        // 6c. Microfunción: cuerpo de 1 a 3 líneas y una sola llamada en el fichero.
        let cuerpo = 0;
        if (esVb) {
            let k = i + 1;
            while (k < lineas.length && /^\s*End\s+(Function|Sub)\b/.test(lineas[k]) === false) {
                if (lineas[k].trim() !== "" && lineas[k].trim().startsWith("'") === false) cuerpo++;
                k++;
            }
        } else if (/=>/.test(linea)) {
            // Cuerpo de expresión: hasta la línea que acaba en ";".
            let k = i;
            while (k < lineas.length - 1 && /;\s*(\/\/.*)?$/.test(lineas[k]) === false) k++;
            cuerpo = k - i + 1;
        } else {
            let k = i;
            let abiertas = 0;
            let empezado = false;
            for (; k < lineas.length; k++) {
                for (const c of lineas[k]) {
                    if (c === "{") {
                        abiertas++;
                        empezado = true;
                    }
                    if (c === "}") abiertas--;
                }
                if (empezado && k > i && abiertas > 0 && lineas[k].trim() !== "" && lineas[k].trim() !== "{" && lineas[k].trim().startsWith("//") === false) cuerpo++;
                if (empezado && abiertas === 0) break;
            }
        }
        const usos = (texto.match(new RegExp(`\\b${nombre}\\b`, "g")) || []).length - 1;
        const usadaEnLaMaqueta = esRazor && lineas.some((l, k) => k !== i && esCSharpDeRazor(k) === false && new RegExp(`\\b${nombre}\\b`).test(l));
        const publica = esVb ? /\bPrivate\b/.test(modificadores) === false : /\b(public|protected|internal)\b/.test(modificadores);
        if (publica === false && cuerpo > 0 && cuerpo <= 3 && usos === 1 && usadaEnLaMaqueta === false) {
            avisos.push({ nivel: "🟡", linea: i + 1, dice: `\`${nombre}\` tiene ${cuerpo === 1 ? "una línea" : cuerpo + " líneas"} y se llama desde un solo sitio: mejor en línea, o en una variable local con nombre.`, regla: "codigo/codigo-lineal" });
        }
    }
}

// El mismo aviso en la misma línea sale una vez: dos botones pueden llamar al mismo método.
const unicos = [...new Map(avisos.map(a => [a.linea + " " + a.dice, a])).values()];
avisos.splice(0, avisos.length, ...unicos);
if (avisos.length === 0) process.exit(0);

// 7. El aviso: los 🔴 primero, y como mucho 15 para que se lea entero.
avisos.sort((a, b) => (a.nivel === b.nivel ? a.linea - b.linea : a.nivel === "🔴" ? -1 : 1));
const relativo = path.relative(raizRepo, fichero).split("\\").join("/");
const hayRojos = avisos.some(a => a.nivel === "🔴");
let mensaje = `Revisión al escribir en ${relativo} (reglas de doc-in, resumidas en .claude/rules/):\n`;
for (const a of avisos.slice(0, 15)) mensaje += `${a.nivel} línea ${a.linea}: ${a.dice} [doc-in ${a.regla}]\n`;
if (avisos.length > 15) mensaje += `… y ${avisos.length - 15} más.\n`;
mensaje += hayRojos ? "Corrige los 🔴 antes de seguir. Un 🟡 se corrige, o se explica en la entrega por qué se queda." : "Un 🟡 se corrige, o se explica en la entrega por qué se queda.";

if (hayRojos) {
    process.stdout.write(JSON.stringify({ decision: "block", reason: mensaje }));
} else {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: mensaje } }));
}
process.exit(0);
