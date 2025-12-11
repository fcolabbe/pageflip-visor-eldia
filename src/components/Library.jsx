import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Library.css';

const Library = () => {
    const [editions, setEditions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({});

    // Filter Inputs (Staging)
    const [dateFilter, setDateFilter] = useState('');
    const [titleFilter, setTitleFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    // Active Search Queries
    const [searchDate, setSearchDate] = useState('');
    const [searchTitle, setSearchTitle] = useState('');
    const [searchType, setSearchType] = useState('');

    // Mobile Search Modal State
    const [showMobileSearch, setShowMobileSearch] = useState(false);

    useEffect(() => {
        const fetchEditions = async () => {
            setLoading(true);
            try {
                // Use VITE_API_URL or fallback
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
                const params = { page, limit: 15 };

                // Active Filters
                if (searchDate) params.date = searchDate;
                if (searchTitle) params.title = searchTitle;
                if (searchType) params.type = searchType;

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
    }, [page, searchDate, searchTitle, searchType]);

    const handleSearch = () => {
        setSearchDate(dateFilter);
        setSearchTitle(titleFilter);
        setSearchType(typeFilter);
        setPage(1);
        setShowMobileSearch(false); // Close modal on search
    };

    const handleClear = () => {
        setDateFilter('');
        setTitleFilter('');
        setTypeFilter('');

        setSearchDate('');
        setSearchTitle('');
        setSearchType('');

        setPage(1);
        setShowMobileSearch(false);
    };

    // ... existing helpers ...
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const [y, m, d] = dateString.split('T')[0].split('-');
        return `${d}/${m}/${y}`;
    };

    // Reusable Search Controls Component (Internal)
    const SearchControls = () => (
        <>
            <input
                type="text"
                value={titleFilter}
                onChange={(e) => setTitleFilter(e.target.value)}
                className="library-search-input"
                placeholder="Buscar por título..."
            />
            <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="library-search-select"
            >
                <option value="">Tipo de publicación</option>
                <option value="Diario el Día">Diario el Día</option>
                <option value="Revista Vida Hogar">Revista Vida Hogar</option>
                <option value="Revista Vida Salud">Revista Vida Salud</option>
                <option value="Boletin Comunidades">Boletín Comunidades</option>
                <option value="Revista Peludos">Revista Peludos</option>
                <option value="Edicion Especial">Edición Especial</option>
            </select>
            <input
                type="text"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="library-search-input date-placeholder"
                placeholder="Seleccionar Fecha"
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => {
                    if (!e.target.value) e.target.type = "text";
                }}
            />
            <button onClick={handleSearch} className="library-search-btn">
                Buscar
            </button>
            {(dateFilter || titleFilter || typeFilter) && (
                <button onClick={handleClear} className="library-clear-btn">
                    ×
                </button>
            )}
        </>
    );

    // ... renderPagination remains the same ...
    const renderPagination = () => {
        const totalPages = meta.totalPages || 1;
        if (totalPages <= 1) return null;
        const pages = [];
        let start = Math.max(1, page - 2);
        let end = Math.min(totalPages, page + 2);
        if (start > 1) pages.push(1);
        if (start > 2) pages.push('...');
        for (let i = start; i <= end; i++) pages.push(i);
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
        <div className="library-grid-container">
            <div className="library-header">
                <h2 className="library-title">Últimas Ediciones</h2>

                {/* DESKTOP SEARCH BAR */}
                <div className="library-search-container desktop-only">
                    <SearchControls />
                </div>

                {/* MOBILE SEARCH TRIGGER */}
                <button
                    className="mobile-search-trigger mobile-only"
                    onClick={() => setShowMobileSearch(true)}
                    title="Buscar"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </button>
            </div>

            {/* MOBILE SEARCH MODAL */}
            {showMobileSearch && (
                <div className="library-modal-overlay">
                    <div className="library-modal-content">
                        <div className="library-modal-header">
                            <h3>Búsqueda Avanzada</h3>
                            <button onClick={() => setShowMobileSearch(false)} className="close-modal-btn">×</button>
                        </div>
                        <div className="library-modal-body">
                            <SearchControls />
                        </div>
                    </div>
                </div>
            )}

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
                            {/* Date removed as requested */}
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
    // gridContainer, searchContainer, etc moved to CSS
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
