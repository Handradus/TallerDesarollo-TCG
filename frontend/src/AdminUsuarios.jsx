import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import './css/admin.css';

export default function AdminUsuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const fetchUsuarios = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${apiUrl}/api/auth/pending-users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.pending) {
                setUsuarios(res.data.pending);
            }
        } catch (e) {
            setError('Error cargando usuarios pendientes');
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
            
            // Eliminar de la lista
            setUsuarios(usuarios.filter(u => u.id !== id));
            
            Swal.fire(
                '¡Aprobado!',
                'El usuario ahora puede iniciar sesión en la plataforma.',
                'success'
            );
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Hubo un problema al aprobar el usuario.', 'error');
        }
    };

    return (
        <div className="admin-container">
            <h1>👤 Usuarios Pendientes de Aprobación</h1>
            <button onClick={() => navigate('/')} className="btn-secondary">Volver al Inicio</button>

            {loading && <p>Cargando usuarios...</p>}
            {error && <p className="error-msg">{error}</p>}

            <div className="suggestions-list" style={{ marginTop: '20px' }}>
                {usuarios.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '40px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <h3>No hay usuarios pendientes</h3>
                        <p>Todos los usuarios registrados han sido aprobados.</p>
                    </div>
                )}

                {usuarios.map(u => (
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

                        <div className="actions">
                            <button
                                onClick={() => handleAprobar(u.id, u.name)}
                                className="btn-success"
                                style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                ✅ Aprobar Acceso
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
