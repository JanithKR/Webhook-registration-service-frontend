import { useState, useEffect, useCallback } from 'react';
import type { EventTree } from '../types/events';
import type { WebSocketMessage } from '../types';
import { useWebSocket } from './useWebSocket';
import api from '../api/axios';
import eventConfig from '../config/events.json';

export const useEventTree = () => {
  const [eventTree, setEventTree] = useState<EventTree>(
    eventConfig as unknown as EventTree
  );
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  // ✅ Load latest tree from Redis cache on mount
  useEffect(() => {
    const loadCachedTree = async () => {
      try {
        const res = await api.get('/events');
        if (res.data.tree) {
          setEventTree(res.data.tree);
          console.log('🌳 Event tree loaded from Redis cache');
        }
      } catch {
        console.log('🌳 Using default event tree from JSON');
      }
    };
    loadCachedTree();
  }, []);

  // ✅ Listen for real-time tree updates via WebSocket
  const handleWsMessage = useCallback((msg: WebSocketMessage) => {
    if (msg.type === 'EVENT_TREE_UPDATE') {
      console.log('🌳 Event tree updated in real-time via Pub/Sub');
      setEventTree(msg.tree as EventTree);
      setLastUpdatedBy(msg.updatedBy);
      setLastUpdatedAt(msg.updatedAt);
    }
  }, []);

  useWebSocket(handleWsMessage);

  // ✅ Publish tree update to all clients via Redis Pub/Sub
  const publishTree = useCallback(async (tree: EventTree) => {
    try {
      await api.post('/events/publish', { tree });
      console.log('📡 Event tree published via Redis Pub/Sub');
    } catch (err) {
      console.error('Failed to publish event tree:', err);
    }
  }, []);

  return {
    eventTree,
    setEventTree,
    publishTree,
    lastUpdatedBy,
    lastUpdatedAt,
  };
};