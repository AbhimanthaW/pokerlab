import { useEffect, useRef, type ReactNode } from "react";
export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => previous?.focus();
  }, []);
  return <div className="immersive-scrim" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="immersive-dialog" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={panel}
      onKeyDown={(e) => {
        if (e.key === "Escape") { e.stopPropagation(); onClose(); }
        if (e.key !== "Tab") return;
        const elements = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,[tabindex="0"]');
        if (!elements?.length) { e.preventDefault(); return; }
        const first = elements[0], last = elements[elements.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { first.focus(); e.preventDefault(); }
      }}>
      <div className="dialog-heading"><h2>{title}</h2><button className="hud-button" onClick={onClose} aria-label={`Close ${title}`}>✕</button></div>
      {children}
    </div>
  </div>;
}
