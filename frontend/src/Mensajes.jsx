import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import './css/modules.css';

export default function Mensajes() {
    const [messages, setMessages] = useState([]);
    const { user } = useAuth();
    const { socket } = useSocket();
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchMessages();

        if (socket) {
            socket.on('receive_message', (newMsg) => {
                // Check if message belongs to current view (if we had conversations)
                // For now, simple list, just add it to top if not exists
                setMessages(prev => {
                    if (prev.find(m => m.id === newMsg.id)) return prev;
                    return [newMsg, ...prev];
                });
            });

            return () => socket.off('receive_message');
        }
    }, [socket]);

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${apiUrl}/api/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);
        } catch (error) { console.error(error); }
    };

    const markRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${apiUrl}/api/messages/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchMessages();
        } catch (e) { console.error(e); }
    }

    // Group by conversation user? For now just simple list
    return (
        <div className="collection-layout fade-in">
            {/* Sidebar for Messages - Future: Conversation list */}
            <div className="binders-sidebar">
                <h3>📨 Mensajería</h3>
                <div style={{ padding: '10px 0', color: '#555' }}>
                    <p>Bandeja de Entrada</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '10px' }}>
                        Aquí recibirás ofertas y mensajes de otros usuarios sobre tus cartas en venta.
                    </p>
                </div>
                <button
                    onClick={fetchMessages}
                    className="btn-add-binder"
                    style={{ marginTop: '20px' }}
                >
                    🔄 Refrescar
                </button>
            </div>

            {/* Main Content */}
            <div className="collection-content">
                <div className="collection-header">
                    <h1>Bandeja de Entrada</h1>
                </div>

                <div className="message-list">
                    {messages.length === 0 ? (
                        <div className="empty-state">
                            <p>No tienes mensajes nuevos.</p>
                        </div>
                    ) : (
                        messages.map(msg => (
                            <div key={msg.id} className={`message-card ${msg.read ? 'read' : 'unread'}`}>
                                <div className="msg-header">
                                    <span className="msg-from">
                                        {msg.sender.id === user.id ? `Para: ${msg.receiver.name}` : `De: ${msg.sender.name}`}
                                    </span>
                                    <span className="msg-date">{new Date(msg.createdAt).toLocaleString()}</span>
                                </div>

                                {msg.marketItem && (
                                    <div className="msg-ref">
                                        Ref: {msg.marketItem.carta ? msg.marketItem.carta.nombre : 'Producto no disponible'}
                                    </div>
                                )}

                                <div className="msg-body">
                                    {msg.content}
                                </div>

                                {!msg.read && msg.receiver.id === user.id && (
                                    <div className="msg-actions">
                                        <button onClick={() => markRead(msg.id)} className="btn-read">
                                            ✓ Marcar como leído
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
