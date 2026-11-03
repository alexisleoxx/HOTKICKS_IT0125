import { useState } from 'react';

const FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260"><rect width="400" height="260" fill="#151515"/><path d="M60 170c40 0 70-50 110-60 30-8 50 20 90 30s70 10 80 30v20H60z" fill="#2a2a2a"/><path d="M60 190h280v14H60z" fill="#3a3a3a"/><text x="200" y="80" fill="#555" font-family="Arial" font-weight="700" font-size="22" text-anchor="middle">HOTKICKS</text></svg>`);

export default function ShoeImage({ src, alt, className, ...rest }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed ? FALLBACK : src}
      alt={alt}
      className={className}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
