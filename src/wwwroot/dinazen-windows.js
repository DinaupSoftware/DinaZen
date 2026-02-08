// ============================================
// DinaZen Window Manager — Drag & Resize
// ES Module for smooth window interactions
// ============================================

const _windows = new Map();
let _escapeRef = null;
let _escapeHandler = null;

export function getViewport() {
	return { width: window.innerWidth, height: window.innerHeight };
}

// ── Escape key: close active window ──

export function initEscapeClose(dotNetRef) {
	disposeEscapeClose();
	_escapeRef = dotNetRef;
	_escapeHandler = (e) => {
		if (e.key === 'Escape') {
			// No cerrar si el foco esta en un input/textarea/select
			const tag = document.activeElement?.tagName;
			if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
			e.preventDefault();
			_escapeRef.invokeMethodAsync('JsEscapePressed');
		}
	};
	document.addEventListener('keydown', _escapeHandler);
}

export function disposeEscapeClose() {
	if (_escapeHandler) {
		document.removeEventListener('keydown', _escapeHandler);
		_escapeHandler = null;
	}
	_escapeRef = null;
}

export function initWindow(elementId, dotNetRef, minWidth, minHeight) {
	const el = document.getElementById(elementId);
	if (!el) return;

	const state = { el, dotNetRef, minWidth, minHeight, dragging: false, resizing: false };
	_windows.set(elementId, state);

	// ── Drag ──
	const titlebar = el.querySelector('.dnz-win-titlebar');
	if (titlebar) {
		titlebar.addEventListener('mousedown', (e) => onDragStart(e, state));
	}

	// ── Resize handles ──
	el.querySelectorAll('.dnz-win-resize').forEach(handle => {
		handle.addEventListener('mousedown', (e) => onResizeStart(e, state, handle.dataset.dir));
	});

	// ── Focus on click ──
	el.addEventListener('mousedown', () => {
		dotNetRef.invokeMethodAsync('JsFocus');
	}, true);
}

export function destroyWindow(elementId) {
	_windows.delete(elementId);
}

export function setPosition(elementId, x, y, w, h) {
	const state = _windows.get(elementId);
	if (!state) return;
	const el = state.el;
	el.style.left = x + 'px';
	el.style.top = y + 'px';
	el.style.width = w + 'px';
	el.style.height = h + 'px';
}

// ── Drag ──

function onDragStart(e, state) {
	if (e.target.closest('button, a, input')) return;
	e.preventDefault();

	state.dragging = true;
	const rect = state.el.getBoundingClientRect();
	const offsetX = e.clientX - rect.left;
	const offsetY = e.clientY - rect.top;

	state.el.querySelector('.dnz-win-titlebar').style.cursor = 'grabbing';

	const onMove = (e) => {
		if (!state.dragging) return;
		let x = e.clientX - offsetX;
		let y = e.clientY - offsetY;

		// Mantener dentro de la pantalla (al menos 100px visibles)
		x = Math.max(-rect.width + 100, Math.min(window.innerWidth - 100, x));
		y = Math.max(0, Math.min(window.innerHeight - 60, y));

		state.el.style.left = x + 'px';
		state.el.style.top = y + 'px';
	};

	const onUp = () => {
		state.dragging = false;
		state.el.querySelector('.dnz-win-titlebar').style.cursor = '';
		document.removeEventListener('mousemove', onMove);
		document.removeEventListener('mouseup', onUp);

		// Notificar a Blazor la posicion final
		const r = state.el.getBoundingClientRect();
		state.dotNetRef.invokeMethodAsync('JsDragEnd',
			Math.round(r.left), Math.round(r.top),
			Math.round(r.width), Math.round(r.height));
	};

	document.addEventListener('mousemove', onMove);
	document.addEventListener('mouseup', onUp);
}

// ── Resize ──

function onResizeStart(e, state, dir) {
	e.preventDefault();
	e.stopPropagation();
	state.resizing = true;

	const startX = e.clientX;
	const startY = e.clientY;
	const rect = state.el.getBoundingClientRect();
	const startW = rect.width;
	const startH = rect.height;
	const startLeft = rect.left;
	const startTop = rect.top;

	const onMove = (e) => {
		if (!state.resizing) return;

		let dx = e.clientX - startX;
		let dy = e.clientY - startY;
		let newW = startW;
		let newH = startH;
		let newX = startLeft;
		let newY = startTop;

		if (dir.includes('e')) newW = Math.max(state.minWidth, startW + dx);
		if (dir.includes('w')) { newW = Math.max(state.minWidth, startW - dx); newX = startLeft + (startW - newW); }
		if (dir.includes('s')) newH = Math.max(state.minHeight, startH + dy);
		if (dir.includes('n')) { newH = Math.max(state.minHeight, startH - dy); newY = startTop + (startH - newH); }

		state.el.style.width = newW + 'px';
		state.el.style.height = newH + 'px';
		state.el.style.left = newX + 'px';
		state.el.style.top = newY + 'px';
	};

	const onUp = () => {
		state.resizing = false;
		document.removeEventListener('mousemove', onMove);
		document.removeEventListener('mouseup', onUp);

		const r = state.el.getBoundingClientRect();
		state.dotNetRef.invokeMethodAsync('JsDragEnd',
			Math.round(r.left), Math.round(r.top),
			Math.round(r.width), Math.round(r.height));
	};

	document.addEventListener('mousemove', onMove);
	document.addEventListener('mouseup', onUp);
}
