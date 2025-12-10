import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
    const [editions, setEditions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        edition_date: '',
        type: 'diario',
        pdf_url: '',
        cover_url: ''
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
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
            await axios.post(`${apiUrl}/editions`, formData);

            // Reset and Refresh
            setIsModalOpen(false);
            setFormData({ title: '', edition_date: '', type: 'diario', pdf_url: '', cover_url: '' });
            fetchEditions();
            alert("Edición creada exitosamente");
        } catch (err) {
            console.error("Error creating edition", err);
            alert("Error al crear la edición");
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
                        + Nueva Edición
                    </button>
                </div>

                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>ID</th>
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
                                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
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
                            <button onClick={() => setIsModalOpen(false)} style={styles.closeBtn}>×</button>
                        </div>
                        <form onSubmit={handleCreate} style={styles.form}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Título</label>
                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    placeholder="Ej: Diario El Día - 10 Dic"
                                    required
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Fecha</label>
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
                                <label style={styles.label}>Tipo</label>
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
                            <div style={styles.formGroup}>
                                <label style={styles.label}>URL PDF</label>
                                <input
                                    name="pdf_url"
                                    value={formData.pdf_url}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    placeholder="https://.../archivo.pdf"
                                    required
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>URL Portada (Imagen)</label>
                                <input
                                    name="cover_url"
                                    value={formData.cover_url}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    placeholder="https://.../portada.jpg"
                                />
                            </div>
                            <div style={styles.modalActions}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={styles.cancelBtn}>Cancelar</button>
                                <button type="submit" style={styles.saveBtn}>Guardar Edición</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    pageContainer: { maxWidth: '1100px', margin: '80px auto', padding: '20px', fontFamily: 'sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    title: { color: '#0047BA', margin: 0 },
    logoutBtn: { padding: '8px 16px', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },

    dashboardCard: { background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '20px', border: '1px solid #eee' },
    toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    subtitle: { margin: 0, fontSize: '1.2rem', color: '#555' },

    createBtn: {
        padding: '10px 20px',
        background: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.95rem',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)'
    },

    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '600px' },
    th: { textAlign: 'left', padding: '15px', borderBottom: '2px solid #eee', color: '#666', background: '#f9f9f9', fontSize: '0.9rem', textTransform: 'uppercase' },
    td: { padding: '15px', borderBottom: '1px solid #eee', verticalAlign: 'middle', fontSize: '0.95rem' },
    tr: { transition: 'background 0.2s', '&:hover': { background: '#fcfcfc' } },

    cellTitle: { fontWeight: 'bold', color: '#333' },
    badge: { padding: '4px 8px', borderRadius: '12px', background: '#e3f2fd', color: '#0d47a1', fontSize: '0.8rem', textTransform: 'capitalize' },

    deleteBtn: { padding: '6px 12px', background: '#fff0f0', color: '#d32f2f', border: '1px solid #ffcdd2', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' },

    // Modal
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 },
    modalContent: { background: 'white', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' },

    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '0.9rem', fontWeight: 'bold', color: '#555' },
    input: { padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '1rem' },
    select: { padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '1rem', background: 'white' },

    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    cancelBtn: { padding: '10px 20px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', color: '#666' },
    saveBtn: { padding: '10px 20px', background: '#0047BA', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
};

export default Admin;
