import { useState, useRef, type ReactNode } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  icon?: ReactNode;
  clearable?: boolean;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  onClear?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  type?: string;
  min?: number;
  max?: number;
  maxLength?: number;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  disabled,
  loading,
  error,
  icon,
  clearable = true,
  autoFocus,
  className = '',
  inputClassName = '',
  onClear,
  onKeyDown,
  type = 'text',
  min,
  max,
  maxLength,
}: SearchInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  };

  const hasValue = value.length > 0;

  return (
    <div className={`relative ${className}`}>
      {/* Icon */}
      {icon !== undefined ? (
        <div className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors duration-150 ${focused ? 'text-ink-300' : 'text-ink-500'}`}>
          {icon}
        </div>
      ) : (
        <svg
          className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors duration-150 ${focused ? 'text-ink-300' : 'text-ink-500'}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      )}

      {/* Input */}
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        min={min}
        max={max}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
        className={`w-full h-10 bg-surface border border-border text-sm text-ink placeholder:text-ink-400 focus:outline-none focus:border-ink-300 focus:bg-surface-200 transition-all duration-150 ${icon !== undefined ? 'pl-10' : value ? 'pl-3.5' : 'pl-3.5'} pr-${loading || (clearable && hasValue) ? '9' : '3.5'} disabled:opacity-40 disabled:cursor-not-allowed ${error ? 'border-critical' : ''} ${inputClassName}`}
        style={{ paddingRight: loading || (clearable && hasValue) ? '36px' : '14px', paddingLeft: icon !== undefined ? '40px' : '14px' }}
      />

      {/* Loading spinner */}
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-ink-500 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* Clear button */}
      {!loading && clearable && hasValue && (
        <button
          type="button"
          onClick={handleClear}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-ink-500 hover:text-ink transition-colors duration-150"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Error */}
      {error && (
        <p className="text-[11px] font-mono text-critical mt-1">{error}</p>
      )}
    </div>
  );
}
