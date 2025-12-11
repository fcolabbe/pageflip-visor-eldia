import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Library = () => {
    const [editions, setEditions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({});
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        const fetchEditions = async () => {
            setLoading(true);
            try {
                // Use VITE_API_URL or fallback
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
                const params = { page, limit: 15 };
                if (dateFilter) params.date = dateFilter;

                const res = await axios.get(`${apiUrl}/editions`, { params });

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
    }, [page, dateFilter]);

    const handleDateChange = (e) => {
        setDateFilter(e.target.value);
        setPage(1); // Reset to page 1 on filter change
    };

    // Helper to format date correcting timezone offset
    // Should display the date as stored in DB (YYYY-MM-DD)
    const formatDate = (dateString) => {
        if (!dateString) return '';
        // Append T12:00:00 to ensure it falls in the middle of the day for local time conversion
        // Or simply split string parts to avoid timezone conversion entirely
        const [y, m, d] = dateString.split('T')[0].split('-');
        return `${d}/${m}/${y}`;
    };

    // Pagination Logic
    const renderPagination = () => {
        const totalPages = meta.totalPages || 1;
        if (totalPages <= 1) return null;

        const pages = [];
        // Simple logic: Show all if small, or range around current
        // For simplicity, let's show max 5 pages around current
        let start = Math.max(1, page - 2);
        let end = Math.min(totalPages, page + 2);

        if (start > 1) pages.push(1);
        if (start > 2) pages.push('...');

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < totalPages - 1) pages.push('...');
        if (end < totalPages) pages.push(totalPages);

        return (
            <div style={styles.pagination}>
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    style={{ ...styles.pageBtn, opacity: page === 1 ? 0.5 : 1 }}
                >
                    &larr;
                </button>

                {pages.map((p, idx) => (
                    <button
                        key={idx}
                        onClick={() => typeof p === 'number' && setPage(p)}
                        style={{
                            ...styles.pageBtn,
                            background: p === page ? '#0047BA' : '#f0f0f0',
                            color: p === page ? 'white' : '#333',
                            cursor: typeof p === 'number' ? 'pointer' : 'default'
                        }}
                        disabled={typeof p !== 'number'}
                    >
                        {p}
                    </button>
                ))}

                <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    style={{ ...styles.pageBtn, opacity: page >= totalPages ? 0.5 : 1 }}
                >
                    &rarr;
                </button>
            </div>
        );
    };

    if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Cargando Biblioteca...</div>;

    return (
        <div style={styles.gridContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #0047BA', paddingBottom: '10px' }}>
                <h2 style={{ margin: 0, color: '#333' }}>Últimas Ediciones</h2>

                {/* Search Filter */}
                <div>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={handleDateChange}
                        style={styles.searchInput}
                        placeholder="Buscar por fecha"
                    />
                </div>
            </div>

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
                            <p style={styles.date}>{formatDate(edition.edition_date)}</p>
                        </div>
                    </Link>
                ))}
                {editions.length === 0 && (
                    <p style={{ textAlign: 'center', width: '100%', color: '#666', gridColumn: '1 / -1' }}>
                        No se encontraron ediciones.
                    </p>
                )}
            </div>

            {renderPagination()}
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
    // title: removed in favor of flex header
    searchInput: {
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #ddd',
        fontSize: '0.9rem',
        outline: 'none',
        color: '#555'
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
        gap: '10px'
    },
    pageBtn: {
        padding: '8px 12px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '0.9rem',
        fontWeight: '500',
        minWidth: '36px',
        transition: 'all 0.2s'
    },
    pageInfo: {
        fontSize: '1rem',
        color: '#333',
        fontWeight: '500'
    }
};

export default Library;
