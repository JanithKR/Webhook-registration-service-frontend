import { useState } from 'react';

interface Props {
  onAdd: (key: string, label: string) => void;
}

export default function AddRootEvent({ onAdd }: Props) {
  const [show, setShow] = useState(false);
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    const trimmedKey = key.trim().toLowerCase();
    const trimmedLabel = label.trim();

    if (!trimmedKey || !trimmedLabel) {
      setError('Both key and label are required');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(trimmedKey)) {
      setError('Key: lowercase letters, numbers, underscores only');
      return;
    }

    onAdd(trimmedKey, trimmedLabel);
    setKey('');
    setLabel('');
    setError('');
    setShow(false);
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-700 hover:border-indigo-500 text-gray-500 hover:text-indigo-400 rounded-xl text-sm transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add new event group
      </button>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-800 border border-indigo-500/20 rounded-xl space-y-3">
      <p className="text-indigo-400 text-sm font-medium">New root event group</p>

      <div className="flex gap-2">
        <input
          type="text"
          value={key}
          onChange={(e) => { setKey(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="event_key"
          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm font-mono focus:outline-none focus:border-indigo-500 transition"
        />
        <input
          type="text"
          value={label}
          onChange={(e) => { setLabel(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Event Group Label"
          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition"
        >
          Add group
        </button>
        <button
          onClick={() => { setShow(false); setKey(''); setLabel(''); setError(''); }}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}