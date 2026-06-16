import { useEffect, Fragment } from 'react';

export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className={`${sizes[size] || sizes.md} border-2 border-blue-600 border-t-transparent rounded-full animate-spin`} />
  );
}

export function Button({
  children, onClick, type = 'button', variant = 'primary', size = 'md',
  disabled = false, loading = false, className = '', ...rest
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-400',
    danger:  'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost:   'text-gray-600 hover:bg-gray-100 focus:ring-gray-400',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  };
  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-2.5',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

export function Input({
  label, error, required, type = 'text', placeholder, value, onChange,
  disabled, maxLength, className = '', ...rest
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={`border rounded-lg px-3 py-2 text-sm transition-colors outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
        } ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
        {...rest}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Select({
  label, error, required, options = [], placeholder, value, onChange,
  disabled, className = ''
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled}
        className={`border rounded-lg px-3 py-2 text-sm bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-300'
        } ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Field({ label, required, error, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, required, rows = 3, value, onChange, placeholder, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        className={`border rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Tabs({ tabs = [], active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
            active === tab.id
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const sizeClass = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {}
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose} />
      {}
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${sizeClass[size] || sizeClass.md} max-h-[90vh] flex flex-col`}>
        {}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>
        {}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {children}
        </div>
        {}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

const BADGE_STYLES = {
  active:        'bg-green-100 text-green-700',
  inactive:      'bg-gray-100 text-gray-600',
  pending:       'bg-yellow-100 text-yellow-700',
  approved:      'bg-green-100 text-green-700',
  rejected:      'bg-red-100 text-red-700',
  terminated:    'bg-red-100 text-red-700',
  probation:     'bg-blue-100 text-blue-700',
  notice:        'bg-orange-100 text-orange-700',
  absconding:    'bg-red-100 text-red-700',
  full_time:     'bg-blue-50 text-blue-700',
  part_time:     'bg-purple-50 text-purple-700',
  contract:      'bg-orange-50 text-orange-700',
  intern:        'bg-teal-50 text-teal-700',
  draft:         'bg-gray-100 text-gray-600',
  locked:        'bg-blue-100 text-blue-700',
  published:     'bg-green-100 text-green-700',
  processed:     'bg-purple-100 text-purple-700',
  filed:         'bg-green-100 text-green-700',
  overdue:       'bg-red-100 text-red-700',
  available:     'bg-green-100 text-green-700',
  allocated:     'bg-blue-100 text-blue-700',
  under_repair:  'bg-orange-100 text-orange-700',
};

export function Badge({ value }) {
  if (!value) return null;
  const label  = String(value).replace(/_/g, ' ');
  const styles = BADGE_STYLES[value] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles}`}>
      {label}
    </span>
  );
}

export function Avatar({ name = '', photoUrl, size = 'md' }) {
  const sizes  = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-xl' };
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  if (photoUrl) {
    return <img src={photoUrl} alt={name} className={`${sizes[size]} rounded-full object-cover`} />;
  }

  const colors = ['bg-blue-500','bg-green-500','bg-purple-500','bg-orange-500','bg-pink-500','bg-teal-500'];
  const color  = colors[name.charCodeAt(0) % colors.length] || 'bg-blue-500';

  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({ icon, label, value, sub, color = 'blue', onClick }) {
  const colors = {
    blue:   'bg-blue-50 border-blue-100',
    green:  'bg-green-50 border-green-100',
    orange: 'bg-orange-50 border-orange-100',
    red:    'bg-red-50 border-red-100',
    purple: 'bg-purple-50 border-purple-100',
    gray:   'bg-gray-50 border-gray-200',
  };
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 ${colors[color] || colors.gray} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger', loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title || 'Confirm'}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-sm text-gray-600 py-2">{message}</p>
    </Modal>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
      />
      {value && (
        <button onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
      )}
    </div>
  );
}

export function Alert({ type = 'info', children }) {
  const styles = {
    info:    'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error:   'bg-red-50 border-red-200 text-red-800',
  };
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  return (
    <div className={`flex gap-2 items-start border rounded-xl p-3 text-sm ${styles[type] || styles.info}`}>
      <span className="flex-shrink-0">{icons[type]}</span>
      <div>{children}</div>
    </div>
  );
}

