import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import './css/modules.css';
import Swal from 'sweetalert2';

export default function PerfilPublico() {
    const { userId } = useParams();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Comment form
    const [commentText, setCommentText] = useState('');
    const [rating, setRating] = useState(5);

    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${apiUrl}/api/profile/${userId}`);
            setProfile(res.data.user);
            setComments(res.data.comments);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleComment = async () => {
        if (!commentText.trim()) return;
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Atención', 'Debes iniciar sesión para comentar', 'warning');
                return;
            }

            const res = await axios.post(`${apiUrl}/api/profile/comment`, {
                receiverId: userId,
                content: commentText,
                rating
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComments([res.data, ...comments]);
            setCommentText('');
            setRating(5);
        } catch (error) {
            console.error(error);
            const backendMessage = error?.response?.data?.message;
            Swal.fire('Error', backendMessage || 'Error al comentar', 'error');
        }
    };

    if (loading) return <div className="container fade-in">Cargando perfil...</div>;
    if (!profile) return <div className="container fade-in">Usuario no encontrado</div>;

    const socialLinks = profile.socialLinks || {};

    return (
        <div className="collection-layout fade-in">
            {/* Sidebar with User Info */}
            <div className="binders-sidebar" style={{ textAlign: 'center' }}>
                <div style={{
                    width: '100px', height: '100px',
                    borderRadius: '50%', background: '#ccc',
                    margin: '0 auto 15px', overflow: 'hidden',
                    border: '3px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}>
                    <img
                        src={profile.picture || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/132.png'}
                        alt={profile.name}
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/132.png'; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
                <h3>{profile.name}</h3>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>Miembro desde: {new Date(profile.createdAt).toLocaleDateString()}</p>

                <div style={{ marginTop: '20px', textAlign: 'left', background: '#f9f9f9', padding: '15px', borderRadius: '10px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>🌐 Redes Sociales</h4>
                    {Object.keys(socialLinks).length === 0 && <p style={{ fontSize: '0.85rem', color: '#999' }}>Sin enlaces públicos.</p>}

                    {socialLinks.instagram && (
                        <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: '8px', color: '#E1306C', textDecoration: 'none', fontWeight: '500' }}>
                            📸 Instagram
                        </a>
                    )}
                    {socialLinks.tcgmatch && (
                        <a href={socialLinks.tcgmatch} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: '8px', color: '#4CAF50', textDecoration: 'none', fontWeight: '500' }}>
                            🃏 TCG Match
                        </a>
                    )}
                    {socialLinks.x && (
                        <a href={socialLinks.x} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: '8px', color: '#000', textDecoration: 'none', fontWeight: '500' }}>
                            ✖️ X (Twitter)
                        </a>
                    )}
                </div>
            </div>

            {/* Main Content: Reputation */}
            <div className="collection-content">
                <div className="collection-header">
                    <h1>⭐ Reputación y Comentarios</h1>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    {user && user.id !== parseInt(userId) && (
                        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                            <h4>Dejar un comentario</h4>
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ marginRight: '10px' }}>Calificación:</label>
                                <select value={rating} onChange={e => setRating(parseInt(e.target.value))} style={{ padding: '5px', borderRadius: '5px' }}>
                                    <option value="5">⭐⭐⭐⭐⭐ Excelente</option>
                                    <option value="4">⭐⭐⭐⭐ Bueno</option>
                                    <option value="3">⭐⭐⭐ Regular</option>
                                    <option value="2">⭐⭐ Malo</option>
                                    <option value="1">⭐ Terrible</option>
                                </select>
                            </div>
                            <textarea
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                placeholder="Escribe tu experiencia con este usuario..."
                                style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '10px' }}
                            ></textarea>
                            <button onClick={handleComment} className="btn-primary">Publicar Comentario</button>
                        </div>
                    )}
                </div>

                <div className="message-list">
                    {comments.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#888' }}>Este usuario aún no tiene comentarios.</p>
                    ) : (
                        comments.map(c => (
                            <div key={c.id} className="message-card" style={{ borderLeftColor: c.rating >= 4 ? '#4CAF50' : c.rating <= 2 ? '#F44336' : '#FFC107' }}>
                                <div className="msg-header">
                                    <span className="msg-from">{c.sender.name}</span>
                                    <span className="msg-date">{new Date(c.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div style={{ marginBottom: '5px' }}>
                                    {'⭐'.repeat(c.rating)}
                                </div>
                                <div className="msg-body">
                                    {c.content}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
