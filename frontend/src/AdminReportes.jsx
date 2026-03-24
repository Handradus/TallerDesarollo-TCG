import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/admin.css';

export default function AdminReportes() {
    const [reportes, setReportes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchReportes();
    }, []);

    const fetchReportes = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${apiUrl}/api/reports/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportes(res.data);
        } catch (e) {
            setError('Error cargando reportes');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleResolucion = async (id, accion) => {
        const confirmar = confirm(`¿Estás seguro de que deseas ${accion === 'ignore' ? 'IGNORAR este reporte' : 'ELIMINAR la publicación reportada'}?`);
        if (!confirmar) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${apiUrl}/api/reports/${id}/resolve`, { action: accion }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Remover de la lista ambos si eliminamos publicación (la DB elimina por cascada o el backend ya filtró)
            // Forma rápida de limpiar el estado: recargar reportes o filtrar el que se resolvió
            if (accion === 'delete_post') {
                const report = reportes.find(r => r.id === id);
                if (report) {
                    setReportes(reportes.filter(r => r.marketItemId !== report.marketItemId));
                }
            } else {
                setReportes(reportes.filter(r => r.id !== id));
            }
            alert(`Reporte ${accion === 'ignore' ? 'ignorado' : 'y publicación eliminada'} exitosamente`);
        } catch (e) {
            console.error(e);
            alert('Error al resolver el reporte');
        }
    };

    return (
        <div className="admin-container">
            <h1>🚩 Reportes de Usuarios</h1>
            <button onClick={() => navigate('/tiendas')} className="btn-secondary">Volver al inicio</button>

            {loading && <p>Cargando reportes...</p>}
            {error && <p className="error-msg">{error}</p>}

            <div className="suggestions-list" style={{ marginTop: '20px' }}>
                {reportes.length === 0 && !loading && <p>No hay reportes pendientes de revisión.</p>}

                {reportes.map(r => (
                    <div key={r.id} className="suggestion-card" style={{
                        background: '#f8f9fa', padding: '15px', marginBottom: '15px',
                        borderRadius: '8px', border: '1px solid #ddd',
                        display: 'flex', gap: '20px', alignItems: 'flex-start'
                    }}>
                        {/* Imágen del MarketItem */}
                        <div style={{ width: '150px', flexShrink: 0 }}>
                            {r.marketItem ? (
                                <img 
                                    src={r.marketItem.realImage ? `${apiUrl}${r.marketItem.realImage}` : (r.marketItem.carta ? r.marketItem.carta.imagenPequena : '')} 
                                    alt="Reported item" 
                                    style={{ width: '100%', borderRadius: '4px' }} 
                                />
                            ) : (
                                <div style={{width:'100%', height:'150px', background:'#eee', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                    PUBLICACIÓN BORRADA
                                </div>
                            )}
                        </div>
                        
                        {/* Detalles */}
                        <div style={{ flex: 1 }}>
                            <h3>Reportado por: {r.reporter?.name || 'Usuario Removido'}</h3>
                            <p><strong>Fecha del reporte:</strong> {new Date(r.createdAt).toLocaleString()}</p>
                            <p><strong>Motivo / Razón:</strong> {r.reason}</p>
                            
                            {r.marketItem && (
                                <div style={{ background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #eee', marginTop: '10px' }}>
                                    <h4 style={{ margin: '0 0 5px 0' }}>Datos de la Publicación</h4>
                                    <p style={{ margin: 0 }}><strong>Carta:</strong> {r.marketItem.carta?.nombre}</p>
                                    <p style={{ margin: 0 }}><strong>Vendedor:</strong> {r.marketItem.user?.name}</p>
                                    <p style={{ margin: 0 }}><strong>Precio:</strong> ${r.marketItem.price}</p>
                                    <p style={{ margin: 0 }}><strong>Descripción:</strong> {r.marketItem.description}</p>
                                </div>
                            )}

                            <div className="actions" style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => handleResolucion(r.id, 'ignore')}
                                    className="btn-secondary"
                                    style={{ padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    👀 Ignorar y Cerrar Reporte
                                </button>
                                <button
                                    onClick={() => handleResolucion(r.id, 'delete_post')}
                                    className="btn-danger"
                                    style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}
                                    disabled={!r.marketItem}
                                >
                                    🗑️ Eliminar Publicación ({r.marketItem?.user?.name})
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
