import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Flipbook from './Flipbook';

const ViewerPage = () => {
    const { id } = useParams();
    const [pdfUrl, setPdfUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEdition = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
                const res = await axios.get(`${apiUrl}/editions/${id}`);
                setPdfUrl(res.data.pdf_url);
            } catch (err) {
                console.error("Error loading edition", err);
                setError("No se pudo cargar la edición.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchEdition();
        } else {
            // Fallback for dev/legacy URLs
            setPdfUrl('/sample.pdf');
            setLoading(false);
        }
    }, [id]);

    if (loading) return <div className="loading-screen">Cargando...</div>;
    if (error) return <div className="error-screen">{error}</div>;

    return (
        <div style={{ height: 'calc(100vh - 70px)', width: '100vw', overflow: 'hidden', marginTop: '70px' }}>
            {pdfUrl && <Flipbook pdfUrl={pdfUrl} />}
        </div>
    );
};

export default ViewerPage;
