import { useState, useEffect, useCallback } from 'react';
import type { Destination } from '../types/destinations';
import type { WebSocketMessage } from '../types';
import { useWebSocket } from './useWebSocket';
import api from '../api/axios';

export const useDestinations = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Load destinations from backend on mount
  const fetchDestinations = useCallback(async () => {
    try {
      const res = await api.get('/destinations');
      setDestinations(res.data.destinations);
      console.log(`🎯 Destinations loaded from ${res.data.source}`);
    } catch (err) {
      console.error('Failed to fetch destinations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  // ✅ Real-time update via WebSocket (Redis Pub/Sub)
  const handleWsMessage = useCallback((msg: WebSocketMessage) => {
    if (msg.type === 'DESTINATION_UPDATE') {
      console.log('🎯 Destinations updated in real-time');
      setDestinations(msg.destinations);
    }
  }, []);

  useWebSocket(handleWsMessage);

  // ✅ Add new destination
  const addDestination = async (
    type: string,
    label: string,
    description: string,
    icon: string
  ) => {
    const res = await api.post('/destinations', {
      type,
      label,
      description,
      icon,
    });
    setDestinations(res.data.destinations);
  };

  // ✅ Remove destination
  const removeDestination = async (type: string) => {
    const res = await api.delete(`/destinations/${type}`);
    setDestinations(res.data.destinations);
  };

  return {
    destinations,
    loading,
    addDestination,
    removeDestination,
    fetchDestinations,
  };
};