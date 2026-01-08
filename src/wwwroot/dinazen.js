window.setIframeBlob = (iframeId, htmlContent) => {
	var blob = new Blob([htmlContent], { type: "text/html" });
	var url = URL.createObjectURL(blob);
	document.getElementById(iframeId).src = url;
};

window.setDialogWidth = function (element, width) {
	if (!element) return;
	const dialog = element.closest(".rz-dialog");
	if (dialog) {
		dialog.style.width = width;
	}
};

window.setDialogHeight = function (element, height) {
	if (!element) return;
	const dialog = element.closest(".rz-dialog");
	if (dialog) {
		dialog.style.height = height;
	}
};



window.focusNextElement = () => {
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


window.loadLottie = function (containerId, srcOrData, options) {
	const container = document.getElementById(containerId);
	if (!container) {
		console.error(`[lottie] container #${containerId} no encontrado`);
		return null;
	}

	// Limpia previa
	if (container.__lottieAnim) {
		try { container.__lottieAnim.destroy(); } catch { }
		container.__lottieAnim = null;
	}
	container.innerHTML = "";

	const safeOpts = Object.assign({
		loop: true,
		autoplay: true,
		renderer: "svg",
		preserveAspectRatio: "xMidYMid meet",
		progressiveLoad: true
	}, options || {});

	// Decide si es JSON inline o una URL
	const isProbablyJson =
		typeof srcOrData === "object" ||
		(typeof srcOrData === "string" && srcOrData.trim().startsWith("{"));

	let animConfig = {
		container,
		renderer: safeOpts.renderer,
		loop: safeOpts.loop,
		autoplay: safeOpts.autoplay,
		rendererSettings: {
			progressiveLoad: safeOpts.progressiveLoad,
			preserveAspectRatio: safeOpts.preserveAspectRatio,
		}
	};

	if (isProbablyJson) {
		let data = srcOrData;
		try {
			if (typeof data === "string") data = JSON.parse(data);
			if (data && data.data) data = data.data;
			if (data && data.result) data = data.result;
			if (data && data.default) data = data.default;
		} catch (e) {
			console.error("[lottie] JSON inválido:", e);
			return null;
		}
		animConfig.animationData = data;
	} else {
		// Es una URL/ruta; dejamos que lottie-web haga el fetch
		animConfig.path = srcOrData;
	}

	const anim = lottie.loadAnimation(animConfig);
	container.__lottieAnim = anim;
	return anim;
};


function printIframeOnce(iframe) {


	try {



	if (!iframe) {
		console.warn("El iframe no existe:");
		return;
	}

	var src = iframe.src;

	// Verificar que tiene un contenido válido (evita imprimir si está vacío)
	if (!src || src === "about:blank") {
		console.warn("El iframe no tiene contenido cargado:");
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
		console.warn("El iframe no tiene contenido imprimible:");
	}
	} catch (e) { }

}



function printIframe(id) {
	var iframe = document.getElementById(id);

	if (!iframe) {
		console.warn("El iframe no existe:", id);
		return;
	}

	var src = iframe.src;

	// Verificar que tiene un contenido válido (evita imprimir si está vacío)
	if (!src || src === "about:blank") {
		console.warn("El iframe no tiene contenido cargado:", id);
		return;
	}

	// Intentar imprimir solo si hay contenido válido
	if (iframe.contentWindow && iframe.contentWindow.document && iframe.contentWindow.document.body.innerHTML.trim().length > 0) {
		iframe.contentWindow.focus();
		iframe.contentWindow.print();
	} else {
		console.warn("El iframe no tiene contenido imprimible:", id);
	}
}
