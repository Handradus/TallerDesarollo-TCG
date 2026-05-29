import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { Link } from 'react-router-dom';
import './css/modules.css';
import Swal from 'sweetalert2';

const PRELOADED_AVATARS = [
    { name: 'Ditto', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/132.png' },
    { name: 'Pikachu', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png' },
    { name: 'Charmander', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png' },
    { name: 'Squirtle', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png' },
    { name: 'Bulbasaur', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png' },
    { name: 'Eevee', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png' },
    { name: 'Mew', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/151.png' },
    { name: 'Gengar', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png' },
    { name: 'Snorlax', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png' },
    { name: 'Togepi', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/175.png' },
    { name: 'Lucario', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png' },
    { name: 'Mimikyu', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/778.png' },
];

export default function MiPerfil() {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('');
    const [socialLinks, setSocialLinks] = useState({
        instagram: '',
        tcgmatch: '',
        x: ''
    });
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setSelectedAvatar(user.picture || PRELOADED_AVATARS[0].url);
            fetchProfile();
        }
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
        if (!name.trim()) {
            Swal.fire('Atención', 'El nombre de usuario no puede estar vacío', 'warning');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${apiUrl}/api/profile/me`, {
                name: name.trim(),
                picture: selectedAvatar,
                socialLinks
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data?.user) {
                updateUser(res.data.user);
            }

            Swal.fire('¡Éxito!', 'Perfil actualizado correctamente', 'success');
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Error actualizando perfil', 'error');
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            Swal.fire('Atención', 'La nueva contraseña debe tener al menos 6 caracteres', 'warning');
            return;
        }
        if (newPassword !== confirmPassword) {
            Swal.fire('Atención', 'Las contraseñas no coinciden', 'warning');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${apiUrl}/api/profile/me/password`, {
                currentPassword,
                newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire('¡Éxito!', res.data?.message || 'Contraseña cambiada', 'success');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error(error);
            const msg = error?.response?.data?.message || 'Error cambiando contraseña';
            Swal.fire('Error', msg, 'error');
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
                    border: '3px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <img
                        src={selectedAvatar || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/132.png'}
                        alt={name}
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/132.png'; }}
                        style={{ width: '85%', height: '85%', objectFit: 'contain' }}
                    />
                </div>
                <h3>{name || user.name}</h3>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>{user.email}</p>

                <div style={{ marginTop: '20px' }}>
                    <Link to={`/profile/${user.id}`} className="btn-secondary" style={{ display: 'block', width: '100%', marginBottom: '10px', textAlign: 'center', boxSizing: 'border-box' }}>
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
                    {/* Información Básica */}
                    <div style={{ marginBottom: '25px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#444', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                            Información Básica
                        </h3>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nombre de Usuario</label>
                            <input
                                type="text"
                                placeholder="Nombre de usuario"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="text-input"
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    {/* Selector de Avatar */}
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '5px', color: '#444', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                            Elige tu Avatar Pokémon
                        </h3>
                        <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '15px' }}>
                            Selecciona un personaje para representarte en la comunidad sin moderación de fotos.
                        </p>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                            gap: '10px',
                            background: '#f9f9f9',
                            padding: '12px',
                            borderRadius: '10px',
                            border: '1px solid #eee'
                        }}>
                            {PRELOADED_AVATARS.map((avatar) => {
                                const isSelected = selectedAvatar === avatar.url;
                                return (
                                    <button
                                        key={avatar.name}
                                        type="button"
                                        onClick={() => setSelectedAvatar(avatar.url)}
                                        style={{
                                            background: isSelected ? '#ffffff' : 'transparent',
                                            border: isSelected ? '2px solid #764ba2' : '2px solid transparent',
                                            borderRadius: '10px',
                                            padding: '6px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            boxShadow: isSelected ? '0 2px 8px rgba(118, 75, 162, 0.15)' : 'none',
                                        }}
                                        onMouseOver={e => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.7)';
                                                e.currentTarget.style.transform = 'scale(1.05)';
                                            }
                                        }}
                                        onMouseOut={e => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }
                                        }}
                                    >
                                        <img 
                                            src={avatar.url} 
                                            alt={avatar.name}
                                            style={{ width: '45px', height: '45px', objectFit: 'contain' }}
                                        />
                                        <span style={{ 
                                            fontSize: '0.72rem', 
                                            marginTop: '4px', 
                                            color: isSelected ? '#764ba2' : '#666',
                                            fontWeight: isSelected ? '600' : 'normal'
                                        }}>
                                            {avatar.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Enlaces Sociales */}
                    <div style={{ marginBottom: '25px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#444', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                            Enlaces Sociales
                        </h3>
                        <p style={{ marginBottom: '15px', color: '#666', fontSize: '0.85rem' }}>
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
                                style={{ width: '100%', boxSizing: 'border-box' }}
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
                                style={{ width: '100%', boxSizing: 'border-box' }}
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
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    {/* Cambiar contraseña */}
                    <div style={{ marginTop: '20px', marginBottom: '10px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#444', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                            Cambiar Contraseña
                        </h3>

                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Contraseña actual</label>
                            <input
                                type="password"
                                placeholder="Contraseña actual"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                className="text-input"
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nueva contraseña</label>
                            <input
                                type="password"
                                placeholder="Nueva contraseña"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="text-input"
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Confirmar nueva contraseña</label>
                            <input
                                type="password"
                                placeholder="Confirmar nueva contraseña"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="text-input"
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                            <button onClick={handleChangePassword} className="btn-secondary" style={{ padding: '8px 18px', marginRight: '10px' }}>
                                Cambiar contraseña
                            </button>
                        </div>
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
