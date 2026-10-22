"use client";
import { useId, useRef } from "react";

export function ConfirmAction({
  label,
  title,
  description,
  confirmLabel,
  onConfirm,
  className = "button-secondary",
}: {
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const id = useId();
  function ask() {
    if (typeof dialog.current?.showModal === "function") {
      dialog.current.showModal();
      cancel.current?.focus();
    } else if (window.confirm(`${title}\n${description}`)) onConfirm();
  }
  return (
    <>
      <button type="button" className={className} onClick={ask}>
        {label}
      </button>
      <dialog
        className="confirm-dialog"
        ref={dialog}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
      >
        <span className="eyebrow">HUM / 请本人确认</span>
        <h2 id={`${id}-title`}>{title}</h2>
        <p id={`${id}-description`}>{description}</p>
        <div>
          <button
            type="button"
            className="button-secondary"
            ref={cancel}
            onClick={() => dialog.current?.close()}
          >
            保留当前记录
          </button>
          <button
            type="button"
            className="button-primary"
            onClick={() => {
              dialog.current?.close();
              onConfirm();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}
