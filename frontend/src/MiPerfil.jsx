import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { Link } from 'react-router-dom';
import './css/modules.css';

export default function MiPerfil() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [socialLinks, setSocialLinks] = useState({
        instagram: '',
        tcgmatch: '',
        x: ''
    });

    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        if (user) fetchProfile();
    }, [user]);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${apiUrl}/api/profile/${user.id}`);
            const links = res.data.user.socialLinks || {};
            setSocialLinks({
                instagram: links.instagram || '',
                tcgmatch: links.tcgmatch || '',
                x: links.x || ''
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${apiUrl}/api/profile/me`, {
                socialLinks
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Perfil actualizado correctamente');
        } catch (error) {
            console.error(error);
            alert('Error actualizando perfil');
        }
    };

    if (loading) return <div className="container fade-in">Cargando perfil...</div>;

    return (
        <div className="collection-layout fade-in">
            {/* Sidebar */}
            <div className="binders-sidebar" style={{ textAlign: 'center' }}>
                <div style={{
                    width: '100px', height: '100px',
                    borderRadius: '50%', background: '#ccc',
                    margin: '0 auto 15px', overflow: 'hidden',
                    border: '3px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}>
                    <img
                        src={user.picture || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/132.png'}
                        alt={user.name}
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/132.png'; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
                <h3>{user.name}</h3>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>{user.email}</p>

                <div style={{ marginTop: '20px' }}>
                    <Link to={`/profile/${user.id}`} className="btn-secondary" style={{ display: 'block', width: '100%', marginBottom: '10px', textAlign: 'center' }}>
                        Ver mi Perfil Público
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="collection-content">
                <div className="collection-header">
                    <h1>✏️ Editar Perfil</h1>
                </div>

                <div style={{ background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#444' }}>Enlaces Sociales</h3>
                    <p style={{ marginBottom: '20px', color: '#666', fontSize: '0.9rem' }}>
                        Agrega enlaces a tus redes para generar confianza con otros usuarios.
                    </p>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>📸 Instagram URL</label>
                        <input
                            type="text"
                            placeholder="https://instagram.com/tu_usuario"
                            value={socialLinks.instagram}
                            onChange={e => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                            className="text-input"
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>🃏 TCG Match URL</label>
                        <input
                            type="text"
                            placeholder="Enlace a tu perfil de TCG Match"
                            value={socialLinks.tcgmatch}
                            onChange={e => setSocialLinks({ ...socialLinks, tcgmatch: e.target.value })}
                            className="text-input"
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>✖️ X (Twitter) URL</label>
                        <input
                            type="text"
                            placeholder="https://x.com/tu_usuario"
                            value={socialLinks.x}
                            onChange={e => setSocialLinks({ ...socialLinks, x: e.target.value })}
                            className="text-input"
                        />
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <button onClick={handleSave} className="btn-primary" style={{ padding: '10px 25px' }}>
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
