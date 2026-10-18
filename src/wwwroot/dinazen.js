// ============================================
// DinaZen JavaScript Library
// All functions under window.DinaZen namespace
// ============================================

window.DinaZen = window.DinaZen || {};

// ============================================
// IFrame Management
// ============================================

// El documento va en un iframe con sandbox: corre en un origen propio y play no puede leerlo.
// Por eso imprimir es un mensaje que atiende un script que se le pega al final del HTML.
var dzEscuchaImprimir = '<script>addEventListener("message",function(e){if(e.source===parent&&e.data==="dinaup:print"){focus();print();}});<\/script>';

window.DinaZen.setIframeBlob = (iframeId, htmlContent) => {
	var iframe = document.getElementById(iframeId);
	var blob = new Blob([htmlContent + dzEscuchaImprimir], { type: "text/html" });
	var url = URL.createObjectURL(blob);
	iframe.addEventListener("load", function () { iframe.dataset.dzCargado = url; }, { once: true });
	iframe.src = url;
};

// Si aun no ha cargado, espera: un mensaje enviado antes se pierde.
window.DinaZen.printIframe = function (id) {
	var iframe = typeof id === "string" ? document.getElementById(id) : id;

	if (!iframe || !iframe.src || iframe.src === "about:blank") {
		console.warn("[DinaZen] El iframe no tiene contenido cargado:", id);
		return;
	}

	var imprimir = function () { iframe.contentWindow.postMessage("dinaup:print", "*"); };
	if (iframe.dataset.dzCargado === iframe.src) imprimir();
	else iframe.addEventListener("load", imprimir, { once: true });
};

window.DinaZen.printIframeOnce = function (iframe) {
	if (!iframe || !iframe.src || iframe.src === "about:blank") return; // el about:blank inicial tambien dispara onload
	iframe.onload = "";
	iframe.contentWindow.postMessage("dinaup:print", "*"); // viene del onload: ya ha cargado

	setTimeout(() => {
		window.focus();
		const element = document.querySelector('[tabindex], button, a, input, textarea, select');
		if (element) element.focus();
	}, 500);
};

// ============================================
// Dialog Management
// ============================================

window.DinaZen.setDialogWidth = function (element, width) {
	if (!element) return;
	const dialog = element.closest(".rz-dialog");
	if (dialog) {
		dialog.style.width = width;
	}
};

window.DinaZen.setDialogHeight = function (element, height) {
	if (!element) return;
	const dialog = element.closest(".rz-dialog");
	if (dialog) {
		dialog.style.height = height;
	}
};

// ============================================
// Focus Management
// ============================================

window.DinaZen.focusNextElement = () => {
	const active = document.activeElement;
	if (!active) return;

	const focusables = Array.from(
		document.querySelectorAll(
			'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
		)
	).filter(el => !el.disabled && !el.hidden && el.tabIndex >= 0);

	const index = focusables.indexOf(active);
	if (index >= 0 && index + 1 < focusables.length) {
		const next = focusables[index + 1];
		next.focus();

		// Si es un campo de texto, selecciona todo su contenido
		if (next instanceof HTMLInputElement || next instanceof HTMLTextAreaElement) {
			next.select();
		}
	}
};
 

// ============================================
// Ancho del contenedor (movil / escritorio)
// ============================================
// Se mide el ANCHO REAL DEL CONTENEDOR, no el viewport: las apps del ecosistema fijan
// el <meta viewport> (920/1460px), asi que las media queries nunca ven un movil. Ademas
// asi entra tambien la ventana flotante estrecha y el panel dividido, no solo el telefono.

window.DinaZen._widthObservers = window.DinaZen._widthObservers || {};

window.DinaZen.observeWidth = function (elementId, dotNetRef, threshold) {
	const el = document.getElementById(elementId);
	if (!el || !el.parentElement) return;

	// El padre, no el propio elemento: el elemento suele llevar un min-width que le impide
	// bajar del umbral, con lo que su ancho dependeria del modo que ese ancho decide.
	const target = el.parentElement;

	if (window.DinaZen._widthObservers[elementId]) {
		window.DinaZen._widthObservers[elementId].disconnect();
	}

	let last = null;
	const check = (w) => {
		if (w <= 0) return; // Elemento aun no visible: 0 no es "es un movil".
		// Histeresis: al pasar a movil cae el min-width y desaparece la barra de scroll
		// (~15px); sin margen podria oscilar justo en el umbral.
		const esMovil = last === true ? w < (threshold + 40) : w < threshold;
		if (esMovil !== last) {
			last = esMovil;
			dotNetRef.invokeMethodAsync('OnContainerWidthChanged', esMovil);
		}
	};

	const ro = new ResizeObserver(entries => {
		for (const e of entries) check(e.contentRect.width);
	});
	ro.observe(target);
	window.DinaZen._widthObservers[elementId] = ro;

	// Primera medida sincrona, para nacer ya en la rama correcta sin esperar un resize.
	check(target.getBoundingClientRect().width);
};

window.DinaZen.unobserveWidth = function (elementId) {
	const ro = window.DinaZen._widthObservers[elementId];
	if (ro) {
		ro.disconnect();
		delete window.DinaZen._widthObservers[elementId];
	}
};


// ============================================
// Highlight.js - Syntax Highlighting
// ============================================

window.DinaZen.highlightCode = function () {
	if (typeof hljs === 'undefined') {
		console.warn('[DinaZen] highlight.js not loaded');
		return;
	}
	document.querySelectorAll('pre code:not(.hljs)').forEach((el) => {
		hljs.highlightElement(el);
	});
};

window.DinaZen.highlightElement = function (element) {
	if (typeof hljs === 'undefined' || !element) return;
	// Remove previous highlight so hljs re-processes the element
	element.classList.remove('hljs');
	element.removeAttribute('data-highlighted');
	element.textContent = element.textContent;
	hljs.highlightElement(element);
};


 
