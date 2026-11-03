import { useRef, useState } from 'react';
import { ImagePlus, Link2, Loader2, Star, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { readJSON } from '../../context/AuthContext.jsx';

const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_SIDE = 1600;

// Shrinks big photos (phone pictures are often 4000px+) to 1600px WebP before upload
async function prepare(file) {
  if (file.type === 'image/gif' || file.size < 600 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', 0.86));
    return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' }) : file;
  } catch {
    return file;
  }
}

// Upload, preview, remove and reorder the images for one color. images: string[] of URLs.
export default function ImageUploader({ images, onChange }) {
  const { authFetch } = useAuth();
  const input = useRef(null);
  const [uploading, setUploading] = useState([]); // [{ id, preview }]
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [url, setUrl] = useState('');
  // Uploads finish in any order, so always append to the newest list
  const latest = useRef(images);
  latest.current = images;

  const upload = async (files) => {
    setError('');
    const list = [...files];
    const bad = list.find((f) => !TYPES.includes(f.type));
    if (bad) { setError(`${bad.name} isn't a supported image (JPG, PNG, WebP, AVIF or GIF).`); return; }

    await Promise.all(list.map(async (original) => {
      const id = Math.random().toString(36).slice(2);
      const preview = URL.createObjectURL(original);
      setUploading((u) => [...u, { id, preview }]);
      try {
        const file = await prepare(original);
        if (file.size > MAX_BYTES) throw new Error(`${original.name} is larger than 5 MB.`);
        const { url: uploaded } = await authFetch('/api/admin/uploads', {
          method: 'POST', headers: { 'Content-Type': file.type }, body: file,
        }).then(readJSON);
        latest.current = [...latest.current, uploaded];
        onChange(latest.current);
      } catch (err) {
        setError(err.message);
      } finally {
        setUploading((u) => u.filter((x) => x.id !== id));
        URL.revokeObjectURL(preview);
      }
    }));
  };

  const remove = (i) => onChange(images.filter((_, j) => j !== i));
  const makeMain = (i) => onChange([images[i], ...images.filter((_, j) => j !== i)]);
  const addUrl = () => {
    if (!/^https?:\/\/\S+$/.test(url.trim())) { setError('Enter a full image link starting with https://'); return; }
    onChange([...images, url.trim()]);
    setUrl(''); setUrlMode(false); setError('');
  };

  return (
    <div className="imgup">
      <div className="imgup__grid">
        {images.map((src, i) => (
          <div key={src + i} className={`imgup__thumb ${i === 0 ? 'is-main' : ''}`}>
            <img src={src} alt="" />
            {i === 0
              ? <span className="imgup__badge">Main</span>
              : <button type="button" className="imgup__star" onClick={() => makeMain(i)} title="Make main photo"><Star size={13} /></button>}
            <button type="button" className="imgup__remove" onClick={() => remove(i)} aria-label="Remove image"><X size={13} /></button>
          </div>
        ))}
        {uploading.map((u) => (
          <div key={u.id} className="imgup__thumb is-uploading">
            <img src={u.preview} alt="" />
            <span className="imgup__spin"><Loader2 size={20} /></span>
          </div>
        ))}
        <button
          type="button"
          className={`imgup__drop ${dragging ? 'is-dragging' : ''} ${images.length || uploading.length ? '' : 'is-empty'}`}
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files); }}
        >
          <ImagePlus size={22} />
          <strong>{images.length ? 'Add more' : 'Upload photos'}</strong>
          <small>Drag & drop or click · JPG, PNG, WebP · max 5 MB</small>
        </button>
      </div>
      <input ref={input} type="file" accept={TYPES.join(',')} multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />

      {urlMode ? (
        <div className="imgup__url">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }} />
          <button type="button" className="btn btn--sm abtn" onClick={addUrl}>Add</button>
          <button type="button" className="imgup__link" onClick={() => setUrlMode(false)}>Cancel</button>
        </div>
      ) : (
        <button type="button" className="imgup__link" onClick={() => setUrlMode(true)}><Link2 size={13} /> or add from a link</button>
      )}
      {error && <p className="imgup__error">{error}</p>}
    </div>
  );
}
