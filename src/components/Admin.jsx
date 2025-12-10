import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
    const [editions, setEditions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
    const [formData, setFormData] = useState({
        edition_date: '',
        type: 'diario',
        pdf: null,
        pdf_url_source: ''
    });
    const navigate = useNavigate();

    // Configure Axios Auth Header
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }, [navigate]);

    useEffect(() => {
        fetchEditions();
    }, []);

    const fetchEditions = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
            const res = await axios.get(`${apiUrl}/editions`);
            setEditions(res.data);
        } catch (err) {
            console.error("Error fetching editions", err);
        }
    };

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

    const handleCreate = async (e) => {
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
            await axios.post(`${apiUrl}/editions`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Reset and Refresh
            setIsModalOpen(false);
            setUploading(false);
            setFormData({ edition_date: '', type: 'diario', pdf: null, pdf_url_source: '' });
            fetchEditions();
            alert("Edición creada exitosamente");
        } catch (err) {
            console.error("Error creating edition", err);
            setUploading(false);
            alert("Error al crear la edición: " + (err.response?.data?.message || err.message));
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

    return (
        <div style={styles.pageContainer}>
            <div style={styles.header}>
                <h1 style={styles.title}>Panel de Administración</h1>
                <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar Sesión</button>
            </div>

            <div style={styles.dashboardCard}>
                <div style={styles.toolbar}>
                    <h2 style={styles.subtitle}>Listado de Ediciones</h2>
                    <button onClick={() => setIsModalOpen(true)} style={styles.createBtn}>
                        <span style={{ fontSize: '1.2rem', marginRight: '5px' }}>+</span> Nueva Edición
                    </button>
                </div>

                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>ID</th>
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
                                    <td style={styles.td}>#{edition.id}</td>
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
                                    <td style={styles.td}>{new Date(edition.edition_date).toLocaleDateString()}</td>
                                    <td style={styles.td}>
                                        <span style={styles.badge}>{edition.type}</span>
                                    </td>
                                    <td style={styles.td}>
                                        <button onClick={() => handleDelete(edition.id)} style={styles.deleteBtn}>
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {editions.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                                        No hay ediciones registradas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3>Nueva Edición</h3>
                            {!uploading && <button onClick={() => setIsModalOpen(false)} style={styles.closeBtn}>×</button>}
                        </div>
                        <form onSubmit={handleCreate} style={styles.form}>
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
                                            <label style={styles.label}>Archivo PDF</label>
                                            <input
                                                type="file"
                                                name="pdf"
                                                accept="application/pdf"
                                                onChange={handleInputChange}
                                                style={styles.fileInput}
                                                required
                                            />
                                            <small style={{ color: '#666', fontSize: '0.8rem' }}>La portada se extraerá automáticamente.</small>
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
                                                required
                                            />
                                            <small style={{ color: '#666', fontSize: '0.8rem' }}>El sistema descargará el PDF y generará la portada.</small>
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
                                            <option value="diario">Diario</option>
                                            <option value="revista">Revista</option>
                                        </select>
                                    </div>

                                    <div style={styles.modalActions}>
                                        <button type="button" onClick={() => setIsModalOpen(false)} style={styles.cancelBtn}>Cancelar</button>
                                        <button type="submit" style={styles.saveBtn}>Guardar Edición</button>
                                    </div>
                                </>
                            )}
                        </form>
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
    logoutBtn: { padding: '8px 16px', background: '#f5f5f5', color: '#666', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },

    dashboardCard: { background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '24px', border: '1px solid #eaeaea' },
    toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    subtitle: { margin: 0, fontSize: '1.2rem', color: '#444', fontWeight: '600' },

    createBtn: {
        padding: '10px 24px',
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
        transition: 'background 0.2s'
    },

    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0', minWidth: '700px' },
    th: { textAlign: 'left', padding: '16px', borderBottom: '1px solid #eaeaea', color: '#666', background: '#f9fafb', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' },
    td: { padding: '16px', borderBottom: '1px solid #eaeaea', verticalAlign: 'middle', fontSize: '0.95rem' },
    tr: { transition: 'background 0.2s' },

    cellTitle: { fontWeight: '600', color: '#1a1a1a' },
    badge: { padding: '4px 10px', borderRadius: '20px', background: '#e3f2fd', color: '#0047BA', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' },

    deleteBtn: { padding: '6px 14px', background: '#fff5f5', color: '#d32f2f', border: '1px solid #ffebee', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' },

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
    cancelBtn: { padding: '12px 24px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', color: '#666', fontWeight: '600' },
    saveBtn: { padding: '12px 24px', background: '#0047BA', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

export default Admin;
