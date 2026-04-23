import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useWebhookState } from '../hooks/useWebhookState';
import type { Webhook, WebSocketMessage } from '../types';
import api from '../api/axios';
import WebhookCard from '../components/WebhookCard';
import AddWebhookModal from '../components/AddWebhookModal';
import type { AddWebhookModalHandle } from '../components/AddWebhookModal';
import StatusToast from '../components/StatusToast';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ hookstate — replaces multiple useState calls
  const {
    search, setSearch,
    triggeringId, setTriggeringId,
    showModal, setShowModal,
    toasts, addOrUpdateToast, removeToast,
  } = useWebhookState();

  // ✅ useRef for DOM (search input focus)
  const searchRef = useRef<HTMLInputElement>(null);

  // ✅ useRef for imperative handle (modal reset)
  const modalRef = useRef<AddWebhookModalHandle>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

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

  const stats = useMemo(() => {
    const total = webhooks.length;
    const success = webhooks.filter((w) => w.lastStatus === 'success').length;
    const failure = webhooks.filter((w) => w.lastStatus === 'failure').length;
    const pending = webhooks.filter((w) => w.lastStatus === 'pending').length;
    return { total, success, failure, pending };
  }, [webhooks]);

  const filteredWebhooks = useMemo(() => {
    if (!search.trim()) return webhooks;
    return webhooks.filter(
      (w) =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.url.toLowerCase().includes(search.toLowerCase())
    );
  }, [webhooks, search]);

  const handleWsMessage = useCallback((msg: WebSocketMessage) => {
    if (msg.type !== 'WEBHOOK_STATUS') return;
    addOrUpdateToast({ id: msg.webhookId, status: msg.status, message: msg.message });
    if (msg.status === 'success' || msg.status === 'failure') {
      setTriggeringId(null);
      fetchWebhooks();
    }
  }, [fetchWebhooks]);

  useWebSocket(handleWsMessage);

  const handleTrigger = async (id: string) => {
    setTriggeringId(id);
    try {
      await api.post(`/webhooks/${id}/trigger`);
    } catch {
      setTriggeringId(null);
    }
  };

  const handleOpenModal = () => {
    // ✅ imperative handle — reset form before opening
    modalRef.current?.reset();
    setShowModal(true);
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

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Success', value: stats.success, color: 'text-green-400' },
            { label: 'Failed', value: stats.failure, color: 'text-red-400' },
            { label: 'Pending', value: stats.pending, color: 'text-gray-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Header + search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Webhooks</h1>
            <p className="text-gray-400 text-sm mt-1">
              {filteredWebhooks.length} of {webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search webhooks..."
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 transition w-48"
            />
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Webhook
            </button>
          </div>
        </div>

        {/* Webhook list */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <svg className="w-6 h-6 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : filteredWebhooks.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1">
              {search ? 'No results found' : 'No webhooks yet'}
            </h3>
            <p className="text-gray-500 text-sm">
              {search ? 'Try a different search term' : 'Click "Add Webhook" to register your first one'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWebhooks.map((webhook) => (
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

      {/* ✅ ref passed to modal for imperative handle */}
      {showModal && (
        <AddWebhookModal
          ref={modalRef}
          onClose={() => setShowModal(false)}
          onAdded={fetchWebhooks}
        />
      )}

      <StatusToast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}