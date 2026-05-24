import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import Swal from 'sweetalert2';
import './css/modules.css';
import './css/mensajes.css';

export default function Mensajes() {
    const [messages, setMessages] = useState([]);
    const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'contacto'
    const [selectedConvId, setSelectedConvId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const [blockStatus, setBlockStatus] = useState({ blockedByMe: false, blockedByThem: false, anyBlock: false });
    const chatLogRef = useRef(null);

    const { user } = useAuth();
    const { socket } = useSocket();
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchMessages();

        if (socket) {
            socket.on('receive_message', (newMsg) => {
                setMessages(prev => {
                    if (prev.find(m => m.id === newMsg.id)) return prev;
                    return [newMsg, ...prev];
                });
            });

            return () => socket.off('receive_message');
        }
    }, [socket]);

    useEffect(() => {
        if (selectedConvId) {
            fetchBlockStatus(selectedConvId);
        }
    }, [selectedConvId]);

    const fetchBlockStatus = async (partnerId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${apiUrl}/api/blocks/status/${partnerId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBlockStatus(res.data);
        } catch (e) { console.error(e); }
    };

    // Scroll to bottom when selecting conversation or getting new message
    useEffect(() => {
        if (chatLogRef.current) {
            chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
        }
    }, [selectedConvId, messages]);

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
            // fetchMessages(); // Avoid fetching all just to mark read, we update local state
            setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
        } catch (e) { console.error(e); }
    }

    // Clasificar mensajes
    const contactMessages = messages.filter(m => m.content.includes('🔔 Nuevo Formulario de Contacto 🔔'));
    const chatMessages = messages.filter(m => !m.content.includes('🔔 Nuevo Formulario de Contacto 🔔'));

    // Agrupar chats en conversaciones
    const convMap = new Map();
    chatMessages.forEach(msg => {
        // En casos extremadamente raros el usuario podría ser nulo si se borró
        if (!msg.sender || !msg.receiver) return;

        const partner = msg.sender.id == user.id ? msg.receiver : msg.sender;
        const partnerId = partner.id;

        if (!convMap.has(partnerId)) {
            convMap.set(partnerId, {
                partner,
                messages: [],
                unreadCount: 0,
                latestMessage: null
            });
        }

        const conv = convMap.get(partnerId);
        conv.messages.push(msg);

        if (!msg.read && msg.receiver.id == user.id) {
            conv.unreadCount += 1;
        }

        if (!conv.latestMessage || new Date(msg.createdAt) > new Date(conv.latestMessage.createdAt)) {
            conv.latestMessage = msg;
        }
    });

    const conversations = Array.from(convMap.values()).sort((a, b) => {
        return new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt);
    });

    // Ordenar mensajes del chat (antiguos primero)
    conversations.forEach(conv => {
        conv.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });

    const activeConversation = selectedConvId ? convMap.get(selectedConvId) : null;

    const handleSelectConversation = async (partnerId) => {
        setSelectedConvId(partnerId);
        const conv = convMap.get(partnerId);
        if (conv && conv.unreadCount > 0) {
            const unreadMsgs = conv.messages.filter(m => !m.read && m.receiver.id == user.id);
            for (const m of unreadMsgs) {
                await markRead(m.id);
            }
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !activeConversation) return;
        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const marketItemId = activeConversation.latestMessage.marketItem?.id;

            await axios.post(`${apiUrl}/api/messages/send`, {
                receiverId: activeConversation.partner.id,
                content: replyText,
                marketItemId: marketItemId || null
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReplyText('');
            fetchMessages(); // Refrescar para obtener el ID real
        } catch (error) {
            console.error('Error sending reply:', error);
        } finally {
            setSending(false);
        }
    };

    const handleBlockUser = async () => {
        if (!activeConversation) return;
        
        const confirm = await Swal.fire({
            title: '¿Bloquear usuario?',
            text: 'Ya no podrán enviarse mensajes mutuamente.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, bloquear',
            cancelButtonText: 'Cancelar'
        });

        if (confirm.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                await axios.post(`${apiUrl}/api/blocks`, { blockedId: activeConversation.partner.id }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('Bloqueado', 'El usuario ha sido bloqueado exitosamente.', 'success');
                fetchBlockStatus(activeConversation.partner.id);
            } catch (error) {
                Swal.fire('Error', error.response?.data?.error || error.response?.data?.message || 'No se pudo bloquear.', 'error');
            }
        }
    };

    const handleUnblockUser = async () => {
        if (!activeConversation) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${apiUrl}/api/blocks/${activeConversation.partner.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Swal.fire('Desbloqueado', 'El usuario ha sido desbloqueado exitosamente.', 'success');
            fetchBlockStatus(activeConversation.partner.id);
        } catch (error) {
            Swal.fire('Error', 'No se pudo desbloquear.', 'error');
        }
    };

    const handleReportUser = async () => {
        if (!activeConversation) return;

        const { value: reason } = await Swal.fire({
            title: 'Reportar Usuario',
            input: 'textarea',
            inputLabel: '¿Por qué reportas a este usuario?',
            inputPlaceholder: 'Escribe el motivo aquí...',
            showCancelButton: true,
            confirmButtonText: 'Enviar Reporte',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value) return 'Debes escribir un motivo';
            }
        });

        if (reason) {
            try {
                const token = localStorage.getItem('token');
                await axios.post(`${apiUrl}/api/reports`, {
                    reportedUserId: activeConversation.partner.id,
                    reason: reason
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('Enviado', 'Reporte enviado a los administradores.', 'success');
            } catch (error) {
                Swal.fire('Error', error.response?.data?.error || 'No se pudo enviar el reporte.', 'error');
            }
        }
    };

    return (
        <div className="collection-layout fade-in">
            <div className="mensajes-container">
                {user?.role === 'admin' && (
                    <div className="mensajes-tabs">
                        <button 
                            className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`}
                            onClick={() => setActiveTab('chats')}
                        >
                            💬 Chats (Mercado)
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'contacto' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('contacto');
                                setSelectedConvId(null);
                            }}
                        >
                            📋 Tablón de Contacto
                            {contactMessages.filter(m => !m.read).length > 0 && (
                                <span className="unread-badge" style={{ marginLeft: '8px' }}>
                                    {contactMessages.filter(m => !m.read).length}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {activeTab === 'chats' ? (
                    <div className="chat-layout">
                        {/* Panel Izquierdo: Conversaciones */}
                        <div className="conversations-sidebar">
                            {conversations.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                                    No tienes chats iniciados.
                                </div>
                            ) : (
                                conversations.map(conv => (
                                    <div 
                                        key={conv.partner.id} 
                                        className={`conversation-item ${selectedConvId === conv.partner.id ? 'active' : ''}`}
                                        onClick={() => handleSelectConversation(conv.partner.id)}
                                    >
                                        <div className="conv-header">
                                            <span className="conv-name">{conv.partner.name || 'Usuario'}</span>
                                            <span className="conv-time">
                                                {new Date(conv.latestMessage.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="conv-snippet">
                                            <span className="snippet-text">
                                                {conv.latestMessage.sender.id == user.id ? 'Tú: ' : ''}
                                                {conv.latestMessage.content}
                                            </span>
                                            {conv.unreadCount > 0 && (
                                                <span className="unread-badge">{conv.unreadCount}</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Panel Derecho: Log del Chat */}
                        <div className="chat-main">
                            {activeConversation ? (
                                <>
                                    <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                        <h3 style={{ margin: 0 }}>Chat con {activeConversation.partner.name || 'Usuario'}</h3>
                                        <div className="chat-actions" style={{ display: 'flex', gap: '10px' }}>
                                            <button onClick={handleReportUser} className="btn-secondary" style={{ padding: '5px 10px', fontSize: '0.85rem' }}>🚩 Reportar</button>
                                            {blockStatus.blockedByMe ? (
                                                <button onClick={handleUnblockUser} className="btn-success" style={{ padding: '5px 10px', fontSize: '0.85rem' }}>♻️ Desbloquear</button>
                                            ) : (
                                                <button onClick={handleBlockUser} className="btn-danger" style={{ background: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>🚫 Bloquear</button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="chat-log" ref={chatLogRef}>
                                        {activeConversation.messages.map(msg => (
                                            <div 
                                                key={msg.id} 
                                                className={`message-bubble-container ${msg.sender.id == user.id ? 'own' : 'other'}`}
                                            >
                                                <div className={`message-bubble ${msg.sender.id == user.id ? 'own' : 'other'}`}>
                                                    {msg.marketItem && msg.marketItem.carta && (
                                                        <div className="market-ref">
                                                            Ref: {msg.marketItem.carta.nombre}
                                                        </div>
                                                    )}
                                                    {msg.content}
                                                    <span className="bubble-time">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {blockStatus.anyBlock ? (
                                        <div className="chat-blocked-message" style={{ padding: '15px', textAlign: 'center', background: '#fff0f0', color: '#c0392b', fontWeight: 'bold', borderTop: '1px solid #ddd' }}>
                                            {blockStatus.blockedByMe ? 'Has bloqueado a este usuario.' : 'Este usuario te ha bloqueado o la comunicación no está disponible.'}
                                        </div>
                                    ) : (
                                        <div className="chat-input-area">
                                            <textarea 
                                                placeholder="Escribe un mensaje..."
                                                value={replyText}
                                                onChange={e => setReplyText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendReply();
                                                    }
                                                }}
                                            />
                                            <button 
                                                className="btn-send-reply"
                                                onClick={handleSendReply}
                                                disabled={sending || !replyText.trim()}
                                            >
                                                {sending ? '...' : 'Enviar'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="chat-empty-state">
                                    Selecciona una conversación para empezar a chatear.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Tablón de Contacto (Solo Admin) */
                    <div className="tablon-contacto-layout">
                        <h2 style={{ marginBottom: '20px' }}>Mensajes del Formulario de Contacto</h2>
                        {contactMessages.length === 0 ? (
                            <p style={{ color: '#888' }}>No hay mensajes de contacto.</p>
                        ) : (
                            <div className="contacto-grid">
                                {contactMessages.map(msg => (
                                    <div 
                                        key={msg.id} 
                                        className="contacto-card"
                                        onClick={() => {
                                            if (!msg.read) markRead(msg.id);
                                        }}
                                        style={{ cursor: !msg.read ? 'pointer' : 'default', borderTopColor: !msg.read ? '#ff3b30' : '#2575fc' }}
                                    >
                                        <div className="contacto-card-header">
                                            <span>
                                                <strong>Formulario Público</strong>
                                                {!msg.read && <span className="unread-badge" style={{ marginLeft: '10px' }}>Nuevo</span>}
                                            </span>
                                            <span>{new Date(msg.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="contacto-body">
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
