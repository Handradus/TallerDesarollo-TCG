import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import './css/admin.css';

export default function AdminUsuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [bannedUsuarios, setBannedUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('pending');
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchUsuarios();
    }, [activeTab]);

    const fetchUsuarios = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (activeTab === 'pending') {
                const res = await axios.get(`${apiUrl}/api/auth/pending-users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsuarios(res.data.pending || []);
            } else {
                const res = await axios.get(`${apiUrl}/api/auth/banned-users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBannedUsuarios(res.data.banned || []);
            }
        } catch (e) {
            setError('Error cargando usuarios');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAprobar = async (id, nombre) => {
        const confirm = await Swal.fire({
            title: '¿Aprobar usuario?',
            text: `¿Estás seguro de que deseas dar acceso a ${nombre || 'este usuario'}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, aprobar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirm.isConfirmed) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${apiUrl}/api/auth/approve/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setUsuarios(usuarios.filter(u => u.id !== id));
            Swal.fire('¡Aprobado!', 'El usuario ahora puede iniciar sesión.', 'success');
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Hubo un problema al aprobar el usuario.', 'error');
        }
    };

    const handleRechazar = async (id, nombre) => {
        const confirm = await Swal.fire({
            title: '¿Rechazar usuario?',
            html: `<p>Se eliminará el registro de <strong>${nombre || 'este usuario'}</strong>.</p><p style="color:#e67e22;font-size:0.9em;">El usuario <b>podrá volver a registrarse</b> con la misma cuenta de Google.</p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e67e22',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'Sí, rechazar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirm.isConfirmed) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${apiUrl}/api/auth/reject/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsuarios(usuarios.filter(u => u.id !== id));
            Swal.fire('Rechazado', 'El usuario fue eliminado y puede volver a registrarse.', 'info');
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Hubo un problema al rechazar el usuario.', 'error');
        }
    };

    const handleBanear = async (id, nombre) => {
        const confirm = await Swal.fire({
            title: '¿Banear usuario?',
            html: `<p>Se bloqueará permanentemente a <strong>${nombre || 'este usuario'}</strong>.</p><p style="color:#c0392b;font-size:0.9em;">El usuario <b>no podrá volver a acceder</b> a la plataforma.</p>`,
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#c0392b',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'Sí, banear',
            cancelButtonText: 'Cancelar'
        });

        if (!confirm.isConfirmed) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${apiUrl}/api/auth/ban/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsuarios(usuarios.filter(u => u.id !== id));
            Swal.fire('¡Baneado!', 'El usuario ha sido bloqueado permanentemente.', 'success');
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Hubo un problema al banear al usuario.', 'error');
        }
    };

    const handleReactivar = async (id, nombre) => {
        const confirm = await Swal.fire({
            title: '¿Reactivar usuario?',
            text: `¿Estás seguro de que deseas quitarle el bloqueo a ${nombre || 'este usuario'}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirm.isConfirmed) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${apiUrl}/api/auth/unban/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setBannedUsuarios(bannedUsuarios.filter(u => u.id !== id));
            Swal.fire('¡Reactivado!', 'El usuario ha sido desbloqueado y puede ingresar a la plataforma.', 'success');
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Hubo un problema al reactivar el usuario.', 'error');
        }
    };

    const currentList = activeTab === 'pending' ? usuarios : bannedUsuarios;

    return (
        <div className="admin-container fade-in">
            <h1>👤 Gestión de Usuarios</h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={() => setActiveTab('pending')}
                        className={`btn-secondary ${activeTab === 'pending' ? 'active-tab' : ''}`}
                        style={{ borderBottom: activeTab === 'pending' ? '3px solid #764ba2' : 'none' }}
                    >
                        ⏳ Pendientes de Aprobación ({activeTab === 'pending' ? currentList.length : usuarios.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('banned')}
                        className={`btn-secondary ${activeTab === 'banned' ? 'active-tab' : ''}`}
                        style={{ borderBottom: activeTab === 'banned' ? '3px solid #e74c3c' : 'none' }}
                    >
                        🚫 Usuarios Desactivados ({activeTab === 'banned' ? currentList.length : bannedUsuarios.length})
                    </button>
                </div>
                <button onClick={() => navigate('/')} className="btn-secondary">Volver al Inicio</button>
            </div>

            {loading && <p>Cargando usuarios...</p>}
            {error && <p className="error-msg">{error}</p>}

            <div className="suggestions-list" style={{ marginTop: '20px' }}>
                {currentList.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '40px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <h3>{activeTab === 'pending' ? 'No hay usuarios pendientes' : 'No hay usuarios desactivados'}</h3>
                        <p>{activeTab === 'pending' ? 'Todos los usuarios registrados han sido aprobados.' : 'El sistema está limpio de usuarios bloqueados.'}</p>
                    </div>
                )}

                {currentList.map(u => (
                    <div key={u.id} className="suggestion-card" style={{
                        background: '#f8f9fa', padding: '15px', marginBottom: '15px',
                        borderRadius: '8px', border: '1px solid #ddd',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px'
                    }}>
                        <div>
                            <h3 style={{ margin: '0 0 5px 0' }}>{u.name || 'Usuario Anónimo'}</h3>
                            <p style={{ margin: '0', color: '#666' }}><strong>Email:</strong> {u.email}</p>
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#888' }}>
                                <strong>Registrado el:</strong> {new Date(u.createdAt).toLocaleDateString()} a las {new Date(u.createdAt).toLocaleTimeString()}
                            </p>
                        </div>

                        <div className="actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {activeTab === 'pending' ? (
                                <>
                                    <button
                                        onClick={() => handleAprobar(u.id, u.name)}
                                        style={{ background: '#28a745', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                                    >
                                        ✅ Aprobar
                                    </button>
                                    <button
                                        onClick={() => handleRechazar(u.id, u.name)}
                                        style={{ background: '#e67e22', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                                    >
                                        ❌ Rechazar
                                    </button>
                                    <button
                                        onClick={() => handleBanear(u.id, u.name)}
                                        style={{ background: '#c0392b', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                                    >
                                        🚫 Banear
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => handleReactivar(u.id, u.name)}
                                    className="btn-success"
                                    style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    ♻️ Reactivar Usuario
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
