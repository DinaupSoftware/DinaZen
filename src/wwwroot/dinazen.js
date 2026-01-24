// ============================================
// DinaZen JavaScript Library
// All functions under window.DinaZen namespace
// ============================================

window.DinaZen = window.DinaZen || {};

// ============================================
// IFrame Management
// ============================================

window.DinaZen.setIframeBlob = (iframeId, htmlContent) => {
	var blob = new Blob([htmlContent], { type: "text/html" });
	var url = URL.createObjectURL(blob);
	document.getElementById(iframeId).src = url;
};

window.DinaZen.printIframe = function (id) {
	var iframe = document.getElementById(id);

	if (!iframe) {
		console.warn("[DinaZen] El iframe no existe:", id);
		return;
	}

	var src = iframe.src;

	// Verificar que tiene un contenido válido (evita imprimir si está vacío)
	if (!src || src === "about:blank") {
		console.warn("[DinaZen] El iframe no tiene contenido cargado:", id);
		return;
	}

	// Intentar imprimir solo si hay contenido válido
	if (iframe.contentWindow && iframe.contentWindow.document && iframe.contentWindow.document.body.innerHTML.trim().length > 0) {
		iframe.contentWindow.focus();
		iframe.contentWindow.print();
	} else {
		console.warn("[DinaZen] El iframe no tiene contenido imprimible:", id);
	}
};

window.DinaZen.printIframeOnce = function (iframe) {
	try {
		if (!iframe) {
			console.warn("[DinaZen] El iframe no existe");
			return;
		}

		var src = iframe.src;

		// Verificar que tiene un contenido válido (evita imprimir si está vacío)
		if (!src || src === "about:blank") {
			console.warn("[DinaZen] El iframe no tiene contenido cargado");
			return;
		}

		// Intentar imprimir solo si hay contenido válido
		if (iframe.contentWindow && iframe.contentWindow.document && iframe.contentWindow.document.body.innerHTML.trim().length > 0) {
			iframe.onload = "";
			iframe.contentWindow.focus();
			iframe.contentWindow.print();

			setTimeout(() => {
				window.focus();
				const element = document.querySelector('[tabindex], button, a, input, textarea, select');
				if (element) element.focus();
			}, 500);
		} else {
			console.warn("[DinaZen] El iframe no tiene contenido imprimible");
		}
	} catch (e) {
		console.error("[DinaZen] Error al imprimir iframe:", e);
	}
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
	hljs.highlightElement(element);
};

 
