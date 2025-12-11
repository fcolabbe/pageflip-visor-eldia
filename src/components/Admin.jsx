import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
    const [editions, setEditions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
    const [formData, setFormData] = useState({
        edition_date: '',
        type: 'Diario el Día',
        pdf: null,
        pdf_url_source: ''
    });
    // State for Edit Mode
    const [editingId, setEditingId] = useState(null);

    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkStart, setBulkStart] = useState('2019-01-03');
    const [bulkEnd, setBulkEnd] = useState(new Date().toISOString().split('T')[0]);
    const [bulkLogs, setBulkLogs] = useState([]);
    const [bulkRunning, setBulkRunning] = useState(false);
    const stopBulkRef = useRef(false);

    const navigate = useNavigate();

    // Bulk Import Logic
    const handleBulkImport = async () => {
        setBulkRunning(true);
        stopBulkRef.current = false;
        setBulkLogs(prev => [`Initialing process from ${bulkStart} to ${bulkEnd}...`, ...prev]);

        let current = new Date(bulkStart + 'T12:00:00'); // No TZ issues
        const end = new Date(bulkEnd + 'T12:00:00');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

        while (current <= end) {
            if (stopBulkRef.current) {
                setBulkLogs(prev => [`🛑 Process stopped by user.`, ...prev]);
                break;
            }

            // Format date for JSON URL: ddMMyyyy
            const day = String(current.getDate()).padStart(2, '0');
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const year = current.getFullYear();
            const dateStr = `${day}${month}${year}`; // 03012019
            const dbDate = `${year}-${month}-${day}`; // 2019-01-03

            const jsonUrl = `https://instaphotos.cl/p/portada${dateStr}.json`;

            try {
                setBulkLogs(prev => [`Processing ${dbDate}...`, ...prev]);

                // Call Backend
                await axios.post(`${apiUrl}/editions/import-external`, {
                    json_url: jsonUrl,
                    date: dbDate
                });

                setBulkLogs(prev => [`✅ ${dbDate}: Imported successfully`, ...prev]);

            } catch (err) {
                if (err.response && (err.response.status === 404 || err.response.status === 400)) {
                    // 404 from backend means JSON not found on external site
                    setBulkLogs(prev => [`⏭️ ${dbDate}: Skipped (Not found)`, ...prev]);
                } else {
                    setBulkLogs(prev => [`❌ ${dbDate}: Error - ${err.message}`, ...prev]);
                    // Optional: Stop on system error? For now, continue loop.
                }
            }

            // Increment Day
            current.setDate(current.getDate() + 1);

            // Small delay to allow UI updates and prevent hammering
            await new Promise(r => setTimeout(r, 500));
        }

        setBulkRunning(false);
        fetchEditions(); // Refresh table
    };

    // Watch for stop signal
    useEffect(() => {
        if (!bulkRunning) {
            stopBulkRef.current = true;
        }
    }, [bulkRunning]);

    // Configure Axios Auth Header
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }, [navigate]);

    const fetchEditions = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
            const res = await axios.get(`${apiUrl}/editions`, {
                params: { page, limit: 15 } // 15 items per page for admin
            });

            if (res.data.data) {
                setEditions(res.data.data);
                setMeta(res.data.meta);
            } else {
                setEditions(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEditions();
    }, [page]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        navigate('/login');
    };

    const handleInputChange = (e) => {
        if (e.target.name === 'pdf') {
            setFormData({ ...formData, pdf: e.target.files[0] });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleEdit = (edition) => {
        let dateVal = '';
        if (edition.edition_date) {
            // Handle both String (JSON) and Date Object (MySQL driver)
            const d = new Date(edition.edition_date);
            if (!isNaN(d.getTime())) {
                dateVal = d.toISOString().split('T')[0];
            }
        }

        setFormData({
            edition_date: dateVal,
            type: edition.type,
            pdf: null,
            pdf_url_source: ''
        });
        setEditingId(edition.id);
        setUploadMode('file'); // Default reset
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        try {
            const data = new FormData();
            data.append('edition_date', formData.edition_date);
            data.append('type', formData.type);

            if (uploadMode === 'file' && formData.pdf) {
                data.append('pdf', formData.pdf);
            } else if (uploadMode === 'url' && formData.pdf_url_source) {
                data.append('pdf_url_source', formData.pdf_url_source);
            }

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

            if (editingId) {
                // UPDATE
                await axios.put(`${apiUrl}/editions/${editingId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert("Edición actualizada exitosamente");
            } else {
                // CREATE
                await axios.post(`${apiUrl}/editions`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert("Edición creada exitosamente");
            }

            // Reset and Refresh
            setIsModalOpen(false);
            setUploading(false);
            setFormData({ edition_date: '', type: 'Diario el Día', pdf: null, pdf_url_source: '' });
            setEditingId(null);
            fetchEditions();

        } catch (err) {
            console.error("Error saving edition", err);
            setUploading(false);
            alert("Error al guardar: " + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar esta edición?")) return;

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
            await axios.delete(`${apiUrl}/editions/${id}`);
            fetchEditions();
        } catch (err) {
            console.error("Error deleting edition", err);
        }
    };

    // Helper for date formatting (Timezone fix)
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '';
        const [y, m, day] = d.toISOString().split('T')[0].split('-');
        return `${day}/${m}/${y}`;
    };

    // Pagination Logic
    const renderPagination = () => {
        const totalPages = meta.totalPages || 1;
        if (totalPages <= 1) return null;

        const pages = [];
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
                            background: p === page ? '#0047BA' : 'white',
                            color: p === page ? 'white' : '#333',
                            cursor: typeof p === 'number' ? 'pointer' : 'default',
                            borderColor: p === page ? '#0047BA' : '#ddd'
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

    return (
        <div style={styles.pageContainer}>
            <div style={styles.header}>
                <h1 style={styles.title}>Panel de Administración</h1>
                <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar Sesión</button>
            </div>

            <div style={styles.dashboardCard}>
                <div style={styles.toolbar}>
                    <h2 style={styles.subtitle}>Listado de Ediciones</h2>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button onClick={() => setIsBulkModalOpen(true)} style={{ ...styles.createBtn, background: '#28a745' }}>
                            <span style={{ fontSize: '1.2rem', marginRight: '5px' }}>⚡</span> Importación Masiva
                        </button>
                        <button onClick={() => {
                            setEditingId(null);
                            setFormData({ edition_date: '', type: 'Diario el Día', pdf: null, pdf_url_source: '' });
                            setIsModalOpen(true);
                        }} style={styles.createBtn}>
                            <span style={{ fontSize: '1.2rem', marginRight: '5px' }}>+</span> Nueva Edición
                        </button>
                    </div>
                </div>

                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={{ background: '#f9fafb' }}>
                                <th style={styles.th}>Portada</th>
                                <th style={styles.th}>Título</th>
                                <th style={styles.th}>Fecha</th>
                                <th style={styles.th}>Tipo</th>
                                <th style={styles.th}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {editions.map(edition => (
                                <tr key={edition.id} style={styles.tr}>
                                    <td style={styles.td}>
                                        <div style={styles.thumbWrapper}>
                                            <img
                                                src={edition.cover_url && edition.cover_url.startsWith('/')
                                                    ? `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5001'}${edition.cover_url}`
                                                    : edition.cover_url || "https://via.placeholder.com/50"}
                                                alt="cover"
                                                style={styles.thumb}
                                            />
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={styles.cellTitle}>{edition.title}</span>
                                    </td>
                                    <td style={styles.td}>{formatDate(edition.edition_date)}</td>
                                    <td style={styles.td}>
                                        <span style={styles.badge}>{edition.type}</span>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleEdit(edition)} style={styles.editBtn}>
                                                Editar
                                            </button>
                                            <button onClick={() => handleDelete(edition.id)} style={styles.deleteBtn}>
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {editions.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                                        No hay ediciones registradas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Admin Pagination */}
                    {renderPagination()}
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3>{editingId ? 'Editar Edición' : 'Nueva Edición'}</h3>
                            {!uploading && <button onClick={() => setIsModalOpen(false)} style={styles.closeBtn}>×</button>}
                        </div>
                        <form onSubmit={handleSubmit} style={styles.form}>
                            {uploading ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <p>Procesando archivo... por favor espere.</p>
                                    <div style={{ marginTop: '10px', height: '4px', background: '#eee', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: '50%', background: '#0047BA', animation: 'progress 1s infinite' }}></div>
                                    </div>
                                    <style>{`@keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }`}</style>
                                </div>
                            ) : (
                                <>
                                    {/* Source Toggle */}
                                    <div style={styles.toggleContainer}>
                                        <button
                                            type="button"
                                            onClick={() => setUploadMode('file')}
                                            style={uploadMode === 'file' ? styles.toggleBtnActive : styles.toggleBtn}
                                        >
                                            Subir Archivo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setUploadMode('url')}
                                            style={uploadMode === 'url' ? styles.toggleBtnActive : styles.toggleBtn}
                                        >
                                            Importar desde URL
                                        </button>
                                    </div>

                                    {uploadMode === 'file' ? (
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Archivo PDF {editingId && '(Opcional)'}</label>
                                            <input
                                                type="file"
                                                name="pdf"
                                                accept="application/pdf"
                                                onChange={handleInputChange}
                                                style={styles.fileInput}
                                                required={!editingId}
                                            />
                                            <small style={{ color: '#666', fontSize: '0.8rem' }}>
                                                {editingId ? 'Subir para reemplazar el actual.' : 'La portada se extraerá automáticamente.'}
                                            </small>
                                        </div>
                                    ) : (
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>URL del PDF</label>
                                            <input
                                                type="url"
                                                name="pdf_url_source"
                                                value={formData.pdf_url_source}
                                                onChange={handleInputChange}
                                                placeholder="https://ejemplo.com/archivo.pdf"
                                                style={styles.input}
                                                required={!editingId}
                                            />
                                        </div>
                                    )}

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Fecha de Edición</label>
                                        <input
                                            type="date"
                                            name="edition_date"
                                            value={formData.edition_date}
                                            onChange={handleInputChange}
                                            style={styles.input}
                                            required
                                        />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Tipo de Publicación</label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            style={styles.select}
                                        >
                                            <option value="Diario el Día">Diario el Día</option>
                                            <option value="Revista Vida Hogar">Revista Vida Hogar</option>
                                            <option value="Revista Vida Salud">Revista Vida Salud</option>
                                            <option value="Boletin Comunidades">Boletín Comunidades</option>
                                            <option value="Revista Peludos">Revista Peludos</option>
                                            <option value="Edicion Especial">Edición Especial</option>
                                        </select>
                                    </div>

                                    <div style={styles.modalActions}>
                                        <button type="button" onClick={() => setIsModalOpen(false)} style={styles.cancelBtn}>Cancelar</button>
                                        <button type="submit" disabled={uploading} style={styles.saveBtn}>
                                            {uploading ? 'Guardando...' : (editingId ? 'Guardar Cambios' : 'Crear Edición')}
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* BULK IMPORT MODAL */}
            {isBulkModalOpen && (
                <div style={styles.modalOverlay}>
                    {/* Reuse existing bulk modal code, just pass through */}
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3>Importación Histórica Masiva</h3>
                            {!bulkRunning && <button onClick={() => setIsBulkModalOpen(false)} style={styles.closeBtn}>×</button>}
                        </div>
                        {/* ... Body of Bulk Import ... */}
                        <div style={{ padding: '20px' }}>
                            {!bulkRunning && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={styles.label}>Fecha Inicio</label>
                                        <input type="date" value={bulkStart} onChange={e => setBulkStart(e.target.value)} style={styles.input} />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Fecha Fin</label>
                                        <input type="date" value={bulkEnd} onChange={e => setBulkEnd(e.target.value)} style={styles.input} />
                                    </div>
                                </div>
                            )}

                            {/* Logs Console */}
                            <div style={{
                                background: '#1e1e1e', color: '#00ff00', padding: '10px',
                                borderRadius: '4px', height: '200px', overflowY: 'auto',
                                fontFamily: 'monospace', fontSize: '0.8rem',
                                marginBottom: '20px', display: 'flex', flexDirection: 'column-reverse'
                            }}>
                                {bulkLogs.length === 0 && <span style={{ color: '#555' }}>Listo para iniciar...</span>}
                                {bulkLogs.map((log, i) => (
                                    <div key={i}>{log}</div>
                                ))}
                            </div>

                            <div style={styles.modalActions}>
                                {!bulkRunning ? (
                                    <>
                                        <button onClick={() => setIsBulkModalOpen(false)} style={styles.cancelBtn}>Cerrar</button>
                                        <button onClick={handleBulkImport} style={{ ...styles.saveBtn, background: '#28a745' }}>
                                            Iniciar Importación
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setBulkRunning(false)} style={{ ...styles.saveBtn, background: '#dc3545' }}>
                                        DETENER (Pausar)
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    pageContainer: { maxWidth: '1100px', margin: '90px auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    title: { color: '#1a1a1a', margin: 0, fontWeight: '700', fontSize: '1.8rem' },
    logoutBtn: {
        padding: '8px 16px',
        background: '#f5f5f5',
        color: '#666',
        border: '1px solid #ddd',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        whiteSpace: 'nowrap', // FIX
        flexShrink: 0 // FIX
    },

    dashboardCard: { background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '24px', border: '1px solid #eaeaea' },
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap', // Ensure wrapping on small screens
        gap: '15px' // Add gap for when wrapping occurs
    },
    subtitle: { margin: 0, fontSize: '1.2rem', color: '#444', fontWeight: '600' },

    createBtn: {
        padding: '10px 20px', // Reduced padding slightly
        background: '#0047BA',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.95rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 4px 6px rgba(0, 71, 186, 0.2)',
        transition: 'background 0.2s',
        whiteSpace: 'nowrap', // FIX: Prevent text wrapping
        flexShrink: 0 // Prevent shrinking
    },

    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0', minWidth: '700px' },
    th: { textAlign: 'left', padding: '16px', borderBottom: '1px solid #eaeaea', color: '#666', background: '#f9fafb', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' },
    td: { padding: '16px', borderBottom: '1px solid #eaeaea', verticalAlign: 'middle', fontSize: '0.95rem' },
    tr: { transition: 'background 0.2s' },

    cellTitle: { fontWeight: '600', color: '#1a1a1a' },
    badge: { padding: '4px 10px', borderRadius: '20px', background: '#e3f2fd', color: '#0047BA', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' },

    deleteBtn: { padding: '6px 14px', background: '#fff5f5', color: '#d32f2f', border: '1px solid #ffebee', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500', whiteSpace: 'nowrap' },
    editBtn: { padding: '6px 14px', background: '#f0f7ff', color: '#0047BA', border: '1px solid #cce5ff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500', whiteSpace: 'nowrap' },

    thumbWrapper: { width: '40px', height: '56px', background: '#eee', borderRadius: '4px', overflow: 'hidden', border: '1px solid #ddd' },
    thumb: { width: '100%', height: '100%', objectFit: 'cover' },

    // Modal
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(2px)' },
    modalContent: { background: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    closeBtn: { background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#999', lineHeight: '1' },

    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '0.9rem', fontWeight: '600', color: '#333' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', background: '#fff' },
    fileInput: { padding: '10px', borderRadius: '8px', border: '1px dashed #ccc', background: '#fafafa', cursor: 'pointer' },
    select: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', background: 'white' },

    toggleContainer: { display: 'flex', background: '#f5f5f5', borderRadius: '8px', padding: '4px', gap: '5px' },
    toggleBtn: { flex: 1, padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px', fontSize: '0.9rem', color: '#666' },
    toggleBtnActive: { flex: 1, padding: '8px', border: 'none', background: 'white', cursor: 'pointer', borderRadius: '6px', fontSize: '0.9rem', color: '#0047BA', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },

    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' },
    cancelBtn: { padding: '12px 24px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', color: '#666', fontWeight: '600', whiteSpace: 'nowrap' }, // Prevent wrap
    saveBtn: { padding: '12px 24px', background: '#0047BA', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }, // Prevent wrap

    pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', gap: '10px', borderTop: '1px solid #eee', paddingTop: '20px' },
    pageBtn: { padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem', fontWeight: '500', minWidth: '36px', transition: 'all 0.2s', background: 'white', cursor: 'pointer' }
};

export default Admin;
