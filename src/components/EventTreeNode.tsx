import { useState } from 'react';
import { collectLeaves } from '../types/events';
import type { EventNode } from '../types/events';

interface Props {
  eventKey: string;
  node: EventNode;
  selectedEvents: string[];
  onToggle: (key: string, node: EventNode) => void;
  onAddChild: (parentPath: string[], newKey: string, newLabel: string) => void;
  parentPath?: string[];
  depth?: number;
}

const getSelectionState = (
  key: string,
  node: EventNode,
  selectedEvents: string[]
): 'none' | 'partial' | 'all' => {
  const leaves = collectLeaves(key, node);
  if (leaves.length === 0) return 'none';
  const selectedCount = leaves.filter((l) => selectedEvents.includes(l)).length;
  if (selectedCount === 0) return 'none';
  if (selectedCount === leaves.length) return 'all';
  return 'partial';
};

export default function EventTreeNode({
  eventKey,
  node,
  selectedEvents,
  onToggle,
  onAddChild,
  parentPath = [],
  depth = 0,
}: Props) {
  const [expanded, setExpanded] = useState(depth === 0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [addError, setAddError] = useState('');

  // ✅ Fix 2 — null safety guard on children
  const hasChildren = node.children != null && Object.keys(node.children).length > 0;
  const selectionState = getSelectionState(eventKey, node, selectedEvents);
  const currentPath = [...parentPath, eventKey.split('.').pop()!];

  const handleAddSubmit = () => {
    const trimmedKey = newKey.trim().toLowerCase();
    const trimmedLabel = newLabel.trim();

    if (!trimmedKey) {
      setAddError('Key is required');
      return;
    }
    if (!trimmedLabel) {
      setAddError('Label is required');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(trimmedKey)) {
      setAddError('Key: lowercase letters, numbers, underscores only');
      return;
    }
    // ✅ Guard before accessing node.children
    if (node.children && node.children[trimmedKey]) {
      setAddError('This key already exists');
      return;
    }

    onAddChild(currentPath, trimmedKey, trimmedLabel);
    setNewKey('');
    setNewLabel('');
    setAddError('');
    setShowAddForm(false);
    setExpanded(true);
  };

  return (
    <div className={`${depth > 0 ? 'ml-5 border-l border-gray-700/50 pl-3' : ''}`}>
      {/* Node row */}
      <div className={`flex items-center gap-2 py-2 px-2 rounded-lg group hover:bg-gray-800/80 ${
        depth === 0 ? 'bg-gray-800/40' : ''
      }`}>

        {/* Expand arrow */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-gray-500 hover:text-gray-300 transition w-4 h-4 flex items-center justify-center shrink-0"
        >
          {hasChildren || showAddForm ? (
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-gray-700" />
          )}
        </button>

        {/* Checkbox */}
        <div
          onClick={() => onToggle(eventKey, node)}
          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition cursor-pointer ${
            selectionState === 'all'
              ? 'bg-indigo-600 border-indigo-600'
              : selectionState === 'partial'
              ? 'bg-indigo-600/40 border-indigo-500'
              : 'border-gray-600 bg-gray-700 hover:border-indigo-400'
          }`}
        >
          {selectionState === 'all' && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {selectionState === 'partial' && (
            <div className="w-2 h-0.5 bg-indigo-300 rounded" />
          )}
        </div>

        {/* Label + key */}
        <div
          className="flex-1 flex items-center justify-between min-w-0 cursor-pointer"
          onClick={() => setExpanded((e) => !e)}
        >
          <div className="min-w-0">
            <span className="text-white text-sm">{node.label}</span>
            <span className="text-gray-600 text-xs font-mono ml-2 truncate">
              {eventKey}
            </span>
          </div>
          {hasChildren && (
            <span className="text-gray-600 text-xs shrink-0 ml-2">
              {collectLeaves(eventKey, node).length} events
            </span>
          )}
        </div>

        {/* Add child button — visible on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowAddForm((s) => !s);
            setExpanded(true);
            setAddError('');
          }}
          title="Add child event"
          className="opacity-0 group-hover:opacity-100 transition w-6 h-6 flex items-center justify-center rounded-md bg-gray-700 hover:bg-indigo-600 text-gray-400 hover:text-white shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Children + add form */}
      {(hasChildren || showAddForm) && expanded && (
        <div className="mt-0.5 space-y-0.5">

          {/* ✅ Guard before mapping children */}
          {node.children != null && Object.entries(node.children).map(([key, child]) => (
            <EventTreeNode
              key={`${eventKey}.${key}`}
              eventKey={`${eventKey}.${key}`}
              node={child}
              selectedEvents={selectedEvents}
              onToggle={onToggle}
              onAddChild={onAddChild}
              parentPath={currentPath}
              depth={depth + 1}
            />
          ))}

          {/* Inline add child form */}
          {showAddForm && (
            <div className="ml-5 border-l border-indigo-500/30 pl-3 py-2">
              <div className="bg-gray-800 border border-indigo-500/20 rounded-xl p-3 space-y-2">
                <p className="text-indigo-400 text-xs font-medium">
                  Add child event under <span className="font-mono">{eventKey}</span>
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => { setNewKey(e.target.value); setAddError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubmit()}
                    placeholder="event_key"
                    className="flex-1 px-2.5 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-indigo-500 transition"
                  />
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => { setNewLabel(e.target.value); setAddError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubmit()}
                    placeholder="Event Label"
                    className="flex-1 px-2.5 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-xs focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                {addError && (
                  <p className="text-red-400 text-xs">{addError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleAddSubmit}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition"
                  >
                    Add child
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setAddError('');
                      setNewKey('');
                      setNewLabel('');
                    }}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}