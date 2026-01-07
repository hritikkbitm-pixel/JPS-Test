import { useState, useCallback } from 'react';

function App() {
    const [files, setFiles] = useState([]);
    const [settings, setSettings] = useState({
        outputFormat: 'webp',
        width: '',
        height: '',
        quality: 80,
        fitMode: 'contain',
        background: '#ffffff',
        upscale: true
    });
    const [processing, setProcessing] = useState(false);
    const [processedFiles, setProcessedFiles] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('image/')
        );

        if (droppedFiles.length > 0) {
            uploadFiles(droppedFiles);
        }
    }, []);

    const handleFileInput = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length > 0) {
            uploadFiles(selectedFiles);
        }
    };

    const uploadFiles = async (fileList) => {
        const formData = new FormData();
        fileList.forEach(file => {
            formData.append('images', file);
        });

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                setFiles(prev => [...prev, ...data.files]);
                setProcessedFiles([]);
                setSessionId(null);
            }
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };

    const processImages = async () => {
        if (files.length === 0) return;

        setProcessing(true);
        setProgress({ current: 0, total: files.length });

        try {
            const response = await fetch('/api/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files, settings })
            });

            const data = await response.json();

            if (data.success) {
                setSessionId(data.sessionId);
                setProcessedFiles(data.files);
                setProgress({ current: files.length, total: files.length });

                // Automatically trigger download after a short delay to ensure state is updated
                setTimeout(() => {
                    const link = document.createElement('a');
                    link.href = `/api/download-all/${data.sessionId}`;
                    link.setAttribute('download', '');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }, 500);
            }
        } catch (error) {
            console.error('Processing failed:', error);
        } finally {
            setProcessing(false);
        }
    };

    const downloadAll = () => {
        if (!sessionId) return;
        window.location.href = `/api/download-all/${sessionId}`;
    };

    const downloadSingle = (filename) => {
        if (!sessionId) return;
        window.location.href = `/api/download/${sessionId}/${filename}`;
    };

    const removeFile = (id) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const clearAll = () => {
        setFiles([]);
        setProcessedFiles([]);
        setSessionId(null);
        setProgress({ current: 0, total: 0 });
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <div className="app">
            <header className="header">
                <div className="logo">
                    <span className="logo-icon">🖼️</span>
                    <h1>Bulk Image Converter</h1>
                </div>
                <p className="tagline">Convert, resize, and optimize your images in bulk</p>
            </header>

            <main className="main-content">
                <div className="left-panel">
                    {/* Upload Zone */}
                    <div
                        className={`upload-zone ${dragActive ? 'active' : ''} ${files.length > 0 ? 'has-files' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            id="file-input"
                            multiple
                            accept="image/*"
                            onChange={handleFileInput}
                            className="file-input"
                        />
                        <label htmlFor="file-input" className="upload-label">
                            <div className="upload-icon">📁</div>
                            <p className="upload-text">
                                {dragActive ? 'Drop images here' : 'Drag & drop images or click to browse'}
                            </p>
                            <p className="upload-hint">Supports JPEG, PNG, WebP, GIF, TIFF, AVIF, BMP, SVG</p>
                        </label>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="file-list">
                            <div className="file-list-header">
                                <h3>📋 {files.length} Image{files.length > 1 ? 's' : ''} Selected</h3>
                                <button className="btn-clear" onClick={clearAll}>Clear All</button>
                            </div>
                            <div className="files-grid">
                                {files.map(file => (
                                    <div key={file.id} className="file-card">
                                        <div className="file-info">
                                            <span className="file-name" title={file.originalName}>
                                                {file.originalName}
                                            </span>
                                            <span className="file-meta">
                                                {file.width}×{file.height} • {formatSize(file.size)}
                                            </span>
                                        </div>
                                        <button
                                            className="btn-remove"
                                            onClick={() => removeFile(file.id)}
                                            title="Remove"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Processed Results */}
                    {processedFiles.length > 0 && (
                        <div className="results-section">
                            <div className="results-header">
                                <h3>✅ Processed Images</h3>
                                <button className="btn-download-all" onClick={downloadAll}>
                                    📦 Download All (ZIP)
                                </button>
                            </div>
                            <div className="results-grid">
                                {processedFiles.map(file => (
                                    <div key={file.id} className="result-card">
                                        <div className="result-info">
                                            <span className="result-name">{file.processedName}</span>
                                            <div className="result-stats">
                                                <span className="stat">
                                                    {file.processedDimensions.width}×{file.processedDimensions.height}
                                                </span>
                                                <span className={`stat ${file.processedSize < file.originalSize ? 'savings' : 'increase'}`}>
                                                    {formatSize(file.processedSize)}
                                                    {file.originalSize !== file.processedSize && (
                                                        <span className="size-diff">
                                                            ({file.processedSize < file.originalSize ? '-' : '+'}
                                                            {Math.abs(Math.round((1 - file.processedSize / file.originalSize) * 100))}%)
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            className="btn-download-single"
                                            onClick={() => downloadSingle(file.processedName)}
                                        >
                                            ⬇️
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Settings Panel */}
                <div className="settings-panel">
                    <h2>⚙️ Settings</h2>

                    <div className="setting-group">
                        <label>Output Format</label>
                        <select
                            value={settings.outputFormat}
                            onChange={(e) => setSettings({ ...settings, outputFormat: e.target.value })}
                        >
                            <option value="webp">WebP (Recommended)</option>
                            <option value="jpeg">JPEG</option>
                            <option value="png">PNG</option>
                            <option value="avif">AVIF</option>
                            <option value="tiff">TIFF</option>
                            <option value="gif">GIF</option>
                        </select>
                    </div>

                    <div className="setting-group">
                        <label>Dimensions (leave empty to keep original)</label>
                        <div className="dimension-inputs">
                            <input
                                type="number"
                                placeholder="Width"
                                value={settings.width}
                                onChange={(e) => setSettings({ ...settings, width: e.target.value })}
                            />
                            <span className="dimension-separator">×</span>
                            <input
                                type="number"
                                placeholder="Height"
                                value={settings.height}
                                onChange={(e) => setSettings({ ...settings, height: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="setting-group">
                        <label>Fit Mode</label>
                        <select
                            value={settings.fitMode}
                            onChange={(e) => setSettings({ ...settings, fitMode: e.target.value })}
                        >
                            <option value="contain">Fit with Padding (no crop)</option>
                            <option value="cover">Cover (may crop)</option>
                            <option value="fill">Stretch to Fill</option>
                            <option value="inside">Fit Inside (no upscale)</option>
                            <option value="outside">Fit Outside (may enlarge)</option>
                        </select>
                    </div>

                    {settings.fitMode === 'contain' && (
                        <div className="setting-group">
                            <label>Padding Color</label>
                            <div className="color-input-wrapper">
                                <input
                                    type="color"
                                    value={settings.background}
                                    onChange={(e) => setSettings({ ...settings, background: e.target.value })}
                                />
                                <input
                                    type="text"
                                    value={settings.background}
                                    onChange={(e) => setSettings({ ...settings, background: e.target.value })}
                                    className="color-text"
                                />
                            </div>
                        </div>
                    )}

                    <div className="setting-group">
                        <label>Quality: {settings.quality}%</label>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={settings.quality}
                            onChange={(e) => setSettings({ ...settings, quality: parseInt(e.target.value) })}
                            className="quality-slider"
                        />
                        <div className="quality-labels">
                            <span>Low</span>
                            <span>High</span>
                        </div>
                    </div>

                    <div className="setting-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={settings.upscale}
                                onChange={(e) => setSettings({ ...settings, upscale: e.target.checked })}
                            />
                            <span>Allow Upscaling</span>
                        </label>
                        <p className="setting-hint">Enable to enlarge images smaller than target dimensions</p>
                    </div>

                    <button
                        className={`btn-process ${processing ? 'processing' : ''}`}
                        onClick={processImages}
                        disabled={files.length === 0 || processing}
                    >
                        {processing ? (
                            <>
                                <span className="spinner"></span>
                                Processing...
                            </>
                        ) : (
                            <>🚀 Convert {files.length} Image{files.length !== 1 ? 's' : ''}</>
                        )}
                    </button>
                </div>
            </main>

            <footer className="footer">
                <p>Bulk Image Converter • Local Processing • Your images never leave your computer</p>
            </footer>
        </div>
    );
}

export default App;
