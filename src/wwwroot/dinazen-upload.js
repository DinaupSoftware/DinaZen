/**
 * DinaZen - Uppy-based presigned upload (headless, no Dashboard UI).
 * Wraps Uppy + AwsS3 plugin for Blazor interop.
 */

/** Compute SHA-1 hex digest of a File/Blob using WebCrypto. */
async function _dnzSha1File(file) {
    const buf = await file.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-1', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** @type {Map<string, {uppy: any, fileInput: HTMLInputElement}>} */
const _instances = new Map();

/**
 * Initialize a headless Uppy instance for button-mode uploaders.
 * No Dashboard UI — uses a hidden <input type="file"> triggered by clicking the selector element.
 * @param {string} selector - CSS selector for the trigger element (e.g. "#dnz-fbtn-abc123")
 * @param {object} dotNetRef - DotNetObjectReference for callbacks to C#
 * @param {object} options
 * @param {string} options.signEndpoint - Presign endpoint URL
 * @param {string[]} options.allowedExtensions - e.g. [".jpg", ".png"]
 * @param {number} options.maxFileSize - Max size in bytes
 * @param {number} options.maxFiles - Max number of files
 * @returns {string} Instance ID for later cleanup
 */
window.dnzUppy_initButton = function (selector, dotNetRef, options) {
    const triggerEl = document.querySelector(selector);
    if (!triggerEl) {
        console.error(`DinaZen Upload: element "${selector}" not found`);
        return null;
    }

    const opts = options || {};
    const signEndpoint = opts.signEndpoint || '/file/upload/sign';
    const maxFileSize = opts.maxFileSize || (100 * 1024 * 1024);
    const maxFiles = opts.maxFiles || 1000;
    const allowedExts = (opts.allowedExtensions && opts.allowedExtensions.length > 0)
        ? opts.allowedExtensions.map(ext => ext.startsWith('.') ? ext.toLowerCase() : '.' + ext.toLowerCase())
        : null;

    // Create hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = maxFiles > 1;
    fileInput.style.display = 'none';
    if (allowedExts) {
        fileInput.accept = allowedExts.join(',');
    }
    document.body.appendChild(fileInput);

    // Create Uppy instance without Dashboard
    const uppy = new Uppy.Uppy({
        autoProceed: true,
        restrictions: {
            maxFileSize: maxFileSize,
            maxNumberOfFiles: maxFiles,
            allowedFileTypes: allowedExts
        }
    });

    uppy.use(Uppy.AwsS3, {
        limit: 1,
        shouldUseMultipart: false,
        async getUploadParameters(file) {
            const res = await fetch(signEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type || 'application/octet-stream',
                    size: file.size
                })
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error('Error en sign endpoint: ' + errText);
            }
            const data = await res.json();
            file.meta.getUrl = data.getUrl;
            file.meta.serverFileName = data.fileName;
            return {
                method: 'PUT',
                url: data.putUrl,
                headers: { 'Content-Type': file.type || 'application/octet-stream' }
            };
        }
    });

    // Compute SHA-1 when file is added (before upload starts)
    uppy.on('file-added', async (file) => {
        try {
            file.meta.sha1 = await _dnzSha1File(file.data);
        } catch (e) {
            console.error('DinaZen Upload: SHA-1 error', e);
            file.meta.sha1 = '';
        }
    });

    // Per-file progress → compute overall % and notify C#
    let totalSize = 0;
    const fileProgress = {};

    uppy.on('upload-start', (files) => {
        totalSize = 0;
        for (const f of files) {
            totalSize += f.size || 0;
            fileProgress[f.id] = 0;
        }
    });

    uppy.on('upload-progress', (file, progress) => {
        if (!file) return;
        fileProgress[file.id] = progress.bytesUploaded || 0;
        let uploaded = 0;
        for (const id in fileProgress) uploaded += fileProgress[id];
        const pct = totalSize > 0 ? Math.round(uploaded / totalSize * 100) : 0;
        try {
            dotNetRef.invokeMethodAsync('JsUploadProgress', pct);
        } catch (_) { }
    });

    // Notify C# on each file upload success
    uppy.on('upload-success', async (file) => {
        if (!file?.meta?.getUrl) return;
        try {
            await dotNetRef.invokeMethodAsync('JsFileUploaded', {
                fileName: file.meta.serverFileName || file.name,
                url: file.meta.getUrl,
                sha1: file.meta.sha1 || ''
            });
        } catch (e) {
            console.error('DinaZen Upload: error calling JsFileUploaded', e);
        }
    });

    // Notify C# when all uploads complete
    uppy.on('complete', async (result) => {
        const successful = (result.successful || []).map(f => ({
            fileName: f.meta.serverFileName || f.name,
            url: f.meta.getUrl || '',
            sha1: f.meta.sha1 || ''
        }));
        try {
            await dotNetRef.invokeMethodAsync('JsAllUploadsComplete', successful);
        } catch (e) {
            console.error('DinaZen Upload: error calling JsAllUploadsComplete', e);
        }
        // Reset input so same file can be re-selected
        fileInput.value = '';
    });

    // Log errors
    uppy.on('upload-error', (file, error) => {
        console.error('DinaZen Upload error:', file?.name, error);
        try {
            dotNetRef.invokeMethodAsync('JsUploadError', file?.name || 'unknown', error?.message || 'Error desconocido');
        } catch (_) { }
    });

    // When files selected via input, add them to Uppy
    const editImages = opts.editImagesBeforeUpload && maxFiles === 1;

    fileInput.addEventListener('change', () => {
        const files = fileInput.files;
        if (!files || files.length === 0) return;

        // If editImages is on and the file is an image, upload to S3 first then send URL to C# (no base64 over SignalR)
        if (editImages && files.length === 1 && files[0].type && files[0].type.startsWith('image/')) {
            const file = files[0];
            (async () => {
                try {
                    const signRes = await fetch(signEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: file.name, fileType: file.type, size: file.size }) });
                    if (!signRes.ok) throw new Error('Presign failed: ' + await signRes.text());
                    const signData = await signRes.json();
                    const putRes = await fetch(signData.putUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
                    if (!putRes.ok) throw new Error('S3 upload failed: ' + putRes.status);
                    dotNetRef.invokeMethodAsync('JsImageFileSelected', signData.getUrl, file.name, file.type);
                } catch (e) {
                    console.error('DinaZen Upload: error uploading for edit', e);
                    try { dotNetRef.invokeMethodAsync('JsUploadError', file.name, e.message || 'Error uploading for edit'); } catch (_) { }
                }
            })();
            fileInput.value = '';
            return;
        }

        // Notify C# that upload is starting
        try {
            dotNetRef.invokeMethodAsync('JsUploadStarted');
        } catch (_) { }

        let added = 0;
        for (let i = 0; i < files.length; i++) {
            try {
                uppy.addFile({
                    name: files[i].name,
                    type: files[i].type,
                    data: files[i],
                    source: 'file input'
                });
                added++;
            } catch (err) {
                console.error('DinaZen Upload: error adding file', err);
                try {
                    dotNetRef.invokeMethodAsync('JsUploadError', files[i].name, err.message || 'Error adding file');
                } catch (_) { }
            }
        }

        // If no files were added successfully, cancel busy state
        if (added === 0) {
            try {
                dotNetRef.invokeMethodAsync('JsUploadCancelled');
            } catch (_) { }
        }
    });

    // Click trigger opens file picker
    triggerEl.addEventListener('click', () => {
        fileInput.click();
    });

    // Store for cleanup
    _instances.set(selector, { uppy, fileInput });
    return selector;
};

