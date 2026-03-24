import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './css/index.css';

export default function Coleccion() {
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [binders, setBinders] = useState([]);
    const [selectedBinderId, setSelectedBinderId] = useState(null); // null = 'General' / 'All'

    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // UI States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newBinderName, setNewBinderName] = useState('');

    // Filter states
    const [selectedSet, setSelectedSet] = useState('');
    const [selectedRarity, setSelectedRarity] = useState('');
    const [showPrices, setShowPrices] = useState(false);

    // Edit Item Modal States
    const [editItem, setEditItem] = useState(null);
    const [editForm, setEditForm] = useState({ condition: '', language: '', foilType: '' });

    useEffect(() => {
        fetchBinders();
    }, []);

    useEffect(() => {
        fetchCollection();
    }, [selectedBinderId]);

    const fetchBinders = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/collection/binders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBinders(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchCollection = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            let url = `${import.meta.env.VITE_API_BASE_URL}/api/collection`;
            if (selectedBinderId) {
                url += `?binderId=${selectedBinderId}`;
            }

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCards(res.data);
        } catch (error) {
            console.error('Error fetching collection:', error);
        } finally {
            setLoading(false);
        }
    };

    const createBinder = async () => {
        if (!newBinderName) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/collection/binders`,
                { name: newBinderName },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewBinderName('');
            setShowCreateModal(false);
            fetchBinders();
        } catch (e) {
            console.error(e);
            alert('Error creando carpeta');
        }
    }

    const removeFromCollection = async (cartaId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/collection/remove`,
                { cartaId, binderId: selectedBinderId }, // Pass binder if scoped
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchCollection();
        } catch (error) {
            console.error('Error removing card:', error);
        }
    }

    const openEditModal = (item) => {
        setEditItem(item);
        setEditForm({
            condition: item.condition || 'NM',
            language: item.language || 'ES',
            foilType: item.foilType || 'Normal'
        });
    };

    const submitEditItem = async () => {
        if (!editItem) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/collection/item/${editItem.collectionId}`,
                editForm,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setEditItem(null);
            fetchCollection(); // Refresh
        } catch (e) {
            console.error('Error updating item:', e);
            alert('Error al actualizar la carta');
        }
    };

    // Derived lists for dropdowns based on CURRENT view
    const sets = [...new Set(cards.map(c => c.set).filter(Boolean))].sort();
    const rarities = [...new Set(cards.map(c => c.rareza).filter(Boolean))].sort();

    // Filter Logic
    const filteredCards = cards.filter(card => {
        if (selectedSet && card.set !== selectedSet) return false;
        if (selectedRarity && card.rareza !== selectedRarity) return false;
        return true;
    });

    // Group cards by Set
    const cardsBySet = filteredCards.reduce((acc, card) => {
        const setName = card.set || 'Sin Set';
        if (!acc[setName]) {
            acc[setName] = [];
        }
        acc[setName].push(card);
        return acc;
    }, {});

    // Calculate Total Value (only for owned cards)
    const totalValue = filteredCards.reduce((sum, card) => {
        if (!card.isOwned && card.quantity === 0) return sum;
        const price = parseFloat(card.precioPriceCharting || card.precioNormal || 0);
        return sum + (price * (card.quantity || 1));
    }, 0);

    if (!user) return <div className="container"><h2>Debes iniciar sesión para ver tu colección.</h2></div>;

    return (
        <div className="collection-layout fade-in">
            {/* Sidebar for Binders */}
            <div className="binders-sidebar">
                <h3>📚 Mis Carpetas</h3>
                <ul>
                    <li
                        className={selectedBinderId === null ? 'active' : ''}
                        onClick={() => setSelectedBinderId(null)}
                    >
                        🗂️ Todas las Cartas
                    </li>
                    {binders.map(b => (
                        <li
                            key={b.id}
                            className={selectedBinderId === b.id ? 'active' : ''}
                            onClick={() => setSelectedBinderId(b.id)}
                        >
                            📁 {b.name}
                        </li>
                    ))}
                </ul>
                <button
                    className="btn-add-binder"
                    onClick={() => setShowCreateModal(true)}
                >
                    + Nueva Carpeta
                </button>
            </div>

            {/* Main Content */}
            <div className="collection-content">
                <div className="collection-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
                        <h1>{selectedBinderId ? binders.find(b => b.id === selectedBinderId)?.name : 'Mi Colección Completa'}</h1>
                        {showPrices && (
                            <div style={{
                                background: '#4CAF50', color: 'white', padding: '10px 20px', borderRadius: '8px',
                                fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                            }}>
                                Valor Total Estimado: ${totalValue.toFixed(2)} USD
                            </div>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="filters-row">
                        <select
                            value={selectedSet}
                            onChange={e => setSelectedSet(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">Todos los Sets</option>
                            {sets.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        <select
                            value={selectedRarity}
                            onChange={e => setSelectedRarity(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">Todas las Rarezas</option>
                            {rarities.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }}>
                            <input
                                type="checkbox"
                                checked={showPrices}
                                onChange={e => setShowPrices(e.target.checked)}
                            />
                            <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>Mostrar Precios (USD)</span>
                        </label>
                    </div>
                </div>

                {loading ? <div className="loading-spinner">Cargando colección...</div> : (
                    <>
                        {Object.keys(cardsBySet).length === 0 ? (
                            <div className="empty-state">
                                <p>No hay cartas en esta vista.</p>
                                {!selectedBinderId && <p>¡Ve al buscador para agregar cartas!</p>}
                            </div>
                        ) : (
                            Object.keys(cardsBySet).sort().map(setName => (
                                <div key={setName} className="set-group">
                                    <h2 className="set-title">{setName}</h2>
                                    <div className="results-grid">
                                        {cardsBySet[setName].map(card => (
                                            <div key={card.collectionId} className={`card-item collection-card ${(!card.isOwned || card.quantity === 0) ? 'is-wanted' : ''}`}>
                                                <div
                                                    style={{ cursor: 'pointer', position: 'relative' }}
                                                    onClick={() => window.open(`/carta/${card.id}`, '_blank')}
                                                    title="Ver detalles de la carta"
                                                >
                                                    <img
                                                        src={card.imagenPequena}
                                                        alt={card.nombre}
                                                        loading="lazy"
                                                        style={(!card.isOwned || card.quantity === 0) ? { filter: 'grayscale(100%) opacity(0.7)' } : {}}
                                                    />
                                                    {(!card.isOwned || card.quantity === 0) && (
                                                        <div style={{
                                                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                                            background: 'rgba(0,0,0,0.7)', color: 'white', padding: '5px 10px', borderRadius: '5px',
                                                            fontWeight: 'bold', pointerEvents: 'none', fontSize: '0.8rem'
                                                        }}>
                                                            LO QUIERO
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="card-info">
                                                    <h4>{card.nombre}</h4>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span className="card-qty">
                                                            {(!card.isOwned || card.quantity === 0) ? 'Deseada' : `x${card.quantity}`}
                                                        </span>
                                                        {showPrices && (card.isOwned || card.quantity > 0) && (
                                                            <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                                ${(parseFloat(card.precioPriceCharting || card.precioNormal || 0)).toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Custom Properties Badges */}
                                                    {(card.isOwned || card.quantity > 0) && (
                                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '5px' }}>
                                                            {card.condition && <span style={{fontSize: '0.7rem', background: '#eee', padding: '2px 6px', borderRadius: '4px', border: '1px solid #ddd'}}>{card.condition}</span>}
                                                            {card.language && <span style={{fontSize: '0.7rem', background: '#eee', padding: '2px 6px', borderRadius: '4px', border: '1px solid #ddd'}}>{card.language}</span>}
                                                            {card.foilType && card.foilType !== 'Normal' && <span style={{fontSize: '0.7rem', background: 'linear-gradient(45deg, #ffd700, #ff8c00)', color: 'white', padding: '2px 6px', borderRadius: '4px'}}>{card.foilType}</span>}
                                                        </div>
                                                    )}

                                                    <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                                        {(!card.isOwned || card.quantity === 0) ? (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const addToCollection = async () => {
                                                                        try {
                                                                            const token = localStorage.getItem('token');
                                                                            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/collection/add`,
                                                                                { cartaId: card.id, isOwned: true, binderId: selectedBinderId },
                                                                                { headers: { Authorization: `Bearer ${token}` } }
                                                                            );
                                                                            fetchCollection();
                                                                        } catch (e) { console.error(e); }
                                                                    };
                                                                    addToCollection();
                                                                }}
                                                                className="btn-primary btn-sm"
                                                                style={{ fontSize: '0.8rem', padding: '2px 8px', backgroundColor: '#4CAF50' }}
                                                                title="Ya la conseguí (Marcar como obtenida)"
                                                            >
                                                                ✅ Conseguí
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); navigate('/mi-tienda', { state: { sellCard: card } }); }}
                                                                className="btn-secondary btn-sm"
                                                                style={{ fontSize: '0.8rem', padding: '2px 8px' }}
                                                                title="Vender en Mercado"
                                                            >
                                                                💰
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openEditModal(card); }}
                                                            className="btn-secondary btn-sm"
                                                            title="Editar detalles (Estado, Idioma...)"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeFromCollection(card.id); }}
                                                            className="btn-danger btn-sm"
                                                            title="Eliminar de la colección"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}
            </div>

            {/* Create Binder Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Crear Nueva Carpeta</h3>
                        <input
                            type="text"
                            placeholder="Nombre de la carpeta (ej: Shinies)"
                            value={newBinderName}
                            onChange={e => setNewBinderName(e.target.value)}
                            className="text-input"
                            autoFocus
                        />
                        <div style={{ marginTop: '15px', textAlign: 'right' }}>
                            <button className="btn-secondary" onClick={() => setShowCreateModal(false)} style={{ marginRight: '10px' }}>Cancelar</button>
                            <button className="btn-primary" onClick={createBinder}>Crear</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Item Modal */}
            {editItem && (
                <div className="modal-overlay" onClick={() => setEditItem(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Editar Carta: {editItem.nombre}</h3>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Estado (Condition)</label>
                            <select 
                                className="filter-select" 
                                style={{ width: '100%' }}
                                value={editForm.condition} 
                                onChange={e => setEditForm({...editForm, condition: e.target.value})}
                            >
                                <option value="NM">Near Mint (NM)</option>
                                <option value="LP">Lightly Played (LP)</option>
                                <option value="MP">Moderately Played (MP)</option>
                                <option value="HP">Heavily Played (HP)</option>
                                <option value="DM">Damaged (DM)</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Idioma</label>
                            <select 
                                className="filter-select" 
                                style={{ width: '100%' }}
                                value={editForm.language} 
                                onChange={e => setEditForm({...editForm, language: e.target.value})}
                            >
                                <option value="ES">Español (ES)</option>
                                <option value="EN">Inglés (EN)</option>
                                <option value="JP">Japonés (JP)</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Tipo (Foil)</label>
                            <select 
                                className="filter-select" 
                                style={{ width: '100%' }}
                                value={editForm.foilType} 
                                onChange={e => setEditForm({...editForm, foilType: e.target.value})}
                            >
                                <option value="Normal">Normal</option>
                                <option value="Reverse">Reverse Holo</option>
                                <option value="Holo">Holo</option>
                            </select>
                        </div>

                        <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button className="btn-secondary" onClick={() => setEditItem(null)} style={{ marginRight: '10px' }}>Cancelar</button>
                            <button className="btn-primary" onClick={submitEditItem}>Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
