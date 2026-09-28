import { useEffect, useRef } from 'react';
import './ConfirmDialog.css';

function ConfirmDialog({
  open,
  title,
  message,
  detail,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    confirmRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="cd-backdrop" onMouseDown={onCancel}>
      <div
        className="cd-box"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cd-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span className="eyebrow">{tone === 'danger' ? 'Confirm removal' : 'Confirm'}</span>
        <h2 id="cd-title">{title}</h2>
        <p className="cd-message">{message}</p>
        {detail && <p className="cd-detail">{detail}</p>}

        <div className="cd-actions">
          <button type="button" className="cd-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmRef}
            className={`cd-confirm${tone === 'danger' ? ' is-danger' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;