/**
 * Initialize an Uppy instance with the Dashboard modal UI.
 * The trigger element opens the modal on click. Dashboard handles drag & drop, progress, etc.
 */
window.dnzUppy_initDashboard = function (selector, dotNetRef, options) {
    const triggerEl = document.querySelector(selector);
    if (!triggerEl) {
        console.error(`DinaZen Upload: element "${selector}" not found`);
        return null;
    }

    const opts = options || {};
    const signEndpoint = opts.signEndpoint || '/file/upload/sign';
    const maxFileSize = opts.maxFileSize || (100 * 1024 * 1024);
    const maxFiles = opts.maxFiles || 1000;
    const allowedExts = (opts.allowedExtensions && opts.allowedExtensions.length > 0)
        ? opts.allowedExtensions.map(ext => ext.startsWith('.') ? ext.toLowerCase() : '.' + ext.toLowerCase())
        : null;

    const uppy = new Uppy.Uppy({
        autoProceed: true,
        restrictions: {
            maxFileSize: maxFileSize,
            maxNumberOfFiles: maxFiles,
            allowedFileTypes: allowedExts
        }
    });

    uppy.use(Uppy.Dashboard, {
        inline: false,
        target: document.body,
        trigger: selector,
        showProgressDetails: true,
        proudlyDisplayPoweredByUppy: false,
        closeModalOnClickOutside: true,
        closeAfterFinish: false,
        showAddMoreFilesBtn: true,
        showCancelButton: true,
        locale: {
            strings: {
                dropPasteFiles: 'Suelta archivos aquí o %{browse}',
                browse: 'haz clic para seleccionarlos',
                cancel: 'Cancelar',
                done: 'Hecho',
                addMoreFiles: 'Añadir más',
                uploading: 'Subiendo…',
                complete: 'Completado',
                uploadFailed: 'La subida falló',
                retry: 'Reintentar',
                removeFile: 'Eliminar',
                filesUploadedOfTotal: {
                    0: '%{complete} de %{smart_count} archivo subido',
                    1: '%{complete} de %{smart_count} archivos subidos'
                },
                dataUploadedOfTotal: '%{complete} de %{total}',
                xTimeLeft: '%{time} restantes',
                exceedsSize: 'El archivo supera el tamaño máximo permitido'
            }
        }
    });

    uppy.use(Uppy.AwsS3, {
        limit: 1,
        shouldUseMultipart: false,
        async getUploadParameters(file) {
            const res = await fetch(signEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type || 'application/octet-stream',
                    size: file.size
                })
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error('Error en sign endpoint: ' + errText);
            }
            const data = await res.json();
            file.meta.getUrl = data.getUrl;
            file.meta.serverFileName = data.fileName;
            return {
                method: 'PUT',
                url: data.putUrl,
                headers: { 'Content-Type': file.type || 'application/octet-stream' }
            };
        }
    });

    uppy.on('file-added', async (file) => {
        try {
            file.meta.sha1 = await _dnzSha1File(file.data);
        } catch (e) {
            console.error('DinaZen Upload: SHA-1 error', e);
            file.meta.sha1 = '';
        }
    });

    uppy.on('upload-success', async (file) => {
        if (!file?.meta?.getUrl) return;
        try {
            await dotNetRef.invokeMethodAsync('JsFileUploaded', {
                fileName: file.meta.serverFileName || file.name,
                url: file.meta.getUrl,
                sha1: file.meta.sha1 || ''
            });
        } catch (e) {
            console.error('DinaZen Upload: error calling JsFileUploaded', e);
        }
    });

    uppy.on('complete', async (result) => {
        const successful = (result.successful || []).map(f => ({
            fileName: f.meta.serverFileName || f.name,
            url: f.meta.getUrl || '',
            sha1: f.meta.sha1 || ''
        }));
        try {
            await dotNetRef.invokeMethodAsync('JsAllUploadsComplete', successful);
        } catch (e) {
            console.error('DinaZen Upload: error calling JsAllUploadsComplete', e);
        }
    });

    uppy.on('upload-error', (file, error) => {
        console.error('DinaZen Upload error:', file?.name, error);
        try {
            dotNetRef.invokeMethodAsync('JsUploadError', file?.name || 'unknown', error?.message || 'Error desconocido');
        } catch (_) { }
    });

    _instances.set(selector, { uppy, fileInput: null });
    return selector;
};

/**
 * Replace file data with edited image and trigger upload.
 * Called from C# after the image editor dialog returns.
 */
window.dnzUppy_uploadEditedImage = function (selector, base64, mimeType, fileName) {
    const instance = _instances.get(selector);
    if (!instance || !instance.uppy) return;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType || 'image/png' });
    try {
        instance.uppy.addFile({ name: fileName || 'edited.png', type: mimeType || 'image/png', data: blob, source: 'image-editor' });
    } catch (e) { console.error('DinaZen Upload: error adding edited file', e); }
};

/**
 * Destroy an Uppy instance (works for both button and dashboard mode).
 * @param {string} selector
 */
window.dnzUppy_destroyButton = function (selector) {
    const instance = _instances.get(selector);
    if (instance) {
        try {
            if (instance.uppy) instance.uppy.destroy();
            if (instance.fileInput && instance.fileInput.parentNode) {
                instance.fileInput.parentNode.removeChild(instance.fileInput);
            }
        } catch (_) { }
        _instances.delete(selector);
    }
};
