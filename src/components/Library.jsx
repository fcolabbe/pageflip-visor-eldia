import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Library = () => {
    const [editions, setEditions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({});

    useEffect(() => {
        const fetchEditions = async () => {
            setLoading(true);
            try {
                // Use VITE_API_URL or fallback
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
                const res = await axios.get(`${apiUrl}/editions`, {
                    params: { page, limit: 12 }
                });

                // New response structure: { data: [], meta: {} }
                if (res.data.data) {
                    setEditions(res.data.data);
                    setMeta(res.data.meta);
                } else {
                    setEditions(res.data); // Fallback if API hasn't updated yet?
                }

                window.scrollTo(0, 0);
            } catch (err) {
                console.error("Failed to fetch editions", err);
            } finally {
                setLoading(false);
            }
        };

        fetchEditions();
    }, [page]);

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
                    <p style={{ textAlign: 'center', width: '100%', color: '#666' }}>No hay ediciones disponibles.</p>
                )}
            </div>

            {/* Pagination Controls */}
            <div style={styles.pagination}>
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    style={{ ...styles.pageBtn, opacity: page === 1 ? 0.5 : 1 }}
                >
                    &larr; Anterior
                </button>
                <span style={styles.pageInfo}>Página {page} de {meta.totalPages || 1}</span>
                <button
                    disabled={page >= (meta.totalPages || 1)}
                    onClick={() => setPage(p => p + 1)}
                    style={{ ...styles.pageBtn, opacity: page >= (meta.totalPages || 1) ? 0.5 : 1 }}
                >
                    Siguiente &rarr;
                </button>
            </div>
        </div>
    );
};

const styles = {
    gridContainer: {
        maxWidth: '1200px',
        margin: '90px auto 40px', // Adjusted top margin
        padding: '20px',
        minHeight: '80vh' // Ensure it takes space
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
        aspectRatio: '0.707', // ISO A4 Ratio approx
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
        color: '#0047BA',
        fontWeight: '600'
    },
    date: {
        fontSize: '0.8rem',
        color: '#666'
    },
    pagination: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '40px',
        gap: '20px'
    },
    pageBtn: {
        padding: '10px 20px',
        background: '#0047BA',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: 'bold'
    },
    pageInfo: {
        fontSize: '1rem',
        color: '#333',
        fontWeight: '500'
    }
};

export default Library;
