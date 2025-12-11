import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UserManagement from './UserManagement';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Admin = () => {
    // --- EDITIONS STATE ---
    const [editions, setEditions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({});

    // --- UI STATE ---
    const [activeTab, setActiveTab] = useState('editions'); // 'editions' | 'users'
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- EDIT/UPLOAD STATE ---
    const [uploading, setUploading] = useState(false);
    const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
    const [formData, setFormData] = useState({
        edition_date: '',
        type: 'Diario el Día',
        pdf: null,
        pdf_url_source: ''
    });
    const [editingId, setEditingId] = useState(null);

    // --- BULK IMPORT STATE ---
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkStart, setBulkStart] = useState('2019-01-03');
    const [bulkEnd, setBulkEnd] = useState(new Date().toISOString().split('T')[0]);
    const [bulkLogs, setBulkLogs] = useState([]);
    const [bulkRunning, setBulkRunning] = useState(false);
    const stopBulkRef = useRef(false);

    const [searchTerm, setSearchTerm] = useState('');

    const navigate = useNavigate();

    // Configure Axios Auth Header & Interceptor
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Intercept 401s to auto-logout
            const interceptor = axios.interceptors.response.use(
                response => response,
                error => {
                    if (error.response && error.response.status === 401) {
                        handleLogout();
                    }
                    return Promise.reject(error);
                }
            );

            return () => {
                axios.interceptors.response.eject(interceptor);
            };
        }
    }, [navigate]);

    // --- EFFECT: FETCH EDITIONS ---
    useEffect(() => {
        if (activeTab === 'editions') {
            fetchEditions();
        }
    }, [page, activeTab]);

    const fetchEditions = async (pageOverride) => {
        setLoading(true);
        try {
            const p = pageOverride || page;
            const res = await axios.get(`${apiUrl}/editions?page=${p}&limit=12&title=${searchTerm}`);

            if (res.data.data) {
                setEditions(res.data.data);
                setMeta(res.data.meta);
            } else {
                setEditions(res.data);
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 401) {
                // Handled by interceptor
            } else {
                alert('Error al cargar ediciones');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'editions') {
            fetchEditions();
        }
    }, [page, activeTab]); // Reload when page/tab changes. Search triggers manually.

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchEditions(1);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        navigate('/login');
    };

    // --- HANDLERS: EDIT/CREATE ---
    const handleInputChange = (e) => {
        if (e.target.name === 'pdf') {
            setFormData({ ...formData, pdf: e.target.files[0] });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const openCreateModal = () => {
        setEditingId(null);
        setFormData({ edition_date: '', type: 'Diario el Día', pdf: null, pdf_url_source: '' });
        setUploadMode('file');
        setIsModalOpen(true);
    };

    const openEditModal = (edition) => {
        let dateVal = '';
        if (edition.edition_date) {
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
        setUploadMode('file');
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
                await axios.put(`${apiUrl}/editions/${editingId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert("Edición actualizada exitosamente");
            } else {
                await axios.post(`${apiUrl}/editions`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert("Edición creada exitosamente");
            }

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

    // --- HANDLERS: BULK IMPORT ---
    const handleBulkImport = async () => {
        setBulkRunning(true);
        stopBulkRef.current = false;
        setBulkLogs(prev => [`Iniciando proceso de ${bulkStart} a ${bulkEnd}...`, ...prev]);

        let current = new Date(bulkStart + 'T12:00:00');
        const end = new Date(bulkEnd + 'T12:00:00');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

        while (current <= end) {
            if (stopBulkRef.current) {
                setBulkLogs(prev => [`🛑 Proceso detenido por usuario.`, ...prev]);
                break;
            }

            const day = String(current.getDate()).padStart(2, '0');
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const year = current.getFullYear();
            const dateStr = `${day}${month}${year}`;
            const dbDate = `${year}-${month}-${day}`;

            const jsonUrl = `https://instaphotos.cl/p/portada${dateStr}.json`; // Assuming this logic is correct from previous file

            try {
                setBulkLogs(prev => [`Procesando ${dbDate}...`, ...prev]);
                await axios.post(`${apiUrl}/editions/import-external`, {
                    json_url: jsonUrl,
                    date: dbDate
                });
                setBulkLogs(prev => [`✅ ${dbDate}: Importación exitosa`, ...prev]);
            } catch (err) {
                if (err.response && (err.response.status === 404 || err.response.status === 400)) {
                    setBulkLogs(prev => [`⏭️ ${dbDate}: Saltado (No encontrado)`, ...prev]);
                } else {
                    setBulkLogs(prev => [`❌ ${dbDate}: Error - ${err.message}`, ...prev]);
                }
            }

            current.setDate(current.getDate() + 1);
            await new Promise(r => setTimeout(r, 500));
        }

        setBulkRunning(false);
        fetchEditions();
    };

    useEffect(() => {
        if (!bulkRunning) {
            stopBulkRef.current = true;
        }
    }, [bulkRunning]);

    // --- HELPERS ---
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '';
        const [y, m, day] = d.toISOString().split('T')[0].split('-');
        return `${day}/${m}/${y}`;
    };

    // --- RENDER ---
    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2>Panel de Administración</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar Sesión</button>
                    <button onClick={() => navigate('/')} style={styles.backBtn}>Ir al Visor</button>
                </div>
            </div>

            {/* TABS */}
            <div style={styles.tabs}>
                <button
                    onClick={() => setActiveTab('editions')}
                    style={{
                        ...styles.tabBtn,
                        borderBottom: activeTab === 'editions' ? '3px solid #0047BA' : '3px solid transparent',
                        color: activeTab === 'editions' ? '#0047BA' : '#666'
                    }}
                >
                    Ediciones
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    style={{
                        ...styles.tabBtn,
                        borderBottom: activeTab === 'users' ? '3px solid #0047BA' : '3px solid transparent',
                        color: activeTab === 'users' ? '#0047BA' : '#666'
                    }}
                >
                    Usuarios
                </button>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'users' ? (
                <UserManagement />
            ) : (
                <>
                    {/* EDITIONS TOOLBAR */}
                    <div style={styles.toolbar}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '5px' }}>
                                <input
                                    type="text"
                                    placeholder="Buscar por título..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={styles.input}
                                />
                                <button type="submit" style={styles.searchBtn}>Buscar</button>
                            </form>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={openCreateModal} style={styles.createBtn}>+ Nueva Edición</button>
                            <button onClick={() => setIsBulkModalOpen(true)} style={styles.bulkBtn}>Importar Especiales</button>
                        </div>
                    </div>

                    {loading ? (
                        <p>Cargando ediciones...</p>
                    ) : (
                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>ID</th>
                                        <th style={styles.th}>Portada</th>
                                        <th style={styles.th}>Fecha</th>
                                        <th style={styles.th}>Título / Tipo</th>
                                        <th style={styles.th}>Páginas</th>
                                        <th style={styles.th}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {editions.map(edition => (
                                        <tr key={edition.id}>
                                            <td style={styles.td}>{edition.id}</td>
                                            <td style={styles.td}>
                                                {edition.cover_url && (
                                                    <img
                                                        src={`${apiUrl.replace('/api', '')}${edition.cover_url}`}
                                                        alt="Portada"
                                                        style={{ width: '40px', height: 'auto', borderRadius: '4px', border: '1px solid #ddd' }}
                                                    />
                                                )}
                                            </td>
                                            <td style={styles.td}>{formatDate(edition.edition_date)}</td>
                                            <td style={styles.td}>
                                                <strong>{edition.title}</strong><br />
                                                <span style={{ fontSize: '0.85rem', color: '#666' }}>{edition.type}</span>
                                            </td>
                                            <td style={styles.td}>{edition.pages}</td>
                                            <td style={styles.td}>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <button onClick={() => openEditModal(edition)} style={styles.editBtn}>Editar</button>
                                                    <button onClick={() => handleDelete(edition.id)} style={styles.deleteBtn}>Eliminar</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {editions.length === 0 && (
                                        <tr><td colSpan="6" style={styles.td}>No hay ediciones.</td></tr>
                                    )}
                                </tbody>
                            </table>

                            {/* PAGINATION */}
                            <div style={styles.pagination}>
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    style={{ ...styles.pageBtn, opacity: page === 1 ? 0.5 : 1 }}
                                >
                                    &larr;
                                </button>
                                <span style={{ margin: '0 10px' }}>Página {page} de {meta.totalPages || 1}</span>
                                <button
                                    disabled={page >= (meta.totalPages || 1)}
                                    onClick={() => setPage(p => p + 1)}
                                    style={{ ...styles.pageBtn, opacity: page >= (meta.totalPages || 1) ? 0.5 : 1 }}
                                >
                                    &rarr;
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* CREATE/EDIT MODAL */}
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
                                    <p>Procesando... por favor espere.</p>
                                </div>
                            ) : (
                                <>
                                    <div style={styles.toggleContainer}>
                                        <button type="button" onClick={() => setUploadMode('file')} style={uploadMode === 'file' ? styles.toggleBtnActive : styles.toggleBtn}>Archivo</button>
                                        <button type="button" onClick={() => setUploadMode('url')} style={uploadMode === 'url' ? styles.toggleBtnActive : styles.toggleBtn}>URL</button>
                                    </div>

                                    {uploadMode === 'file' ? (
                                        <div style={styles.formGroup}>
                                            <label>PDF (Opcional si editas)</label>
                                            <input type="file" name="pdf" accept="application/pdf" onChange={handleInputChange} style={styles.input} />
                                        </div>
                                    ) : (
                                        <div style={styles.formGroup}>
                                            <label>URL del PDF</label>
                                            <input type="url" name="pdf_url_source" value={formData.pdf_url_source} onChange={handleInputChange} style={styles.input} placeholder="https://..." />
                                        </div>
                                    )}

                                    <div style={styles.formGroup}>
                                        <label>Fecha</label>
                                        <input type="date" name="edition_date" value={formData.edition_date} onChange={handleInputChange} style={styles.input} required />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label>Tipo</label>
                                        <select name="type" value={formData.type} onChange={handleInputChange} style={styles.input}>
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
                                        <button type="submit" style={styles.saveBtn}>Guardar</button>
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
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3>Importación Masiva</h3>
                            {!bulkRunning && <button onClick={() => setIsBulkModalOpen(false)} style={styles.closeBtn}>×</button>}
                        </div>
                        <div style={{ padding: '10px' }}>
                            {!bulkRunning && (
                                <div style={{ marginBottom: '15px' }}>
                                    <label>Fecha Inicio: </label>
                                    <input type="date" value={bulkStart} onChange={e => setBulkStart(e.target.value)} style={styles.input} />
                                    <label style={{ marginLeft: '10px' }}>Fecha Fin: </label>
                                    <input type="date" value={bulkEnd} onChange={e => setBulkEnd(e.target.value)} style={styles.input} />
                                </div>
                            )}
                            <div style={{ background: '#000', color: '#0f0', padding: '10px', height: '150px', overflowY: 'auto', fontSize: '12px', marginBottom: '10px' }}>
                                {bulkLogs.map((log, i) => <div key={i}>{log}</div>)}
                            </div>
                            <div style={styles.modalActions}>
                                {!bulkRunning ? (
                                    <button onClick={handleBulkImport} style={styles.saveBtn}>Iniciar</button>
                                ) : (
                                    <button onClick={() => setBulkRunning(false)} style={{ ...styles.saveBtn, background: 'red' }}>Detener</button>
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
    container: { maxWidth: '1000px', margin: '80px auto', padding: '20px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    tabs: { display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #ddd' },
    tabBtn: { background: 'none', border: 'none', padding: '10px 20px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' },
    toolbar: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
    createBtn: { background: '#0047BA', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    bulkBtn: { background: '#28a745', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    searchBtn: { background: '#333', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    logoutBtn: { padding: '5px 10px', cursor: 'pointer' },
    backBtn: { padding: '5px 10px', cursor: 'pointer' },
    tableContainer: { overflowX: 'auto', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '10px', borderBottom: '2px solid #ddd' },
    td: { padding: '10px', borderBottom: '1px solid #eee' },
    editBtn: { background: '#ffc107', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' },
    deleteBtn: { background: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' },
    pagination: { marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    pageBtn: { margin: '0 5px', padding: '5px 10px', cursor: 'pointer' },

    // Modal
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { background: 'white', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
    input: { padding: '8px', borderRadius: '4px', border: '1px solid #ddd' },
    select: { padding: '8px', borderRadius: '4px', border: '1px solid #ddd' },
    toggleContainer: { display: 'flex', gap: '10px', marginBottom: '10px' },
    toggleBtn: { flex: 1, padding: '8px', cursor: 'pointer', border: '1px solid #ddd', background: '#f9f9f9' },
    toggleBtnActive: { flex: 1, padding: '8px', cursor: 'pointer', border: '1px solid #0047BA', background: '#e3f2fd', color: '#0047BA', fontWeight: 'bold' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
    cancelBtn: { padding: '8px 15px', border: '1px solid #ddd', background: 'white', borderRadius: '4px', cursor: 'pointer' },
    saveBtn: { padding: '8px 15px', border: 'none', background: '#0047BA', color: 'white', borderRadius: '4px', cursor: 'pointer' }
};

export default Admin;
