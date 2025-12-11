import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'editor' });
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Password Change State
    const [changingPasswordId, setChangingPasswordId] = useState(null);
    const [newPassword, setNewPassword] = useState('');

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${apiUrl}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Error al cargar usuarios');
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!newUser.username || !newUser.password) {
            setError('Usuario y contraseña requeridos');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${apiUrl}/users`, newUser, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Usuario creado exitosamente');
            setNewUser({ username: '', password: '', role: 'editor' });
            setIsCreating(false);
            fetchUsers();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al crear usuario');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${apiUrl}/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al eliminar usuario');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!newPassword) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${apiUrl}/users/${changingPasswordId}`, { password: newPassword }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Contraseña actualizada exitosamente');
            setChangingPasswordId(null);
            setNewPassword('');
        } catch (err) {
            console.error(err);
            setError('Error al actualizar contraseña');
        }
    };

    if (loading) return <div>Cargando usuarios...</div>;

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Gestión de Usuarios</h3>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    style={styles.addButton}
                >
                    {isCreating ? 'Cancelar' : 'Nuevo Usuario'}
                </button>
            </div>

            {error && <div style={styles.error}>{error}</div>}
            {success && <button style={styles.success} onClick={() => setSuccess('')}>{success} (x)</button>}

            {isCreating && (
                <form onSubmit={handleCreateUser} style={styles.form}>
                    <h4>Agregar Usuario</h4>
                    <div style={styles.formGroup}>
                        <label>Usuario:</label>
                        <input
                            type="text"
                            value={newUser.username}
                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label>Contraseña:</label>
                        <input
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label>Rol:</label>
                        <select
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            style={styles.input}
                        >
                            <option value="editor">Editor</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                    <button type="submit" style={styles.submitBtn}>Guardar</button>
                </form>
            )}

            {/* Password Change Modal */}
            {changingPasswordId && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h4>Cambiar Contraseña</h4>
                        <form onSubmit={handleChangePassword}>
                            <input
                                type="password"
                                placeholder="Nueva contraseña"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={styles.input}
                                autoFocus
                            />
                            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => { setChangingPasswordId(null); setNewPassword(''); }} style={styles.cancelBtn}>Cancelar</button>
                                <button type="submit" style={styles.submitBtn}>Actualizar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Usuario</th>
                            <th style={styles.th}>Rol</th>
                            <th style={styles.th}>Creado</th>
                            <th style={styles.th}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td style={styles.td}>{user.id}</td>
                                <td style={styles.td}>{user.username}</td>
                                <td style={styles.td}>{user.role}</td>
                                <td style={styles.td}>{new Date(user.created_at).toLocaleDateString()}</td>
                                <td style={styles.td}>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button
                                            onClick={() => setChangingPasswordId(user.id)}
                                            style={styles.editBtn}
                                        >
                                            Cambiar Clave
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            style={styles.deleteBtn}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const styles = {
    addButton: {
        background: '#0047BA',
        color: 'white',
        border: 'none',
        padding: '10px 15px',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    form: {
        background: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #ddd'
    },
    formGroup: {
        marginBottom: '15px'
    },
    input: {
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        marginTop: '5px'
    },
    submitBtn: {
        background: '#28a745',
        color: 'white',
        border: 'none',
        padding: '10px 15px',
        borderRadius: '5px',
        cursor: 'pointer'
    },
    tableContainer: {
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '10px'
    },
    th: {
        background: '#f4f4f4',
        padding: '10px',
        textAlign: 'left',
        borderBottom: '2px solid #ddd'
    },
    td: {
        padding: '10px',
        borderBottom: '1px solid #eee'
    },
    deleteBtn: {
        background: '#dc3545',
        color: 'white',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.8rem'
    },
    editBtn: {
        background: '#ffc107',
        color: 'black',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.8rem'
    },
    error: {
        color: 'red',
        marginBottom: '10px',
        padding: '10px',
        background: '#ffe6e6',
        borderRadius: '4px'
    },
    success: {
        color: 'green',
        marginBottom: '10px',
        padding: '10px',
        background: '#e6ffe6',
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    },
    modalContent: {
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '300px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
    },
    cancelBtn: {
        padding: '8px 15px',
        background: '#eee',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    }
};

export default UserManagement;
