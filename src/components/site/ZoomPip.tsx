/* The small badge that appears on a gallery image to say it will open larger.
   Purely decorative — the button around it carries the accessible label. */
export default function ZoomPip() {
  return (
    <span className="zoom-pip" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4.2-4.2M11 8.4v5.2M8.4 11h5.2" />
      </svg>
    </span>
  );
}
