import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../css/admin.css'; // Reusing admin styles or create new
import Swal from 'sweetalert2';

export default function AdminModeracion() {
    const [sugerencias, setSugerencias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchSugerencias();
    }, []);

    const fetchSugerencias = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${apiUrl}/api/tiendas/sugerencias?status=pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setSugerencias(res.data.suggestions);
            }
        } catch (e) {
            setError('Error cargando sugerencias');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleModeracion = async (id, accion) => {
        const confirmResult = await Swal.fire({
            title: '¿Confirmar moderación?',
            text: `¿Estás seguro de ${accion === 'approve' ? 'APROBAR' : 'RECHAZAR'} esta tienda?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: accion === 'approve' ? '#28a745' : '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, confirmar',
            cancelButtonText: 'Cancelar'
        });
        
        if (!confirmResult.isConfirmed) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${apiUrl}/api/tiendas/sugerencias/${id}/moderar`, { accion }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Remove from list
            setSugerencias(sugerencias.filter(s => s.id !== id));
            Swal.fire('¡Éxito!', `Sugerencia ${accion === 'approve' ? 'aprobada' : 'rechazada'} exitosamente`, 'success');
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Error al moderar', 'error');
        }
    };

    return (
        <div className="admin-container">
            <h1>⚖️ Moderación de Tiendas</h1>
            <button onClick={() => navigate('/tiendas')} className="btn-secondary">Volver a Tiendas</button>

            {loading && <p>Cargando...</p>}
            {error && <p className="error-msg">{error}</p>}

            <div className="suggestions-list" style={{ marginTop: '20px' }}>
                {sugerencias.length === 0 && !loading && <p>No hay sugerencias pendientes.</p>}

                {sugerencias.map(s => (
                    <div key={s.id} className="suggestion-card" style={{
                        background: '#f8f9fa', padding: '15px', marginBottom: '15px',
                        borderRadius: '8px', border: '1px solid #ddd'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h3>{s.nombre}</h3>
                            <span className={`badge ${s.tipo}`}>{s.tipo}</span>
                        </div>
                        <p><strong>URL:</strong> {s.urlBase}</p>
                        <p><strong>Región:</strong> {s.region || 'N/A'}</p>
                        <p><strong>Sugerido por:</strong> {s.user?.name || 'Anónimo'}</p>

                        <div className="actions" style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => handleModeracion(s.id, 'approve')}
                                className="btn-success"
                                style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                ✅ Aprobar
                            </button>
                            <button
                                onClick={() => handleModeracion(s.id, 'reject')}
                                className="btn-danger"
                                style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                ❌ Rechazar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
