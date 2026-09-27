// Genera .claude/sdk-catalogo.md: las extensiones públicas del SDK Dinaup, por el tipo que reciben.
// Uso: node .claude/tools/catalogo-sdk.mjs <ruta al src del SDK>   (en el PC de Angel: C:\GitHub\DinaupSoftware\Dinaup\src)
// Lo lee el hook revisar-al-escribir.mjs para avisar cuando una función nueva ya existe en el SDK.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raizSdk = process.argv[2];
if (raizSdk === undefined || fs.existsSync(raizSdk) === false) {
    console.error("Uso: node .claude/tools/catalogo-sdk.mjs <ruta al src del SDK>");
    process.exit(1);
}

const salida = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "sdk-catalogo.md");
const vbproj = path.join(raizSdk, "Dinaup.vbproj");
const version = fs.existsSync(vbproj) ? (fs.readFileSync(vbproj, "utf8").match(/<Version>([^<]+)<\/Version>/) || ["", "?"])[1] : "?";

// Las extensiones de un Friend Module no se ven desde fuera del SDK.
const extensiones = [];
const pendientes = [raizSdk];
while (pendientes.length > 0) {
    const carpeta = pendientes.pop();
    for (const entrada of fs.readdirSync(carpeta, { withFileTypes: true })) {
        const ruta = path.join(carpeta, entrada.name);
        if (entrada.isDirectory()) {
            if (["bin", "obj", ".git"].includes(entrada.name) === false) pendientes.push(ruta);
            continue;
        }
        if (entrada.name.endsWith(".vb") === false) continue;

        const lineas = fs.readFileSync(ruta, "utf8").split(/\r?\n/);
        let moduloPublico = true;
        for (let i = 0; i < lineas.length; i++) {
            const modulo = lineas[i].match(/^\s*(Public\s+|Friend\s+)?Module\s+\w+/);
            if (modulo) moduloPublico = (modulo[1] || "").trim() !== "Friend";
            if (/^\s*<(Runtime\.CompilerServices\.)?Extension(\(\))?>\s*$/.test(lineas[i]) === false) continue;
            if (moduloPublico === false) continue;

            let j = i + 1;
            while (j < lineas.length && (lineas[j].trim() === "" || /^\s*</.test(lineas[j]))) j++;
            const firma = (lineas[j] || "").trim();
            const m = firma.match(/^Public\s+(?:Async\s+|Iterator\s+)*(Function|Sub)\s+(\w+)(\s*\(Of[^)]*\))?\s*\((.*)$/);
            if (m === null) continue;

            // Parámetros: hasta el paréntesis que cierra la lista, contando los de (Of T) y los arrays.
            const resto = m[4];
            let nivel = 1;
            let fin = 0;
            for (; fin < resto.length; fin++) {
                if (resto[fin] === "(") nivel++;
                if (resto[fin] === ")") nivel--;
                if (nivel === 0) break;
            }
            const parametros = resto.slice(0, fin);
            const tras = resto.slice(fin + 1).trim();
            const devuelve = m[1] === "Sub" ? "Sub" : (tras.match(/^As\s+(.+)$/) || ["", "?"])[1].trim();

            // Tipo del primero (el que recibe la extensión), sin ByVal/ByRef ni nombre.
            let primero = "";
            nivel = 0;
            for (const c of parametros) {
                if (c === "(") nivel++;
                if (c === ")") nivel--;
                if (c === "," && nivel === 0) break;
                primero += c;
            }
            // En VB el array puede ir en el nombre: "Valores() As String" recibe String().
            const partes = primero.match(/(\w+)(\(\))?\s+As\s+(.+)$/);
            const recibe = partes === null ? primero.trim() : partes[3].trim() + (partes[2] === undefined ? "" : "()");
            const firmaCorta = parametros.split(",").length > 1 ? parametros.replace(/\b(ByVal|ByRef|Optional)\s+/g, "").replace(/\s+/g, " ").trim() : "";

            let resumen = "";
            let k = i - 1;
            const comentario = [];
            while (k >= 0 && lineas[k].trim().startsWith("'''")) {
                comentario.unshift(lineas[k].trim().replace(/^'''\s?/, ""));
                k--;
            }
            resumen = comentario.join(" ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            if (resumen.length > 140) resumen = resumen.slice(0, 137) + "…";

            extensiones.push({ nombre: m[2], recibe, devuelve, firmaCorta, resumen, fichero: path.relative(raizSdk, ruta).split(path.sep).join("/") });
        }
    }
}

// Se agrupan por el tipo que reciben, que es por donde se busca.
function grupo(tipo) {
    const t = tipo.replace(/\s+/g, "");
    if (/^String(\(\))?$/i.test(t)) return t.endsWith("()") ? "Arrays y listas" : "String";
    if (/^(Date|DateTime|DateOnly|TimeOnly|TimeSpan|DayOfWeek)(\?)?$/i.test(t)) return "Fechas y horas";
    if (/^(Decimal|Integer|Long|Double|Single|Short|Byte)$/i.test(t)) return "Números";
    if (/^Guid$/i.test(t)) return "Guid";
    if (/^Boolean$/i.test(t)) return "Boolean";
    if (/Dictionary|NameValueCollection|KeyValuePair/i.test(t)) return "Diccionarios";
    if (/List|IEnumerable|HashSet|ICollection|IList|\(\)$|Array/i.test(t)) return "Arrays y listas";
    if (/Exception/i.test(t)) return "Excepciones";
    if (/Enum/i.test(t)) return "Enums";
    if (/Json|JObject|JToken/i.test(t)) return "JSON";
    return "Otros";
}

const orden = ["String", "Fechas y horas", "Números", "Guid", "Boolean", "Diccionarios", "Arrays y listas", "Enums", "Excepciones", "JSON", "Otros"];
const grupos = new Map(orden.map(g => [g, []]));
for (const e of extensiones) grupos.get(grupo(e.recibe)).push(e);

let md = `# Catálogo del SDK Dinaup\n\n`;
md += `Generado con \`node .claude/tools/catalogo-sdk.mjs\` desde Dinaup ${version}: ${extensiones.length} extensiones públicas, por el tipo que reciben. No se edita a mano.\n\n`;
md += `Antes de escribir una función, busca aquí por el tipo que entra y el que sale. Si una hace casi lo que necesitas, úsala; si falta algo, se añade al SDK, no a una copia privada.\n`;
for (const g of orden) {
    const lista = grupos.get(g).sort((a, b) => a.nombre.localeCompare(b.nombre) || a.recibe.localeCompare(b.recibe));
    if (lista.length === 0) continue;
    md += `\n## ${g}\n\n`;
    for (const e of lista) {
        const firma = e.firmaCorta === "" ? e.recibe : e.firmaCorta;
        md += `- \`${e.nombre}(${firma})\` → \`${e.devuelve}\`${e.resumen === "" ? "" : ` — ${e.resumen}`}\n`;
    }
}
fs.writeFileSync(salida, md);
console.log(`${extensiones.length} extensiones → ${salida}`);
