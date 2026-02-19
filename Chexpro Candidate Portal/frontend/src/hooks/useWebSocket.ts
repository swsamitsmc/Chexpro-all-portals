import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { notificationsApi } from '../lib/api';

interface UseWebSocketOptions {
  onStatusUpdate?: (data: { orderId: string; status: string }) => void;
  onCheckComplete?: (data: { orderId: string; checkId: string }) => void;
  onNotification?: (data: { title: string; message: string }) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const { user, isAuthenticated } = useAuthStore();

  const connect = useCallback(() => {
    if (!isAuthenticated || !user) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3004';
    
    if (!socketRef.current?.connected) {
      socketRef.current = io(socketUrl, {
        transports: ['websocket'],
        autoConnect: true,
      });

      socketRef.current.on('connect', () => {
        console.log('WebSocket connected');
        
        if (user.applicantId) {
          socketRef.current?.emit('join-candidate-room', { candidateId: user.applicantId });
        }
      });

      socketRef.current.on('status-update', (data) => {
        if (options.onStatusUpdate) {
          options.onStatusUpdate(data);
        }
      });

      socketRef.current.on('check-complete', (data) => {
        if (options.onCheckComplete) {
          options.onCheckComplete(data);
        }
      });

      socketRef.current.on('notification', async (data) => {
        if (options.onNotification) {
          options.onNotification(data);
        }
        
        try {
          await notificationsApi.list();
        } catch (error) {
          console.error('Failed to refresh notifications:', error);
        }
      });

      socketRef.current.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });
    }
  }, [isAuthenticated, user, options]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const joinOrderRoom = useCallback((orderId: string) => {
    socketRef.current?.emit('join-check-room', { orderId });
  }, []);

  const leaveOrderRoom = useCallback((orderId: string) => {
    socketRef.current?.emit('leave-check-room', { orderId });
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    joinOrderRoom,
    leaveOrderRoom,
    connect,
    disconnect,
  };
}
