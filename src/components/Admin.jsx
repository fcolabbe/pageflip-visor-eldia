import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
    const [editions, setEditions] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        fetchEditions();
    }, [navigate]);

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
        navigate('/login');
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '80px auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>Panel de Administración</h1>
                <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar Sesión</button>
            </div>

            <div style={styles.actions}>
                <button style={styles.createBtn}>+ Nueva Edición</button>
            </div>

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
                            <td style={styles.td}>{edition.id}</td>
                            <td style={styles.td}>{edition.title}</td>
                            <td style={styles.td}>{new Date(edition.edition_date).toLocaleDateString()}</td>
                            <td style={styles.td}>{edition.type}</td>
                            <td style={styles.td}>
                                <button style={styles.actionBtn}>Editar</button>
                                <button style={{ ...styles.actionBtn, color: 'red' }}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const styles = {
    logoutBtn: { padding: '8px 16px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    createBtn: { padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' },
    actions: { marginBottom: '20px', textAlign: 'right' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #ddd', background: '#f8f9fa' },
    td: { padding: '12px', borderBottom: '1px solid #ddd' },
    tr: { '&:hover': { background: '#f5f5f5' } },
    actionBtn: { marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', color: '#0047BA' }
};

export default Admin;
