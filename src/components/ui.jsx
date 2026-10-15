import { useEffect } from 'react';

export function Modal({ children, onClose, width = 'max-w-2xl' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`w-full ${width} max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl`}>{children}</div>
    </div>
  );
}

const TONES = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-700',
};

export function Badge({ tone = 'gray', children }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>{children}</span>;
}

export const statusTone = (s) => (s === 'Completado' ? 'green' : s === 'No completado' ? 'red' : s === 'Pendiente' ? 'amber' : 'blue');
export const projectTone = (s) => (s === 'Finalizado' ? 'green' : s === 'Atrasado' ? 'red' : s === 'En riesgo' ? 'amber' : 'blue');

export function Chip({ active, onClick, children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded-full border px-2.5 py-1 text-xs transition ${
        active ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

export function Field({ label, error, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600';