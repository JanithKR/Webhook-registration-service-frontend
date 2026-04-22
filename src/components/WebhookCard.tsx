import { useState, memo } from 'react';
import type { Webhook } from '../types';
import api from '../api/axios';

interface Props {
  webhook: Webhook;
  onDeleted: () => void;
  triggeringId: string | null;
  onTrigger: (id: string) => void;
}

const statusStyles = {
  pending: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  failure: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const statusDot = {
  pending: 'bg-gray-400',
  success: 'bg-green-400',
  failure: 'bg-red-400',
};

//  memo — only re-renders if props actually change
const WebhookCard = memo(function WebhookCard({ webhook, onDeleted, triggeringId, onTrigger }: Props) {
  const [deleting, setDeleting] = useState(false);
  const isTriggering = triggeringId === webhook._id;

  const handleDelete = async () => {
    if (!confirm(`Delete "${webhook.name}"?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/webhooks/${webhook._id}`);
      onDeleted();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <h3 className="text-white font-semibold truncate">{webhook.name}</h3>
          <p className="text-gray-500 text-xs truncate mt-0.5">{webhook.url}</p>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[webhook.lastStatus]}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot[webhook.lastStatus]}`} />
          {webhook.lastStatus}
        </span>
      </div>

      {/* Last triggered */}
      <p className="text-gray-600 text-xs mb-4">
        {webhook.lastTriggeredAt
          ? `Last triggered: ${new Date(webhook.lastTriggeredAt).toLocaleString()}`
          : 'Never triggered'}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onTrigger(webhook._id)}
          disabled={isTriggering}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
        >
          {isTriggering ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Sending...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Trigger
            </>
          )}
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-2 bg-gray-800 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 border border-gray-700 text-gray-400 rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
});

export default WebhookCard;