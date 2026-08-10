import { useCallback, useState } from 'react';

/* Shared lightbox state. One instance per page; any grid on that page can
   hand it its own set of images, so arrows walk the grid the visitor
   actually clicked rather than every image on the page. */

export interface LightboxItem {
  src: string;
  alt: string;
  caption?: string;
  sub?: string;
}

export function useLightbox() {
  const [items, setItems] = useState<LightboxItem[]>([]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const openAt = useCallback((list: LightboxItem[], i: number) => {
    setItems(list);
    setIndex(i);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  /* wraps at both ends so the arrows never dead-end */
  const next = useCallback(
    () => setIndex(i => (items.length ? (i + 1) % items.length : 0)),
    [items.length]
  );
  const prev = useCallback(
    () => setIndex(i => (items.length ? (i - 1 + items.length) % items.length : 0)),
    [items.length]
  );

  return { items, index, open, openAt, close, next, prev };
}
