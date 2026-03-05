window.DnzImageEditor = {
    _instances: {},

    init(id, canvasId, cropOvId, cropSelId, cropDimId, canvasAreaId, sidePanelId, dotNetRef) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const inst = {
            canvas, ctx, dotNetRef,
            canvasId, cropOvId, cropSelId, cropDimId, canvasAreaId, sidePanelId,
            origImg: null, curData: null,
            hist: [], hIdx: -1, maxHist: 15,
            enhOn: false, cropMode: false,
            cropStart: null, cropRect: null, dragging: false, actHandle: null,
            debT: null, fileInput: null,
            _onKeyDown: null, _onDrop: null, _onDragOver: null
        };
        this._instances[id] = inst;
        this._setupDropZone(id);
        this._setupKeyboard(id);
    },

    _setupDropZone(id) {
        const inst = this._instances[id];
        const area = document.getElementById(inst.canvasAreaId);
        if (!area) return;
        inst._onDragOver = e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };
        inst._onDrop = e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) this._loadFile(id, f); };
        area.addEventListener('dragover', inst._onDragOver);
        area.addEventListener('drop', inst._onDrop);
    },

    _setupKeyboard(id) {
        const inst = this._instances[id];
        inst._onKeyDown = e => {
            if (e.ctrlKey && e.key === 'z') { e.preventDefault(); this.undo(id); }
            else if (e.ctrlKey && e.key === 'y') { e.preventDefault(); this.redo(id); }
            else if (e.key === 'Escape' && inst.cropMode) { this.cancelCrop(id); }
            else if (e.key === 'Enter' && inst.cropMode && inst.cropRect) { this.applyCrop(id); }
        };
        document.addEventListener('keydown', inst._onKeyDown);
    },

    _loadFile(id, file) {
        const inst = this._instances[id];
        const r = new FileReader();
        r.onload = e => this._loadImageSrc(id, e.target.result);
        r.readAsDataURL(file);
    },

    _loadImageSrc(id, src) {
        const inst = this._instances[id];
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            inst.origImg = img;
            inst.canvas.width = img.width;
            inst.canvas.height = img.height;
            inst.ctx.drawImage(img, 0, 0);
            inst.curData = inst.ctx.getImageData(0, 0, inst.canvas.width, inst.canvas.height);
            inst.hist = [];
            inst.hIdx = -1;
            inst.enhOn = false;
            this._pushHist(id, 'Cargada');
            inst.dotNetRef.invokeMethodAsync('OnImageInfoChanged', inst.canvas.width, inst.canvas.height);
        };
        img.onerror = () => { console.error('DnzImageEditor: failed to load image'); };
        img.src = src;
    },

    loadFromDataUri(id, dataUri) { this._loadImageSrc(id, dataUri); },

    loadFromBase64(id, base64) {
        this._loadImageSrc(id, 'data:image/png;base64,' + base64);
    },

    async loadFromUrl(id, url) {
        try {
            const resp = await fetch(url);
            const blob = await resp.blob();
            const dataUri = await new Promise(resolve => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(blob); });
            this._loadImageSrc(id, dataUri);
        } catch (e) {
            console.error('DnzImageEditor: fetch error', e);
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => this._loadImageSrc(id, img.src);
            img.src = url;
        }
    },

    triggerFileInput(id) {
        const inst = this._instances[id];
        if (!inst) return;
        if (inst.fileInput) inst.fileInput.remove();
        const fi = document.createElement('input');
        fi.type = 'file';
        fi.accept = 'image/*';
        fi.style.display = 'none';
        fi.onchange = () => { if (fi.files[0]) this._loadFile(id, fi.files[0]); };
        document.body.appendChild(fi);
        inst.fileInput = fi;
        fi.click();
    },

    // History
    _pushHist(id, label) {
        const inst = this._instances[id];
        if (inst.hIdx < inst.hist.length - 1) inst.hist = inst.hist.slice(0, inst.hIdx + 1);
        if (inst.hist.length >= inst.maxHist) inst.hist.shift();
        inst.hist.push({ d: inst.ctx.getImageData(0, 0, inst.canvas.width, inst.canvas.height), w: inst.canvas.width, h: inst.canvas.height, l: label });
        inst.hIdx = inst.hist.length - 1;
        inst.curData = inst.hist[inst.hIdx].d;
        this._notifyHistory(id);
    },

    _restoreHist(id) {
        const inst = this._instances[id];
        const h = inst.hist[inst.hIdx];
        inst.canvas.width = h.w;
        inst.canvas.height = h.h;
        inst.ctx.putImageData(h.d, 0, 0);
        inst.curData = h.d;
        this._notifyHistory(id);
        inst.dotNetRef.invokeMethodAsync('OnImageInfoChanged', h.w, h.h);
    },

    _notifyHistory(id) {
        const inst = this._instances[id];
        inst.dotNetRef.invokeMethodAsync('OnHistoryChanged', inst.hIdx > 0, inst.hIdx < inst.hist.length - 1);
    },

    undo(id) { const inst = this._instances[id]; if (inst && inst.hIdx > 0) { inst.hIdx--; this._restoreHist(id); } },
    redo(id) { const inst = this._instances[id]; if (inst && inst.hIdx < inst.hist.length - 1) { inst.hIdx++; this._restoreHist(id); } },

    // Enhance
    toggleEnhance(id) {
        const inst = this._instances[id];
        if (!inst) return;
        inst.enhOn = !inst.enhOn;
        this._applyAdj(id);
    },

    // Adjustments panel
    showAdjustPanel(id, show) {
        const inst = this._instances[id];
        if (!inst) return;
        const panel = document.getElementById(inst.sidePanelId);
        if (!panel) return;
        if (show) {
            const sliders = [
                { id: 'brightness', label: 'Brillo', min: -100, max: 100, val: 0 },
                { id: 'contrast', label: 'Contraste', min: -100, max: 100, val: 0 },
                { id: 'saturation', label: 'Saturación', min: -100, max: 100, val: 0 },
                { id: 'temperature', label: 'Temperatura', min: -100, max: 100, val: 0 },
                { id: 'sharpen', label: 'Nitidez', min: 0, max: 100, val: 0 }
            ];
            let html = '<div style="padding:10px 12px;display:flex;flex-direction:column;gap:10px">';
            html += '<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.6px;color:var(--rz-text-tertiary-color)">Ajustes</div>';
            sliders.forEach(s => {
                html += `<div class="dnz-imged-sg"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:11px;color:var(--rz-text-secondary-color)">${s.label}</span><span id="dnzimged_${id}_${s.id}_val" style="font:10px/1 monospace;color:var(--rz-text-tertiary-color)">${s.val}</span></div><input type="range" min="${s.min}" max="${s.max}" value="${s.val}" id="dnzimged_${id}_${s.id}" style="width:100%;height:3px;accent-color:var(--rz-primary)"></div>`;
            });
            html += `<button id="dnzimged_${id}_commit" style="width:100%;padding:6px 12px;border:none;border-radius:4px;background:var(--rz-primary);color:#fff;font:500 12px/1 inherit;cursor:pointer">Aplicar ajustes</button>`;
            html += '</div>';
            panel.innerHTML = html;
            sliders.forEach(s => {
                const el = document.getElementById(`dnzimged_${id}_${s.id}`);
                if (el) el.addEventListener('input', () => {
                    document.getElementById(`dnzimged_${id}_${s.id}_val`).textContent = el.value;
                    clearTimeout(inst.debT);
                    inst.debT = setTimeout(() => this._applyAdj(id), 25);
                });
            });
            const commitBtn = document.getElementById(`dnzimged_${id}_commit`);
            if (commitBtn) commitBtn.addEventListener('click', () => this.commitAdjustments(id));
        } else {
            panel.innerHTML = '';
        }
    },

    _getSliderVal(id, name) {
        const el = document.getElementById(`dnzimged_${id}_${name}`);
        return el ? +el.value : 0;
    },

    _resetSliders(id) {
        ['brightness', 'contrast', 'saturation', 'temperature', 'sharpen'].forEach(name => {
            const el = document.getElementById(`dnzimged_${id}_${name}`);
            const valEl = document.getElementById(`dnzimged_${id}_${name}_val`);
            if (el) { el.value = 0; }
            if (valEl) { valEl.textContent = '0'; }
        });
    },

    _applyAdj(id) {
        const inst = this._instances[id];
        if (!inst || !inst.curData) return;
        const src = inst.curData.data;
        const out = inst.ctx.createImageData(inst.canvas.width, inst.canvas.height);
        const dst = out.data;

        const br = this._getSliderVal(id, 'brightness');
        const co = this._getSliderVal(id, 'contrast');
        const sa = this._getSliderVal(id, 'saturation');
        const te = this._getSliderVal(id, 'temperature');
        const sh = this._getSliderVal(id, 'sharpen');

        let eBr = 0, eCo = 0, eSa = 0;
        if (inst.enhOn) {
            let tl = 0;
            const len = src.length / 4;
            for (let i = 0; i < src.length; i += 16) tl += src[i] * .299 + src[i + 1] * .587 + src[i + 2] * .114;
            eBr = Math.max(-40, Math.min(40, Math.round((128 - tl / (len / 4)) * .4)));
            eCo = 15;
            eSa = 12;
        }

        const fBr = br + eBr;
        const cf = (259 * ((co + eCo) + 255)) / (255 * (259 - (co + eCo)));
        const sf = 1 + (sa + eSa) / 100;

        for (let i = 0; i < src.length; i += 4) {
            let r = src[i] + fBr, g = src[i + 1] + fBr, b = src[i + 2] + fBr;
            r = cf * (r - 128) + 128;
            g = cf * (g - 128) + 128;
            b = cf * (b - 128) + 128;
            const gr = .299 * r + .587 * g + .114 * b;
            r = gr + sf * (r - gr);
            g = gr + sf * (g - gr);
            b = gr + sf * (b - gr);
            if (te) { r += te * .5; b -= te * .5; }
            dst[i] = Math.max(0, Math.min(255, r));
            dst[i + 1] = Math.max(0, Math.min(255, g));
            dst[i + 2] = Math.max(0, Math.min(255, b));
            dst[i + 3] = src[i + 3];
        }

        if (sh > 0) {
            const w = inst.canvas.width, h = inst.canvas.height, amt = sh / 100;
            const t = new Uint8ClampedArray(dst);
            for (let y = 1; y < h - 1; y++) {
                for (let x = 1; x < w - 1; x++) {
                    const idx = (y * w + x) * 4;
                    for (let c = 0; c < 3; c++) {
                        const s = t[idx + c] * 5 - t[((y - 1) * w + x) * 4 + c] - t[((y + 1) * w + x) * 4 + c] - t[(y * w + x - 1) * 4 + c] - t[(y * w + x + 1) * 4 + c];
                        dst[idx + c] = Math.max(0, Math.min(255, t[idx + c] + s * amt));
                    }
                }
            }
        }
        inst.ctx.putImageData(out, 0, 0);
    },

    commitAdjustments(id) {
        const inst = this._instances[id];
        if (!inst) return;
        inst.curData = inst.ctx.getImageData(0, 0, inst.canvas.width, inst.canvas.height);
        this._pushHist(id, 'Ajustes');
        this._resetSliders(id);
        inst.enhOn = false;
        inst.dotNetRef.invokeMethodAsync('OnEnhanceChanged', false);
    },

    // Crop
    startCrop(id) {
        const inst = this._instances[id];
        if (!inst) return;
        inst.cropMode = true;
        const ov = document.getElementById(inst.cropOvId);
        const sel = document.getElementById(inst.cropSelId);
        if (!ov || !sel) return;
        ov.classList.add('active');
        const r = ov.getBoundingClientRect();
        const mx = r.width * 0.1, my = r.height * 0.1;
        inst.cropRect = { x: mx, y: my, w: r.width - mx * 2, h: r.height - my * 2 };
        sel.classList.add('vis');
        this._updCropUI(id);

        let moveStart = null, moveRect = null;

        ov.onmousedown = e => {
            if (e.target.dataset.h) { inst.actHandle = e.target.dataset.h; inst.dragging = true; return; }
            const rr = ov.getBoundingClientRect();
            const px = e.clientX - rr.left, py = e.clientY - rr.top;
            const n = this._normCrop(inst.cropRect);
            if (px >= n.x && px <= n.x + n.w && py >= n.y && py <= n.y + n.h) {
                moveStart = { x: px, y: py };
                moveRect = { ...n };
                inst.dragging = true;
                ov.style.cursor = 'move';
                return;
            }
            inst.cropStart = { x: px, y: py };
            inst.cropRect = { x: px, y: py, w: 0, h: 0 };
            inst.dragging = true;
        };
        ov.onmousemove = e => {
            if (!inst.dragging) return;
            const rr = ov.getBoundingClientRect(), mx2 = e.clientX - rr.left, my2 = e.clientY - rr.top;
            if (moveStart) {
                const dx = mx2 - moveStart.x, dy = my2 - moveStart.y;
                inst.cropRect.x = Math.max(0, Math.min(rr.width - moveRect.w, moveRect.x + dx));
                inst.cropRect.y = Math.max(0, Math.min(rr.height - moveRect.h, moveRect.y + dy));
                inst.cropRect.w = moveRect.w;
                inst.cropRect.h = moveRect.h;
            } else if (inst.actHandle) {
                if (inst.actHandle.includes('r')) inst.cropRect.w = mx2 - inst.cropRect.x;
                if (inst.actHandle.includes('l')) { const d = mx2 - inst.cropRect.x; inst.cropRect.x = mx2; inst.cropRect.w -= d; }
                if (inst.actHandle.includes('b')) inst.cropRect.h = my2 - inst.cropRect.y;
                if (inst.actHandle.includes('t')) { const d = my2 - inst.cropRect.y; inst.cropRect.y = my2; inst.cropRect.h -= d; }
            } else if (inst.cropStart) {
                inst.cropRect.w = mx2 - inst.cropStart.x;
                inst.cropRect.h = my2 - inst.cropStart.y;
            }
            this._updCropUI(id);
        };
        ov.onmouseup = () => { inst.dragging = false; inst.actHandle = null; moveStart = null; moveRect = null; ov.style.cursor = 'crosshair'; };
    },

    _updCropUI(id) {
        const inst = this._instances[id];
        if (!inst || !inst.cropRect) return;
        const sel = document.getElementById(inst.cropSelId);
        const dimEl = document.getElementById(inst.cropDimId);
        const n = this._normCrop(inst.cropRect);
        sel.style.left = n.x + 'px';
        sel.style.top = n.y + 'px';
        sel.style.width = n.w + 'px';
        sel.style.height = n.h + 'px';
        const ov = document.getElementById(inst.cropOvId).getBoundingClientRect();
        const pw = Math.round(n.w * inst.canvas.width / ov.width);
        const ph = Math.round(n.h * inst.canvas.height / ov.height);
        if (dimEl) dimEl.textContent = pw + '\u00d7' + ph;
    },

    _normCrop(r) {
        return { x: r.w < 0 ? r.x + r.w : r.x, y: r.h < 0 ? r.y + r.h : r.y, w: Math.abs(r.w), h: Math.abs(r.h) };
    },

    applyCrop(id) {
        const inst = this._instances[id];
        if (!inst || !inst.cropRect) return;
        const ov = document.getElementById(inst.cropOvId).getBoundingClientRect();
        const n = this._normCrop(inst.cropRect);
        const sx = Math.round(n.x * inst.canvas.width / ov.width);
        const sy = Math.round(n.y * inst.canvas.height / ov.height);
        const sw = Math.round(n.w * inst.canvas.width / ov.width);
        const sh = Math.round(n.h * inst.canvas.height / ov.height);
        if (sw < 2 || sh < 2) return;
        const cr = inst.ctx.getImageData(sx, sy, sw, sh);
        inst.canvas.width = sw;
        inst.canvas.height = sh;
        inst.ctx.putImageData(cr, 0, 0);
        inst.curData = cr;
        this._pushHist(id, 'Recorte ' + sw + '\u00d7' + sh);
        this._cleanupCrop(id);
        inst.cropMode = false;
        inst.dotNetRef.invokeMethodAsync('OnCropModeChanged', false);
        inst.dotNetRef.invokeMethodAsync('OnImageInfoChanged', sw, sh);
    },

    cancelCrop(id) {
        const inst = this._instances[id];
        if (!inst) return;
        this._cleanupCrop(id);
        inst.cropMode = false;
        inst.dotNetRef.invokeMethodAsync('OnCropModeChanged', false);
    },

    _cleanupCrop(id) {
        const inst = this._instances[id];
        inst.cropRect = null;
        inst.dragging = false;
        inst.actHandle = null;
        inst.cropStart = null;
        const sel = document.getElementById(inst.cropSelId);
        const ov = document.getElementById(inst.cropOvId);
        if (sel) sel.classList.remove('vis');
        if (ov) { ov.classList.remove('active'); ov.onmousedown = null; ov.onmousemove = null; ov.onmouseup = null; }
    },

    // Rotate
    rotate(id, deg) {
        const inst = this._instances[id];
        if (!inst) return;
        const w = inst.canvas.width, h = inst.canvas.height;
        const d = inst.ctx.getImageData(0, 0, w, h);
        const tc = document.createElement('canvas');
        tc.width = w;
        tc.height = h;
        tc.getContext('2d').putImageData(d, 0, 0);
        if (Math.abs(deg) === 90) { inst.canvas.width = h; inst.canvas.height = w; }
        inst.ctx.clearRect(0, 0, inst.canvas.width, inst.canvas.height);
        inst.ctx.save();
        inst.ctx.translate(inst.canvas.width / 2, inst.canvas.height / 2);
        inst.ctx.rotate(deg * Math.PI / 180);
        inst.ctx.drawImage(tc, -w / 2, -h / 2);
        inst.ctx.restore();
        inst.curData = inst.ctx.getImageData(0, 0, inst.canvas.width, inst.canvas.height);
        this._pushHist(id, 'Rotar ' + deg + '\u00b0');
        this._resetSliders(id);
        inst.dotNetRef.invokeMethodAsync('OnImageInfoChanged', inst.canvas.width, inst.canvas.height);
    },

    // Flip
    flip(id, dir) {
        const inst = this._instances[id];
        if (!inst) return;
        const w = inst.canvas.width, h = inst.canvas.height;
        const d = inst.ctx.getImageData(0, 0, w, h);
        const tc = document.createElement('canvas');
        tc.width = w;
        tc.height = h;
        tc.getContext('2d').putImageData(d, 0, 0);
        inst.ctx.clearRect(0, 0, w, h);
        inst.ctx.save();
        if (dir === 'h') { inst.ctx.translate(w, 0); inst.ctx.scale(-1, 1); }
        else { inst.ctx.translate(0, h); inst.ctx.scale(1, -1); }
        inst.ctx.drawImage(tc, 0, 0);
        inst.ctx.restore();
        inst.curData = inst.ctx.getImageData(0, 0, w, h);
        this._pushHist(id, dir === 'h' ? 'Volteo H' : 'Volteo V');
        this._resetSliders(id);
    },

    // Reset
    resetAll(id) {
        const inst = this._instances[id];
        if (!inst || !inst.origImg) return;
        inst.canvas.width = inst.origImg.width;
        inst.canvas.height = inst.origImg.height;
        inst.ctx.drawImage(inst.origImg, 0, 0);
        inst.curData = inst.ctx.getImageData(0, 0, inst.canvas.width, inst.canvas.height);
        this._resetSliders(id);
        inst.enhOn = false;
        this._pushHist(id, 'Restaurada');
        inst.dotNetRef.invokeMethodAsync('OnImageInfoChanged', inst.canvas.width, inst.canvas.height);
        inst.dotNetRef.invokeMethodAsync('OnEnhanceChanged', false);
    },

    // Result
    getImageAsBase64(id) {
        const inst = this._instances[id];
        if (!inst) return null;
        return inst.canvas.toDataURL('image/png');
    },

    /** Upload current canvas directly to S3 via presign. Returns { getUrl, fileName } without sending image data through SignalR. */
    async uploadToS3(id, signEndpoint) {
        const inst = this._instances[id];
        if (!inst) return null;
        const blob = await new Promise(resolve => inst.canvas.toBlob(resolve, 'image/png'));
        if (!blob) return null;
        const signRes = await fetch(signEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: 'edited.png', fileType: 'image/png', size: blob.size }) });
        if (!signRes.ok) throw new Error('Presign failed: ' + await signRes.text());
        const signData = await signRes.json();
        const putRes = await fetch(signData.putUrl, { method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: blob });
        if (!putRes.ok) throw new Error('S3 upload failed: ' + putRes.status);
        return { getUrl: signData.getUrl, fileName: signData.fileName };
    },

    // Cleanup
    dispose(id) {
        const inst = this._instances[id];
        if (!inst) return;
        if (inst._onKeyDown) document.removeEventListener('keydown', inst._onKeyDown);
        const area = document.getElementById(inst.canvasAreaId);
        if (area) {
            if (inst._onDragOver) area.removeEventListener('dragover', inst._onDragOver);
            if (inst._onDrop) area.removeEventListener('drop', inst._onDrop);
        }
        this._cleanupCrop(id);
        if (inst.fileInput) inst.fileInput.remove();
        inst.hist = [];
        inst.curData = null;
        inst.origImg = null;
        delete this._instances[id];
    }
};
