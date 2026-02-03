import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        if (user) {
            // Establish connection
            const newSocket = io(apiUrl);

            newSocket.on('connect', () => {
                console.log('🔌 Connected to WebSocket');
                // Join user room
                newSocket.emit('join_room', user.id); // Assuming user object has id
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        } else {
            // Disconnect if user logs out
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user, apiUrl]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
