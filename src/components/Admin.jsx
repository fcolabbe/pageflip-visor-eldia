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

    // Helper for date formatting (Timezone fix)
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const [y, m, d] = dateString.split('T')[0].split('-');
        return `${d}/${m}/${y}`;
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

        tr: { transition: 'background 0.2s' },

        cellTitle: { fontWeight: '600', color: '#1a1a1a' },
        badge: { padding: '4px 10px', borderRadius: '20px', background: '#e3f2fd', color: '#0047BA', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' },

        deleteBtn: { padding: '6px 14px', background: '#fff5f5', color: '#d32f2f', border: '1px solid #ffebee', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' },
        editBtn: { padding: '6px 14px', background: '#f0f7ff', color: '#0047BA', border: '1px solid #cce5ff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }, // Added Edit Btn Style

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
