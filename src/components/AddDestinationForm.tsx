import { useState } from 'react';

interface Props {
  onAdd: (
    type: string,
    label: string,
    description: string,
    icon: string
  ) => Promise<void>;
}

const PRESET_ICONS = ['☁️', '🔷', '🔴', '🟢', '⚡', '🌐', '📡', '🛰️', '🔌', '📮'];

export default function AddDestinationForm({ onAdd }: Props) {
  const [show, setShow] = useState(false);
  const [type, setType] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🌐');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    const trimmedType = type.trim().toLowerCase().replace(/\s+/g, '_');
    const trimmedLabel = label.trim();
    const trimmedDesc = description.trim();

    if (!trimmedType || !trimmedLabel || !trimmedDesc) {
      setError('All fields are required');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(trimmedType)) {
      setError('Type: lowercase letters, numbers, underscores only');
      return;
    }

    setLoading(true);
    try {
      await onAdd(trimmedType, trimmedLabel, trimmedDesc, icon);
      setType('');
      setLabel('');
      setDescription('');
      setIcon('🌐');
      setError('');
      setShow(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add destination');
    } finally {
      setLoading(false);
    }
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-700 hover:border-indigo-500 text-gray-500 hover:text-indigo-400 rounded-xl text-sm transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add destination from config
      </button>
    );
  }

  return (
    <div className="p-4 bg-gray-800 border border-indigo-500/20 rounded-xl space-y-3">
      <p className="text-indigo-400 text-sm font-medium">New destination</p>

      {/* Icon picker */}
      <div>
        <p className="text-gray-400 text-xs mb-2">Choose icon</p>
        <div className="flex gap-2 flex-wrap">
          {PRESET_ICONS.map((i) => (
            <button
              key={i}
              onClick={() => setIcon(i)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition ${
                icon === i
                  ? 'bg-indigo-600 ring-2 ring-indigo-400'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Type key</label>
          <input
            type="text"
            value={type}
            onChange={(e) => { setType(e.target.value); setError(''); }}
            placeholder="amazon_eventbridge"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => { setLabel(e.target.value); setError(''); }}
            placeholder="Amazon EventBridge"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-xs focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      <div>
        <label className="text-gray-400 text-xs mb-1 block">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => { setDescription(e.target.value); setError(''); }}
          placeholder="Send events to your AWS account."
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-xs focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-xs font-medium rounded-lg transition"
        >
          {loading ? 'Saving...' : 'Add destination'}
        </button>
        <button
          onClick={() => { setShow(false); setError(''); }}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}