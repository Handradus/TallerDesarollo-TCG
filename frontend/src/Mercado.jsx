import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import './css/index.css';
import './css/modules.css';
import AdBanner from './components/AdBanner';
import Swal from 'sweetalert2';

export default function Mercado() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSet, setFilterSet] = useState('');
    const [filterRarity, setFilterRarity] = useState('');
    const [sortOption, setSortOption] = useState('date_desc'); // date_desc, price_asc, price_desc

    const [messageText, setMessageText] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [reportItem, setReportItem] = useState(null);
    const [reportReason, setReportReason] = useState('');
    const { user } = useAuth();
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchMarket();
    }, [searchTerm, filterSet, filterRarity, sortOption]);

    const fetchMarket = async () => {
        setLoading(true);
        try {
            let url = `${apiUrl}/api/market/search?query=${searchTerm}`;

            if (filterSet) url += `&set=${filterSet}`;
            if (filterRarity) url += `&rarity=${filterRarity}`;

            if (sortOption === 'price_asc') {
                url += `&sort=price&direction=asc`;
            } else if (sortOption === 'price_desc') {
                url += `&sort=price&direction=desc`;
            }

            const res = await axios.get(url);
            setItems(res.data);
        } catch (error) {
            console.error('Error fetching market:', error);
        } finally {
            setLoading(false);
        }
    };

    const contactSeller = async () => {
        if (!messageText.trim()) {
            Swal.fire('Atención', 'Escribe un mensaje', 'warning');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${apiUrl}/api/messages/send`, {
                receiverId: selectedItem.user.id,
                content: messageText,
                marketItemId: selectedItem.id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Swal.fire('¡Éxito!', 'Mensaje enviado!', 'success');
            setSelectedItem(null);
            setMessageText('');
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Error enviando mensaje', 'error');
        }
    }

    const submitReport = async () => {
        if (!reportReason.trim()) {
            Swal.fire('Atención', 'Por favor, ingresa un motivo', 'warning');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${apiUrl}/api/reports`, {
                marketItemId: reportItem.id,
                reason: reportReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Swal.fire('¡Gracias!', 'Reporte enviado correctamente.', 'success');
            setReportItem(null);
            setReportReason('');
        } catch (error) {
            console.error(error);
            if (error.response && error.response.data && error.response.data.error) {
                Swal.fire('Error', error.response.data.error, 'error');
            } else {
                Swal.fire('Error', 'Error al enviar el reporte', 'error');
            }
        }
    }

    return (
        <div className="collection-layout fade-in">
            {/* Sidebar Filters */}
            <div className="binders-sidebar">
                <h3>🔍 Filtros y Búsqueda</h3>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#555' }}>Búsqueda</label>
                    <input
                        type="text"
                        placeholder="Nombre de carta o vendedor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="text-input"
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#555' }}>Filtrar por Set</label>
                    <input
                        type="text"
                        placeholder="Ej: Base Set, Evolving Skies..."
                        value={filterSet}
                        onChange={e => setFilterSet(e.target.value)}
                        className="text-input"
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#555' }}>Rareza</label>
                    <select
                        value={filterRarity}
                        onChange={e => setFilterRarity(e.target.value)}
                        className="filter-select"
                        style={{ width: '100%' }}
                    >
                        <option value="">Todas las Rarezas</option>
                        <option value="Common">Common</option>
                        <option value="Uncommon">Uncommon</option>
                        <option value="Rare">Rare</option>
                        <option value="Double Rare">Double Rare</option>
                        <option value="Illustration Rare">Illustration Rare</option>
                        <option value="Special Illustration Rare">Special Illustration Rare</option>
                        <option value="Hyper Rare">Hyper Rare</option>
                    </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#555' }}>Ordenar por</label>
                    <select
                        value={sortOption}
                        onChange={e => setSortOption(e.target.value)}
                        className="filter-select"
                        style={{ width: '100%' }}
                    >
                        <option value="date_desc">Más Recientes</option>
                        <option value="price_asc">Precio: Menor a Mayor</option>
                        <option value="price_desc">Precio: Mayor a Menor</option>
                    </select>
                </div>
            </div>

            {/* Main Content */}
            <div className="collection-content">
                <div className="collection-header">
                    <h1>🏪 Mercado de Entrenadores</h1>
                </div>

                {/* Banners publicitarios */}
                <AdBanner layout="bottom" />

                {loading ? <div className="loading-spinner">Cargando mercado...</div> : (
                    <div className="results-grid">
                        {items.length === 0 ? (
                            <div className="empty-state">
                                <p>No se encontraron resultados con estos filtros.</p>
                            </div>
                        ) : (
                            items.map(item => (
                                <div key={item.id} className="card-item">
                                    <div className="card-image-container">
                                        <img src={item.realImage ? `${apiUrl}${item.realImage}` : item.carta.imagenPequena} alt={item.carta.nombre} />
                                    </div>
                                    <div className="card-info">
                                        <h3>{item.carta.nombre}</h3>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <span style={{
                                                background: '#4CAF50',
                                                color: 'white',
                                                borderRadius: '15px',
                                                padding: '4px 10px',
                                                fontWeight: 'bold',
                                                fontSize: '0.9rem'
                                            }}>${item.price}</span>

                                            <span style={{ fontSize: '0.8rem', color: '#666' }}>
                                                👤 <a href={`/profile/${item.user.id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 'bold' }}>{item.user.name}</a>
                                            </span>
                                        </div>

                                        <div style={{ fontSize: '0.8rem', color: '#555', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                            {(item.deliveryType === 'envio' || item.deliveryType === 'ambos') && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    🚚 Envíos a todo Chile
                                                </span>
                                            )}
                                            {(item.deliveryType === 'presencial' || item.deliveryType === 'ambos') && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    🤝 Presencial {item.region ? `(${item.region})` : ''}
                                                </span>
                                            )}
                                        </div>

                                        {item.realImage && <span style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '8px', background: '#eee', padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>📸 Foto Real</span>}

                                        {item.description && (
                                            <p style={{ fontSize: '0.85rem', color: '#777', fontStyle: 'italic', marginBottom: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                "{item.description}"
                                            </p>
                                        )}

                                        {user && user.id !== item.userId ? (
                                            <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
                                                <button
                                                    onClick={() => setSelectedItem(item)}
                                                    className="btn-primary"
                                                    style={{ flex: 1, fontSize: '0.9rem', padding: '10px' }}
                                                >
                                                    📩 Contactar
                                                </button>
                                                <button
                                                    onClick={() => setReportItem(item)}
                                                    className="btn-danger"
                                                    style={{ fontSize: '0.9rem', padding: '10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                    title="Reportar Publicación"
                                                >
                                                    🚩
                                                </button>
                                            </div>
                                        ) : (
                                            !user ? (
                                                <small style={{ display: 'block', textAlign: 'center', color: '#888' }}>Inicia sesión para comprar</small>
                                            ) : (
                                                <small style={{ display: 'block', textAlign: 'center', color: '#888' }}>Es tu publicación</small>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {selectedItem && (
                <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedItem(null)}>&times;</button>
                        <h2 style={{ marginTop: 0, color: '#333' }}>Contactar Vendedor</h2>

                        <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '10px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'flex-start', flexDirection: selectedItem.realImage ? 'column' : 'row' }}>
                            {selectedItem.realImage ? (
                                <div style={{ width: '100%', textAlign: 'center' }}>
                                    <img src={`${apiUrl}${selectedItem.realImage}`} alt="Real State" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                    <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>Foto real del producto</p>
                                </div>
                            ) : (
                                <img src={selectedItem.carta.imagenPequena} alt="" style={{ height: '80px' }} />
                            )}

                            <div style={{ width: '100%' }}>
                                <h4 style={{ margin: 0 }}>{selectedItem.carta.nombre}</h4>
                                <p style={{ margin: '5px 0', color: '#4CAF50', fontWeight: 'bold' }}>${selectedItem.price}</p>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Vendedor: {selectedItem.user.name}</p>
                            </div>
                        </div>

                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Tu Mensaje:</label>
                        <textarea
                            value={messageText}
                            onChange={e => setMessageText(e.target.value)}
                            className="text-input"
                            placeholder={"Hola, me interesa comprar tu carta " + selectedItem.carta.nombre + "..."}
                            style={{ height: '100px', fontFamily: 'inherit', marginBottom: '20px' }}
                        ></textarea>

                        <div style={{ textAlign: 'right' }}>
                            <button className="btn-secondary" onClick={() => setSelectedItem(null)} style={{ marginRight: '10px' }}>Cancelar</button>
                            <button onClick={contactSeller} className="btn-primary">Enviar Mensaje</button>
                        </div>
                    </div>
                </div>
            )}

            {reportItem && (
                <div className="modal-overlay" onClick={() => setReportItem(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setReportItem(null)}>&times;</button>
                        <h2 style={{ marginTop: 0, color: '#e74c3c' }}>🚩 Reportar Publicación</h2>
                        <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '15px' }}>
                            Si esta publicación incumple las normas (ej: foto falsa, fraude, contenido inapropiado), envíanos un reporte detallado.
                        </p>

                        <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '10px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                            <img src={reportItem.realImage ? `${apiUrl}${reportItem.realImage}` : reportItem.carta.imagenPequena} alt="" style={{ height: '80px', borderRadius: '4px' }} />
                            <div>
                                <h4 style={{ margin: 0 }}>{reportItem.carta.nombre}</h4>
                                <p style={{ margin: '5px 0', fontSize: '0.85rem', color: '#666' }}>Vendedor: {reportItem.user.name}</p>
                            </div>
                        </div>

                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Motivo del Reporte:</label>
                        <textarea
                            value={reportReason}
                            onChange={e => setReportReason(e.target.value)}
                            className="text-input"
                            placeholder="Ej: La imagen no corresponde a la carta, parece estafa..."
                            style={{ height: '100px', fontFamily: 'inherit', marginBottom: '20px' }}
                        ></textarea>

                        <div style={{ textAlign: 'right' }}>
                            <button className="btn-secondary" onClick={() => setReportItem(null)} style={{ marginRight: '10px' }}>Cancelar</button>
                            <button onClick={submitReport} className="btn-danger" style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Enviar Reporte</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
