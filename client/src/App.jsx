import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './App.css';

function App() {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error'

    const onDrop = useCallback(acceptedFiles => {
        if (files.length + acceptedFiles.length > 10) {
            alert("Solo puedes subir un máximo de 10 fotos.");
            return;
        }
        setFiles(prev => [...prev, ...acceptedFiles]);
    }, [files]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 10
    });

    const removeFile = (file) => {
        setFiles(files.filter(f => f !== file));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setUploading(true);
        setUploadStatus(null);

        const formData = new FormData();
        files.forEach(file => {
            formData.append('photos', file);
        });

        try {
            await axios.post('/upload', formData);
            setUploadStatus('success');
            setFiles([]);
        } catch (error) {
            console.error("Upload error", error);
            setUploadStatus('error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="app-container">
            <header>
                <h1>Nuestra Boda</h1>
                <p>Comparte tus momentos favoritos con nosotros</p>
            </header>

            <main>
                {uploadStatus === 'success' && (
                    <div className="success-message">
                        ¡Gracias! Tus fotos se han subido correctamente.
                    </div>
                )}

                {uploadStatus === 'error' && (
                    <div className="error-message">
                        Hubo un error al subir las fotos. Inténtalo de nuevo.
                    </div>
                )}

                <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                    <input {...getInputProps()} />
                    {isDragActive ?
                        <p>Suelta las fotos aquí...</p> :
                        <p>Arrastra y suelta tus fotos aquí, o haz clic para seleccionar</p>
                    }
                    <small>(Máximo 10 fotos)</small>
                </div>

                {files.length > 0 && (
                    <div className="file-list">
                        <h3>Fotos seleccionadas ({files.length}/10):</h3>
                        <ul>
                            {files.map((file, index) => (
                                <li key={index}>
                                    {file.name}
                                    <button onClick={() => removeFile(file)} className="remove-btn">X</button>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="upload-btn"
                        >
                            {uploading ? 'Subiendo...' : 'Subir Fotos'}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
