import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const SOCKET_URL = import.meta.env.VITE_WS_URL ?? '';

interface UseWebSocketOptions {
  clientId?: string;
  orderId?: string;
  onOrderUpdated?: (data: { orderId: string; status: string }) => void;
  onOrderStatusChanged?: (data: { orderId: string; status: string; updatedAt: string }) => void;
  onAlertReceived?: (data: { alertId: string; severity: string; message: string }) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  const { clientId, orderId, onOrderUpdated, onOrderStatusChanged, onAlertReceived } = options;

  useEffect(() => {
    if (!SOCKET_URL) {
      console.warn('WebSocket URL not configured');
      return;
    }

    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id);
      
      // Join client room
      if (clientId) {
        socket.emit('join:client', clientId);
      }
      
      // Join order room
      if (orderId) {
        socket.emit('join:order', orderId);
      }
    });

    socket.on('orderUpdated', (data: { orderId: string; status: string }) => {
      console.log('Order updated:', data);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', data.orderId] });
      
      // Call custom handler
      onOrderUpdated?.(data);
    });

    socket.on('orderStatusChanged', (data: { orderId: string; status: string; updatedAt: string }) => {
      console.log('Order status changed:', data);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', data.orderId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // Call custom handler
      onOrderStatusChanged?.(data);
    });

    socket.on('monitoringAlert', (data: { alertId: string; severity: string; message: string }) => {
      console.log('Monitoring alert received:', data);
      
      // Invalidate monitoring queries
      queryClient.invalidateQueries({ queryKey: ['monitoring-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['monitoring-alerts-critical'] });
      
      // Call custom handler
      onAlertReceived?.(data);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [clientId, orderId, queryClient, onOrderUpdated, onOrderStatusChanged, onAlertReceived]);

  // Join order room
  const joinOrder = useCallback((id: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:order', id);
    }
  }, []);

  // Leave order room
  const leaveOrder = useCallback((id: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave:order', id);
    }
  }, []);

  // Join client room
  const joinClient = useCallback((id: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:client', id);
    }
  }, []);

  // Check if connected
  const isConnected = socketRef.current?.connected ?? false;

  return {
    socket: socketRef.current,
    isConnected,
    joinOrder,
    leaveOrder,
    joinClient,
  };
}

export default useWebSocket;
