import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Library = () => {
    const [editions, setEditions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEditions = async () => {
            try {
                // Use VITE_API_URL or fallback
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
                const res = await axios.get(`${apiUrl}/editions`);
                setEditions(res.data);
            } catch (err) {
                console.error("Failed to fetch editions", err);
            } finally {
                setLoading(false);
            }
        };

        fetchEditions();
    }, []);

    if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Cargando Biblioteca...</div>;

    return (
        <div style={styles.gridContainer}>
            <h2 style={styles.title}>Últimas Ediciones</h2>
            <div style={styles.grid}>
                {editions.map(edition => (
                    <Link to={`/visor/${edition.id}`} key={edition.id} style={styles.card}>
                        <div style={styles.coverWrapper}>
                            {/* Placeholder cover if none provided */}
                            <img
                                src={edition.cover_url || "https://via.placeholder.com/300x400?text=Diario+El+Dia"}
                                alt={edition.title}
                                style={styles.cover}
                            />
                        </div>
                        <div style={styles.info}>
                            <h3 style={styles.editionTitle}>{edition.title}</h3>
                            <p style={styles.date}>{new Date(edition.edition_date).toLocaleDateString()}</p>
                        </div>
                    </Link>
                ))}
                {editions.length === 0 && (
                    <p>No hay ediciones disponibles.</p>
                )}
            </div>
        </div>
    );
};

const styles = {
    gridContainer: {
        maxWidth: '1200px',
        margin: '80px auto 20px', // Top margin for navbar
        padding: '20px'
    },
    title: {
        marginBottom: '20px',
        color: '#333',
        borderBottom: '2px solid #0047BA',
        display: 'inline-block',
        paddingBottom: '5px'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '30px'
    },
    card: {
        textDecoration: 'none',
        color: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: 'transform 0.2s',
        cursor: 'pointer'
    },
    coverWrapper: {
        width: '100%',
        aspectRatio: '0.7',
        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
        borderRadius: '4px',
        overflow: 'hidden',
        background: '#eee'
    },
    cover: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    info: {
        marginTop: '10px',
        textAlign: 'center'
    },
    editionTitle: {
        fontSize: '1rem',
        margin: '5px 0',
        color: '#0047BA'
    },
    date: {
        fontSize: '0.8rem',
        color: '#666'
    }
};

export default Library;
