/**
 * DinaZen - Uppy-based presigned upload (headless, no Dashboard UI).
 * Wraps Uppy + AwsS3 plugin for Blazor interop.
 */

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

    // Notify C# on each file upload success
    uppy.on('upload-success', async (file) => {
        if (!file?.meta?.getUrl) return;
        try {
            await dotNetRef.invokeMethodAsync('JsFileUploaded', {
                fileName: file.meta.serverFileName || file.name,
                url: file.meta.getUrl
            });
        } catch (e) {
            console.error('DinaZen Upload: error calling JsFileUploaded', e);
        }
    });

    // Notify C# when all uploads complete
    uppy.on('complete', async (result) => {
        const successful = (result.successful || []).map(f => ({
            fileName: f.meta.serverFileName || f.name,
            url: f.meta.getUrl || ''
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
    fileInput.addEventListener('change', () => {
        const files = fileInput.files;
        if (!files || files.length === 0) return;

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
 * Destroy a headless button-mode Uppy instance.
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
