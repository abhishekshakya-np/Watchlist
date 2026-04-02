import { useEffect, useId, useRef } from 'react';

export default function ConfirmDialog({
  open = false,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  confirmDisabled = false,
  className = '',
  onConfirm,
  onCancel,
}) {
  const idBase = useId();
  const titleId = `${idBase}-title`;
  const descId = `${idBase}-desc`;
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const rootClass = `modal confirm-dialog ${className}`.trim();

  return (
    <div className="modal-overlay" onClick={onCancel} role="presentation">
      <div
        className={rootClass}
        onClick={(ev) => ev.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <div className="modal-header">
          <h3 id={titleId}>{title}</h3>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="Close dialog">
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p id={descId} className="confirm-dialog__description">
            {description}
          </p>
          <div className="confirm-dialog__actions">
            <button ref={cancelRef} type="button" className="btn secondary" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button
              type="button"
              className={danger ? 'btn btn-danger' : 'btn primary'}
              onClick={onConfirm}
              disabled={confirmDisabled}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
