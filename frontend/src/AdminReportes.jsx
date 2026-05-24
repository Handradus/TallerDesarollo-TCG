import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/admin.css';
import Swal from 'sweetalert2';

export default function AdminReportes() {
    const [reportes, setReportes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    const [activeTab, setActiveTab] = useState('market'); // 'market' or 'users'

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
        let confirmText = '';
        if (accion === 'ignore') confirmText = 'IGNORAR este reporte';
        if (accion === 'delete_post') confirmText = 'ELIMINAR la publicación reportada';
        if (accion === 'ban_user') confirmText = 'DESACTIVAR la cuenta del usuario implicado';

        const confirmResult = await Swal.fire({
            title: '¿Confirmar resolución?',
            text: `¿Estás seguro de que deseas ${confirmText}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: accion === 'ignore' ? '#3085d6' : '#d33',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'Sí, confirmar',
            cancelButtonText: 'Cancelar'
        });
        
        if (!confirmResult.isConfirmed) return;

        try {
            const token = localStorage.getItem('token');
            const report = reportes.find(r => r.id === id);

            // Si la acción es banear usuario, lo hacemos antes de resolver el reporte
            if (accion === 'ban_user') {
                const userIdToBan = report?.reportedUser?.id || report?.marketItem?.user?.id;
                if (userIdToBan) {
                    await axios.post(`${apiUrl}/api/auth/ban/${userIdToBan}`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            }

            // Resolver el reporte
            await axios.post(`${apiUrl}/api/reports/${id}/resolve`, { action: accion }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Remover de la lista local
            if (accion === 'delete_post') {
                if (report) {
                    setReportes(reportes.filter(r => r.marketItemId !== report.marketItemId));
                }
            } else if (accion === 'ban_user') {
                const userIdToBan = report?.reportedUser?.id || report?.marketItem?.user?.id;
                // Remover todos los reportes sobre este usuario
                setReportes(reportes.filter(r => 
                    (r.reportedUser?.id !== userIdToBan) && 
                    (r.marketItem?.user?.id !== userIdToBan)
                ));
            } else {
                setReportes(reportes.filter(r => r.id !== id));
            }
            Swal.fire('¡Éxito!', 'Acción aplicada exitosamente.', 'success');
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Error al resolver el reporte', 'error');
        }
    };

    const filteredReports = reportes.filter(r => {
        if (activeTab === 'users') return r.reportedUserId !== null;
        return r.marketItemId !== null;
    });

    return (
        <div className="admin-container fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>🚩 Centro de Reportes</h1>
                <button onClick={() => navigate('/tiendas')} className="btn-secondary">Volver al inicio</button>
            </div>

            <div className="mensajes-tabs" style={{ marginBottom: '30px' }}>
                <button 
                    className={`tab-btn ${activeTab === 'market' ? 'active' : ''}`}
                    onClick={() => setActiveTab('market')}
                >
                    📦 Reportes de Publicaciones ({reportes.filter(r => r.marketItemId).length})
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    💬 Reportes de Chats ({reportes.filter(r => r.reportedUserId).length})
                </button>
            </div>

            {loading && <p>Cargando reportes...</p>}
            {error && <p className="error-msg">{error}</p>}

            <div className="suggestions-list">
                {filteredReports.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '40px', background: '#f8f9fa', borderRadius: '12px' }}>
                        <h3>Bandeja limpia</h3>
                        <p>No hay reportes pendientes en esta categoría.</p>
                    </div>
                )}

                {filteredReports.map(r => (
                    <div key={r.id} className="suggestion-card" style={{
                        background: '#f8f9fa', padding: '20px', marginBottom: '20px',
                        borderRadius: '12px', border: '1px solid #eee',
                        display: 'flex', gap: '25px', alignItems: 'flex-start',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                    }}>
                        {/* Imagen lateral */}
                        <div style={{ width: '120px', flexShrink: 0 }}>
                            {r.marketItem ? (
                                <img 
                                    src={r.marketItem.realImage ? `${apiUrl}${r.marketItem.realImage}` : (r.marketItem.carta ? r.marketItem.carta.imagenPequena : '')} 
                                    alt="Item" 
                                    style={{ width: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} 
                                />
                            ) : (
                                <img 
                                    src={r.reportedUser?.picture || 'https://via.placeholder.com/150'} 
                                    alt="User" 
                                    style={{ width: '100%', borderRadius: '50%', aspectRatio: '1/1', objectFit: 'cover' }} 
                                />
                            )}
                        </div>
                        
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h3 style={{ margin: 0 }}>Reportado por: {r.reporter?.name}</h3>
                                <span style={{ color: '#888', fontSize: '0.9rem' }}>{new Date(r.createdAt).toLocaleString()}</span>
                            </div>
                            
                            <div style={{ margin: '15px 0', padding: '12px', background: '#fff', borderRadius: '8px', borderLeft: '4px solid #e74c3c' }}>
                                <strong>Motivo:</strong> {r.reason}
                            </div>
                            
                            {r.marketItem && (
                                <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #eee', marginTop: '10px' }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: '#444' }}>Publicación Reportada</h4>
                                    <div style={{ fontSize: '0.95rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <p style={{ margin: 0 }}><strong>Carta:</strong> {r.marketItem.carta?.nombre}</p>
                                        <p style={{ margin: 0 }}><strong>Vendedor:</strong> {r.marketItem.user?.name}</p>
                                        <p style={{ margin: 0 }}><strong>Precio:</strong> ${r.marketItem.price}</p>
                                    </div>
                                    <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                                        <strong>Descripción:</strong> {r.marketItem.description}
                                    </p>
                                </div>
                            )}

                            {r.reportedUser && (
                                <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #eee', marginTop: '10px' }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: '#c0392b' }}>Usuario Reportado (Chat)</h4>
                                    <p style={{ margin: 0 }}><strong>Nombre:</strong> {r.reportedUser.name}</p>
                                    <p style={{ margin: 0 }}><strong>Email:</strong> {r.reportedUser.email}</p>
                                </div>
                            )}

                            <div className="actions" style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => handleResolucion(r.id, 'ignore')}
                                    className="btn-secondary"
                                    style={{ padding: '10px 20px', borderRadius: '6px', fontWeight: '500' }}
                                >
                                    👀 Ignorar
                                </button>
                                
                                {r.marketItem && (
                                    <>
                                        <button
                                            onClick={() => handleResolucion(r.id, 'delete_post')}
                                            className="btn-danger"
                                            style={{ padding: '10px 20px', borderRadius: '6px', background: '#dc3545', color: 'white', border: 'none' }}
                                        >
                                            🗑️ Borrar Publicación
                                        </button>
                                        <button
                                            onClick={() => handleResolucion(r.id, 'ban_user')}
                                            className="btn-danger"
                                            style={{ padding: '10px 20px', borderRadius: '6px', background: '#333', color: 'white', border: 'none' }}
                                        >
                                            🚫 Desactivar Vendedor ({r.marketItem.user?.name})
                                        </button>
                                    </>
                                )}

                                {r.reportedUser && (
                                    <button
                                        onClick={() => handleResolucion(r.id, 'ban_user')}
                                        className="btn-danger"
                                        style={{ padding: '10px 20px', borderRadius: '6px', background: '#c0392b', color: 'white', border: 'none' }}
                                    >
                                        🚫 Desactivar Usuario ({r.reportedUser.name})
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
