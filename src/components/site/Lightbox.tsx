import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { LightboxItem } from '../../lib/useLightbox';
import { useContent } from '../../lib/SiteContentProvider';

interface Props {
  items: LightboxItem[];
  index: number;
  open: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Lightbox({ items, index, open, onClose, onNext, onPrev }: Props) {
  const { lang } = useContent();
  const es = lang === 'es';
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<Element | null>(null);
  const touchX = useRef<number | null>(null);

  /* keyboard, scroll lock, focus handling */
  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); onNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); onPrev(); }
      else if (e.key === 'Tab') {
        /* single focus ring — keep Tab inside the dialog */
        const focusables = document.querySelectorAll<HTMLElement>('.lb [data-lb-focus]');
        if (!focusables.length) return;
        const list = Array.from(focusables);
        const first = list[0], last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    const prevPad = document.body.style.paddingRight;
    const bar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (bar > 0) document.body.style.paddingRight = bar + 'px';
    closeRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPad;
      (restoreRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose, onNext, onPrev]);

  if (!open || !items.length) return null;
  const item = items[Math.min(index, items.length - 1)];
  const many = items.length > 1;

  /* keep the neighbours warm so arrowing through feels instant */
  const near = many
    ? [items[(index + 1) % items.length], items[(index - 1 + items.length) % items.length]]
    : [];

  return createPortal(
    <div
      className="lb"
      role="dialog"
      aria-modal="true"
      aria-label={es ? 'Visor de imágenes' : 'Image viewer'}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      onTouchStart={e => { touchX.current = e.changedTouches[0].clientX; }}
      onTouchEnd={e => {
        if (touchX.current === null || !many) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 55) { dx < 0 ? onNext() : onPrev(); }
        touchX.current = null;
      }}
    >
      <button
        ref={closeRef}
        className="lb-x"
        data-lb-focus
        onClick={onClose}
        aria-label={es ? 'Cerrar' : 'Close'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>

      {many && (
        <button
          className="lb-arrow prev"
          data-lb-focus
          onClick={e => { e.stopPropagation(); onPrev(); }}
          aria-label={es ? 'Anterior' : 'Previous'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-8 7 8 7" /></svg>
        </button>
      )}

      <figure className="lb-stage" onClick={e => e.stopPropagation()}>
        <img
          key={item.src}
          className="lb-img"
          src={item.src}
          alt={item.alt}
          decoding="async"
        />
        {(item.caption || many) && (
          <figcaption className="lb-cap">
            {item.sub && <span className="lb-sub">{item.sub}</span>}
            {item.caption && <span className="lb-text">{item.caption}</span>}
            {many && (
              <span className="lb-count">
                {index + 1} {es ? 'de' : 'of'} {items.length}
              </span>
            )}
          </figcaption>
        )}
      </figure>

      {many && (
        <button
          className="lb-arrow next"
          data-lb-focus
          onClick={e => { e.stopPropagation(); onNext(); }}
          aria-label={es ? 'Siguiente' : 'Next'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l8 7-8 7" /></svg>
        </button>
      )}

      <div className="lb-pre" aria-hidden="true">
        {near.map(n => <img key={n.src} src={n.src} alt="" decoding="async" />)}
      </div>
    </div>,
    document.body
  );
}
