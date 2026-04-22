import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Webhook, WebSocketMessage } from '../types';
import api from '../api/axios';
import WebhookCard from '../components/WebhookCard';
import AddWebhookModal from '../components/AddWebhookModal';
import StatusToast from '../components/StatusToast';

interface Toast {
  id: string;
  status: 'sending' | 'success' | 'failure';
  message: string;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Fetch webhooks
  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await api.get('/webhooks');
      setWebhooks(res.data.webhooks);
    } catch (err) {
      console.error('Failed to fetch webhooks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  // WebSocket handler
  const handleWsMessage = useCallback((msg: WebSocketMessage) => {
    if (msg.type !== 'WEBHOOK_STATUS') return;

    // Update toast
    setToasts((prev) => {
      const exists = prev.find((t) => t.id === msg.webhookId);
      if (exists) {
        return prev.map((t) =>
          t.id === msg.webhookId
            ? { ...t, status: msg.status, message: msg.message }
            : t
        );
      }
      return [...prev, { id: msg.webhookId, status: msg.status, message: msg.message }];
    });

    // When done, refresh webhook list and clear triggering state
    if (msg.status === 'success' || msg.status === 'failure') {
      setTriggeringId(null);
      fetchWebhooks();
    }
  }, [fetchWebhooks]);

  useWebSocket(handleWsMessage);

  // Trigger webhook
  const handleTrigger = async (id: string) => {
    setTriggeringId(id);
    try {
      await api.post(`/webhooks/${id}/trigger`);
    } catch {
      setTriggeringId(null);
    }
  };

  // Remove toast
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-white font-semibold">WebhookService</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm hidden sm:block">{user?.email}</span>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Webhooks</h1>
            <p className="text-gray-400 text-sm mt-1">
              {webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''} registered
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Webhook
          </button>
        </div>

        {/* Webhook list */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <svg className="w-6 h-6 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1">No webhooks yet</h3>
            <p className="text-gray-500 text-sm">Click "Add Webhook" to register your first one</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {webhooks.map((webhook) => (
              <WebhookCard
                key={webhook._id}
                webhook={webhook}
                onDeleted={fetchWebhooks}
                triggeringId={triggeringId}
                onTrigger={handleTrigger}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <AddWebhookModal
          onClose={() => setShowModal(false)}
          onAdded={fetchWebhooks}
        />
      )}

      {/* Toasts */}
      <StatusToast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}