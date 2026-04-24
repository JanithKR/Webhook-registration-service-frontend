import { useState, forwardRef, useImperativeHandle } from 'react';
import api from '../api/axios';
import type { PayloadStyle } from '../types';
import type { EventNode, EventTree } from '../types/events';
import { collectLeaves, insertNode } from '../types/events';
import EventTreeNode from './EventTreeNode';
import AddRootEvent from './AddRootEvent';
import AddDestinationForm from './AddDestinationForm';
import eventConfig from '../config/events.json';
import { useEventTree } from '../hooks/useEventTree';
import { useDestinations } from '../hooks/useDestinations';

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

export interface AddWebhookModalHandle {
  reset: () => void;
}

const AddWebhookModal = forwardRef<AddWebhookModalHandle, Props>(
  ({ onClose, onAdded }, ref) => {
    const [step, setStep] = useState(1);

    // ✅ Event tree from hook — real-time via Redis Pub/Sub
    const { eventTree, setEventTree, publishTree } = useEventTree();

    // ✅ Destinations from hook — loaded from DB + real-time updates
    const {
      destinations,
      loading: destinationsLoading,
      addDestination,
      removeDestination,
    } = useDestinations();

    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
    const [destinationType, setDestinationType] = useState<string>('webhook_endpoint');
    const [payloadStyle, setPayloadStyle] = useState<PayloadStyle>('snapshot');
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useImperativeHandle(ref, () => ({
      reset: () => {
        setStep(1);
        setEventTree(eventConfig as unknown as EventTree);
        setSelectedEvents([]);
        setDestinationType('webhook_endpoint');
        setPayloadStyle('snapshot');
        setName('');
        setUrl('');
        setError('');
        setLoading(false);
      },
    }));

    // ✅ Toggle node — selects/deselects all leaves under it
    const handleToggle = (key: string, node: EventNode) => {
      const leaves = collectLeaves(key, node);
      const allSelected = leaves.every((l) => selectedEvents.includes(l));
      if (allSelected) {
        setSelectedEvents((prev) => prev.filter((e) => !leaves.includes(e)));
      } else {
        setSelectedEvents((prev) => [...new Set([...prev, ...leaves])]);
      }
    };

    // ✅ Add child event — inserts into live tree + publishes via Redis
    const handleAddChild = (
      parentPath: string[],
      newKey: string,
      newLabel: string
    ) => {
      setEventTree((prev) => {
        const updated = insertNode(prev, parentPath, newKey, newLabel);
        publishTree(updated);
        return updated;
      });
    };

    // ✅ Add root event group — no limit + publishes via Redis
    const handleAddRootEvent = (key: string, label: string) => {
      setEventTree((prev) => {
        const updated = {
          ...prev,
          [key]: { label, children: {} },
        };
        publishTree(updated);
        return updated;
      });
    };

    // ✅ Get selected destination label for summary
    const selectedDestination = destinations.find(
      (d) => d.type === destinationType
    );

    const handleSubmit = async () => {
      setError('');
      if (!name || !url) {
        setError('Name and URL are required');
        return;
      }
      if (selectedEvents.length === 0) {
        setError('Please select at least one event');
        return;
      }
      setLoading(true);
      try {
        await api.post('/webhooks', {
          name,
          url,
          destinationType,
          payloadStyle,
          events: selectedEvents,
        });
        onAdded();
        onClose();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to add webhook');
      } finally {
        setLoading(false);
      }
    };

    const steps = ['Select events', 'Choose destination', 'Configure'];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">

          {/* Step indicator */}
          <div className="flex border-b border-gray-800">
            {steps.map((s, i) => (
              <div
                key={s}
                className={`flex-1 px-4 py-3 text-xs font-medium flex items-center gap-2 ${
                  i + 1 === step
                    ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                    : i + 1 < step
                    ? 'text-green-400'
                    : 'text-gray-500'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  i + 1 < step
                    ? 'bg-green-500 text-white'
                    : i + 1 === step
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {i + 1 < step ? '✓' : i + 1}
                </span>
                {s}
              </div>
            ))}
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto">

            {/* ✅ Step 1 — Recursive dynamic event tree */}
            {step === 1 && (
              <div>
                <h2 className="text-white font-semibold text-lg mb-1">
                  Select which events to listen to
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                  Hover any event to add a child. No limit on depth or count.
                </p>

                {/* Dynamic recursive tree */}
                <div className="space-y-2">
                  {Object.entries(eventTree).map(([key, node]) => (
                    <EventTreeNode
                      key={key}
                      eventKey={key}
                      node={node}
                      selectedEvents={selectedEvents}
                      onToggle={handleToggle}
                      onAddChild={handleAddChild}
                      parentPath={[]}
                      depth={0}
                    />
                  ))}
                </div>

                {/* Add root event group */}
                <AddRootEvent onAdd={handleAddRootEvent} />

                <p className="text-gray-500 text-xs mt-4">
                  {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}

            {/* ✅ Step 2 — Dynamic destinations from DB */}
            {step === 2 && (
              <div>
                <h2 className="text-white font-semibold text-lg mb-1">
                  Choose where to send events
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                  Only Webhook endpoint is available by default. Add more below.
                </p>

                {destinationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <svg className="w-5 h-5 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {destinations.map((dest) => (
                      <div
                        key={dest.type}
                        onClick={() => setDestinationType(dest.type)}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition ${
                          destinationType === dest.type
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                        }`}
                      >
                        <span className="text-2xl">{dest.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium text-sm">{dest.label}</p>
                            {dest.isDefault && (
                              <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded">
                                default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-xs mt-0.5">{dest.description}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* ✅ Remove button — only for non-default */}
                          {dest.removable && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm(`Remove "${dest.label}"?`)) {
                                  await removeDestination(dest.type);
                                  if (destinationType === dest.type) {
                                    setDestinationType('webhook_endpoint');
                                  }
                                }
                              }}
                              className="p-1 text-gray-600 hover:text-red-400 transition"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}

                          {/* Radio indicator */}
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            destinationType === dest.type
                              ? 'border-indigo-500'
                              : 'border-gray-600'
                          }`}>
                            {destinationType === dest.type && (
                              <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* ✅ Add new destination form */}
                    <AddDestinationForm onAdd={addDestination} />
                  </div>
                )}
              </div>
            )}

            {/* Step 3 — Configure */}
            {step === 3 && (
              <div>
                <h2 className="text-white font-semibold text-lg mb-1">
                  Configure your destination
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                  Set your endpoint details and payload style.
                </p>

                {error && (
                  <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Summary */}
                <div className="bg-gray-800 rounded-xl p-4 mb-4 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Destination</span>
                    <span className="text-gray-300 flex items-center gap-1">
                      {selectedDestination?.icon} {selectedDestination?.label ?? destinationType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Selected events</span>
                    <span className="text-gray-300">{selectedEvents.length} events</span>
                  </div>
                  <div className="pt-1 flex flex-wrap gap-1">
                    {selectedEvents.slice(0, 5).map((e) => (
                      <span
                        key={e}
                        className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded font-mono text-xs"
                      >
                        {e}
                      </span>
                    ))}
                    {selectedEvents.length > 5 && (
                      <span className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs">
                        +{selectedEvents.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Destination name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="my-webhook-endpoint"
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Endpoint URL
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://"
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  {/* Payload style */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Payload style
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['snapshot', 'thin'] as PayloadStyle[]).map((style) => (
                        <div
                          key={style}
                          onClick={() => setPayloadStyle(style)}
                          className={`p-3 rounded-xl border cursor-pointer transition ${
                            payloadStyle === style
                              ? 'border-indigo-500 bg-indigo-500/10'
                              : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                          }`}
                        >
                          <p className="text-white text-sm font-medium capitalize">{style}</p>
                          <p className="text-gray-400 text-xs mt-1">
                            {style === 'snapshot'
                              ? 'Full event data included'
                              : 'Minimal payload, just IDs'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <button
              onClick={step === 1 ? onClose : () => setStep((s) => s - 1)}
              className="px-4 py-2 text-gray-400 hover:text-white text-sm transition"
            >
              {step === 1 ? 'Cancel' : '← Back'}
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 1 && selectedEvents.length === 0}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
              >
                {loading ? 'Creating...' : 'Create webhook'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

AddWebhookModal.displayName = 'AddWebhookModal';
export default AddWebhookModal;
