import { useEffect } from 'react';
import './Toast.css';

function Toast({ message, tone = 'success', onDone }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div className={`toast toast-${tone}`} role="status">
      <span className="toast-mark">{tone === 'success' ? '✓' : '!'}</span>
      <span>{message}</span>
    </div>
  );
}

export default Toast;