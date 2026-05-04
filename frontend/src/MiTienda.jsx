import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import './css/modules.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

import { useLocation } from 'react-router-dom';
export default function MiTienda() {
    const location = useLocation();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [collection, setCollection] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false); // Can be removed eventually
    const [selectedCardId, setSelectedCardId] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [deliveryType, setDeliveryType] = useState('ambos');
    const [region, setRegion] = useState('');

    // Contador de palabras
    const MAX_WORDS = 500;
    const wordCount = description.trim().length > 0 ? description.trim().split(/\s+/).length : 0;
    const wordsRemaining = MAX_WORDS - wordCount;
    const isDescriptionTooLong = wordCount > MAX_WORDS;

    const regionesChile = [
        "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo",
        "Valparaíso", "Metropolitana", "O'Higgins", "Maule", "Ñuble",
        "Biobío", "La Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes"
    ];

    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchListings();
        fetchCollection();
    }, []);

    const [directSellCard, setDirectSellCard] = useState(null);

    // Handle redirect from "Vender carta"
    useEffect(() => {
        if (location.state?.sellCard) {
            const cardToSell = location.state.sellCard;
            setDirectSellCard(cardToSell);
            setSelectedCardId(cardToSell.id);
            setShowAddModal(true);

            // Clear state to prevent reopening on re-renders
            window.history.replaceState({}, document.title)
        }
    }, [location.state]);

    const fetchListings = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${apiUrl}/api/market/mine`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setListings(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCollection = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${apiUrl}/api/collection`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCollection(res.data);
        } catch (error) { console.error(error); }
    }

    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleList = async () => {
        // Validación de campos requeridos
        if (!selectedCardId || !price) {
            Swal.fire('Atención', 'Por favor completa los campos: Carta y Precio', 'warning');
            return false;
        }

        // Validación de precio positivo
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
            Swal.fire('Error', 'El precio debe ser un valor positivo. Evita valores negativos o cero.', 'error');
            return false;
        }

        // Validación de límite de palabras en descripción
        if (description.trim().length > 0) {
            const wordCount = description.trim().split(/\s+/).length;
            if (wordCount > 500) {
                Swal.fire('Error', `La descripción excede el límite de 500 palabras.<br>Actual: ${wordCount} palabras<br>Por favor, acorta tu descripción.`, 'error');
                return false;
            }
        }

        const formData = new FormData();
        formData.append('cartaId', selectedCardId);
        formData.append('price', price);
        formData.append('description', description);
        formData.append('deliveryType', deliveryType);
        if (deliveryType !== 'envio') {
            formData.append('region', region);
        }
        if (file) {
            formData.append('realImage', file);
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${apiUrl}/api/market/list`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            Swal.fire('¡Éxito!', 'Carta publicada para venta', 'success');
            setShowAddModal(false);
            if (directSellCard) setDirectSellCard(null);
            fetchListings();
            setPrice(''); setDescription(''); setSelectedCardId(''); setFile(null); setDeliveryType('ambos'); setRegion('');
            return true;
        } catch (error) {
            console.error(error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error publicando carta';
            Swal.fire('Error', errorMessage, 'error');
            return false;
        }
    }

    const handleDelete = async (id) => {
        const confirmResult = await Swal.fire({
            title: '¿Borrar publicación?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, borrar',
            cancelButtonText: 'Cancelar'
        });
        
        if (!confirmResult.isConfirmed) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${apiUrl}/api/market/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchListings();
        } catch (error) { console.error(error); }
    }

    return (
        <div className="collection-layout fade-in">
            {/* Sidebar equivalent - just info for now */}
            <div className="binders-sidebar">
                <h3>💰 Mi Tienda</h3>
                <div style={{ padding: '10px 0', color: '#555' }}>
                    <p>Gestiona tus cartas en venta.</p>
                    <p>Estas cartas son visibles para todos los usuarios en el Mercado.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-add-binder"
                >
                    + Nueva Venta
                </button>
            </div>

            {/* Main Content */}
            <div className="collection-content">
                <div className="collection-header">
                    <h1>Ventas Activas</h1>
                </div>

                {loading ? <div className="loading-spinner">Cargando ventas...</div> : (
                    <div className="results-grid">
                        {listings.length === 0 ? (
                            <div className="empty-state">
                                <p>No tienes cartas en venta actualmente.</p>
                            </div>
                        ) : (
                            listings.map(item => (
                                <div key={item.id} className="card-item">
                                    <div className="card-image-container">
                                        <img src={item.realImage ? `${apiUrl}${item.realImage}` : item.carta.imagenPequena} alt={item.carta.nombre} />
                                    </div>
                                    <div className="card-info">
                                        <h3>{item.carta.nombre}</h3>
                                        <div style={{
                                            background: '#4CAF50',
                                            color: 'white',
                                            borderRadius: '20px',
                                            padding: '5px 10px',
                                            display: 'inline-block',
                                            fontWeight: 'bold',
                                            marginBottom: '10px',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                        }}>
                                            ${item.price}
                                        </div>
                                        {item.realImage && <span style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '5px' }}>📸 Foto Real Incluida</span>}
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="btn-danger"
                                            style={{ width: '100%' }}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowAddModal(false)}>&times;</button>
                        <h2 style={{ marginTop: 0, color: '#333' }}>Publicar Carta</h2>

                        {/* Si hay carta directa, mostramos esa. Si no, verificamos colección vacía */}
                        {directSellCard ? (
                            <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <img
                                    src={directSellCard.imagenPequena}
                                    alt={directSellCard.nombre}
                                    style={{ width: '60px', height: 'auto' }}
                                />
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem' }}>{directSellCard.nombre}</h3>
                                    <span style={{ fontSize: '0.9rem', color: '#666' }}>{directSellCard.set}</span>
                                </div>
                                <button
                                    onClick={() => { setDirectSellCard(null); setSelectedCardId(''); }}
                                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    Cambiar
                                </button>
                            </div>
                        ) : collection.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <p style={{ color: '#666', marginBottom: '20px' }}>
                                    No tienes cartas en tu colección para vender.
                                </p>
                                <button
                                    className="btn-primary"
                                    onClick={() => window.location.href = '/'}
                                    style={{ width: '100%' }}
                                >
                                    🔍 Ir al Buscador
                                </button>
                            </div>
                        ) : (
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Carta de Colección</label>
                                <select
                                    value={selectedCardId}
                                    onChange={e => setSelectedCardId(e.target.value)}
                                    className="filter-select"
                                    style={{ width: '100%' }}
                                >
                                    <option value="">-- Seleccionar Carta --</option>
                                    {collection.map(c => (
                                        <option key={c.collectionId} value={c.id}>
                                            {c.nombre} ({c.set})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Mostrar formulario solo si hay carta seleccionada (directa o via dropdown) */}
                        {(directSellCard || (collection.length > 0 && selectedCardId)) && (
                            <>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Precio ($)</label>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={e => setPrice(e.target.value)}
                                        className="text-input"
                                        placeholder="0.00"
                                        style={{
                                            width: '100%',
                                            borderColor: price && parseFloat(price) <= 0 ? '#e74c3c' : '#ddd',
                                            borderWidth: '2px'
                                        }}
                                    />
                                    {price && parseFloat(price) <= 0 && (
                                        <small style={{ color: '#e74c3c', display: 'block', marginTop: '5px' }}>
                                            ❌ El precio debe ser un valor positivo
                                        </small>
                                    )}
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Foto Real (Opcional)</label>
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        style={{ width: '100%' }}
                                    />
                                    <small style={{ color: '#888' }}>Sube una foto del estado real de tu carta.</small>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Tipo de Entrega</label>
                                    <select
                                        value={deliveryType}
                                        onChange={e => setDeliveryType(e.target.value)}
                                        className="filter-select"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="ambos">Ambos (Presencial y Envío)</option>
                                        <option value="presencial">Solo Presencial</option>
                                        <option value="envio">Solo Envíos</option>
                                    </select>
                                </div>

                                {deliveryType !== 'envio' && (
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Región (Para entrega presencial)</label>
                                        <select
                                            value={region}
                                            onChange={e => setRegion(e.target.value)}
                                            className="filter-select"
                                            style={{ width: '100%' }}
                                        >
                                            <option value="">-- Selecciona tu Región --</option>
                                            {regionesChile.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Descripción</label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="text-input"
                                        style={{
                                            height: '80px',
                                            fontFamily: 'inherit',
                                            borderColor: isDescriptionTooLong ? '#e74c3c' : '#ddd',
                                            borderWidth: isDescriptionTooLong ? '2px' : '1px'
                                        }}
                                        placeholder="Estado, detalles extra..."
                                    ></textarea>
                                    <small style={{
                                        display: 'block',
                                        marginTop: '5px',
                                        color: isDescriptionTooLong ? '#e74c3c' : '#888',
                                        fontWeight: isDescriptionTooLong ? 'bold' : 'normal'
                                    }}>
                                        {wordCount}/{MAX_WORDS} palabras
                                        {isDescriptionTooLong && ` ❌ Excedido por ${wordCount - MAX_WORDS} palabras`}
                                        {!isDescriptionTooLong && wordsRemaining <= 50 && wordsRemaining > 0 && ` ⚠️ (${wordsRemaining} restantes)`}
                                    </small>
                                </div>

                                <div style={{ textAlign: 'right', marginTop: '20px' }}>
                                    <button className="btn-secondary" onClick={() => setShowAddModal(false)} style={{ marginRight: '10px' }}>Cancelar</button>
                                    <button className="btn-primary" onClick={handleList}>Publicar Venta</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
