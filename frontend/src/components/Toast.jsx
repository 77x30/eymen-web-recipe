import { useState, useEffect, createContext, useContext } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const updateToast = (id, message, type) => {
    setToasts(prev => prev.map(t => 
      t.id === id ? { ...t, message, type } : t
    ));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, updateToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const iconMap = {
    info: 'info',
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    loading: 'sync'
  };

  const colorMap = {
    info: 'bg-blue-600',
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-amber-600',
    loading: 'bg-blue-600'
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-white
        transform transition-all duration-300 ease-out
        ${colorMap[toast.type] || colorMap.info}
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <span className={`icon ${toast.type === 'loading' ? 'animate-spin' : ''}`}>
        {iconMap[toast.type] || iconMap.info}
      </span>
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      {toast.type !== 'loading' && (
        <button onClick={handleRemove} className="opacity-70 hover:opacity-100 transition">
          <span className="icon icon-sm">close</span>
        </button>
      )}
    </div>
  );
}

export default ToastProvider;
