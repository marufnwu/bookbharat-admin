import React from 'react';
import { Check, Plus, Search, X } from 'lucide-react';

export interface EntityItem {
  id: number;
  name: string;
}

interface EntityComboboxProps {
  label: string;
  value: string;
  selectedId?: number;
  items: EntityItem[];
  onChange: (value: string, selectedId?: number) => void;
  onClear: () => void;
  placeholder?: string;
  createTitle?: string;
  createPrompt?: string;
  notFoundHint?: string;
  addNewHint?: string;
}

const EntityCombobox: React.FC<EntityComboboxProps> = ({
  label,
  value,
  selectedId,
  items,
  onChange,
  onClear,
  placeholder = 'Search or type name...',
  createTitle = 'Create',
  createPrompt = 'name not found, click to create',
  notFoundHint = 'Not found, click to create',
  addNewHint = 'Add new',
}) => {
  const [search, setSearch] = React.useState('');
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const [draftName, setDraftName] = React.useState('');

  const list = Array.isArray(items) ? items : [];

  const commitCreate = () => {
    const name = draftName.trim();
    if (!name) return;
    onChange(name, undefined);
    setShowCreate(false);
    setDraftName('');
    setSearch('');
  };

  const cancelCreate = () => {
    setShowCreate(false);
    setDraftName('');
    setSearch('');
  };

  const selectItem = (item: EntityItem) => {
    onChange(item.name, item.id);
    setSearch('');
    setShowDropdown(false);
  };

  const startCreate = (seed?: string) => {
    const name = (seed ?? search).trim();
    setDraftName(name);
    setShowCreate(true);
    setShowDropdown(false);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      {showCreate ? (
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Plus className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">{createTitle}</span>
            </div>
            <button
              type="button"
              onClick={cancelCreate}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-white rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitCreate();
                }
              }}
              placeholder="Enter name..."
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">Press Enter to create and select</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={commitCreate}
              disabled={!draftName.trim()}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Create &amp; Select
            </button>
            <button
              type="button"
              onClick={cancelCreate}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search || value || ''}
              onChange={(e) => {
                const next = e.target.value;
                setSearch(next);
                setShowDropdown(true);
                const selected = selectedId ? list.find((item) => item.id === selectedId) : undefined;
                onChange(next, selected && selected.name === next ? selected.id : undefined);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => {
                setTimeout(() => setShowDropdown(false), 200);
              }}
              placeholder={placeholder}
              className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {selectedId && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Check className="h-4 w-4 text-green-600" />
              </div>
            )}
            <button
              type="button"
              onClick={() => startCreate()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title={createTitle}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {showDropdown && (
            <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
              {(() => {
                const filtered = list.filter((item) =>
                  item.name.toLowerCase().includes((search || '').toLowerCase())
                );
                const exactMatch =
                  search.trim() &&
                  filtered.some((item) => item.name.toLowerCase() === search.trim().toLowerCase());

                if (filtered.length === 0 && search.trim()) {
                  return (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        startCreate(search);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-blue-50 transition-colors"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Plus className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-700">Create "{search}"</p>
                        <p className="text-xs text-gray-500">{notFoundHint}</p>
                      </div>
                    </button>
                  );
                }

                return (
                  <>
                    {filtered.slice(0, 10).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectItem(item);
                        }}
                        className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                          selectedId === item.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-gray-600">
                            {item.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        </div>
                        {selectedId === item.id && (
                          <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                    {filtered.length > 10 && (
                      <div className="px-4 py-2 text-xs text-gray-500 text-center border-t">
                        Showing 10 of {filtered.length}
                      </div>
                    )}
                    {search.trim() && !exactMatch && (
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          startCreate(search);
                        }}
                        className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-blue-50 transition-colors border-t"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Plus className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-700">Create "{search}"</p>
                          <p className="text-xs text-gray-500">{addNewHint}</p>
                        </div>
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {value && !showDropdown && (
            <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
              <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">{value.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium text-blue-900 truncate flex-1">{value}</span>
              <button
                type="button"
                onClick={onClear}
                className="text-blue-400 hover:text-blue-600 p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EntityCombobox;
