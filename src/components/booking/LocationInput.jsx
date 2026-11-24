import React, { useState, useRef, useEffect } from 'react';
import { BENGALURU_PRESETS } from '../../constants/locations';
import { Search, X, MapPin, Navigation, Building2, Train, Plane, Compass } from 'lucide-react';

export const LocationInput = ({
  label,
  value,
  onChange,
  onClear,
  type = 'pickup', // 'pickup' | 'destination'
  placeholder = 'Search location in Bengaluru...',
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);

  // Filter presets based on user typing
  const filtered = BENGALURU_PRESETS.filter((p) => {
    if (!value) return true;
    const q = value.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.shortName && p.shortName.toLowerCase().includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q))
    );
  }).slice(0, 5);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'airport':
        return <Plane size={14} className="text-blue-500" />;
      case 'transit':
      case 'metro':
        return <Train size={14} className="text-amber-500" />;
      case 'tech-park':
        return <Building2 size={14} className="text-purple-500" />;
      default:
        return <Compass size={14} className="text-gray-400" />;
    }
  };

  return (
    <div ref={containerRef} className="relative mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center space-x-1.5">
          {type === 'pickup' ? (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950/60 inline-block" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-100 dark:ring-red-950/60 inline-block" />
          )}
          <span>{label}</span>
        </label>
        {value && (
          <button
            type="button"
            onClick={() => {
              onClear();
              setShowSuggestions(false);
            }}
            className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="relative flex items-center">
        {/* Leading Pin Icon */}
        <div className="absolute left-3 pointer-events-none text-gray-400">
          {type === 'pickup' ? (
            <Navigation size={16} className="text-emerald-600 dark:text-emerald-400" />
          ) : (
            <MapPin size={16} className="text-red-500 dark:text-red-400" />
          )}
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all shadow-sm"
        />

        {value && (
          <button
            type="button"
            onClick={() => {
              onClear();
              setShowSuggestions(false);
            }}
            className="absolute right-3 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filtered.length > 0 && (
        <ul className="absolute z-40 left-0 right-0 mt-1 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 animate-in fade-in slide-in-from-top-1 duration-150">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="px-3.5 py-2.5 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 cursor-pointer transition-colors flex items-start space-x-2.5"
              onMouseDown={() => {
                onChange(p.name);
                setShowSuggestions(false);
              }}
            >
              <div className="mt-0.5 p-1 rounded-md bg-gray-100 dark:bg-gray-800">
                {getCategoryIcon(p.category)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {p.name}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {p.shortName || p.address}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
