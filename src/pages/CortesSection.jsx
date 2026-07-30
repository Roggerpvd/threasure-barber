import React, { useState, useRef, useEffect } from 'react';
import { uploadCorte, getCortes, deleteCorte, getThumbnail, formatBytes } from '../../cloudinary/upload';

const CATEGORIES = [
  { id: 'corte',    label: 'CORTE' },
  { id: 'barba',    label: 'BARBA' },
  { id: 'fade',     label: 'FADE' },
  { id: 'diseño',   label: 'DISEÑO' },
  { id: 'completo', label: 'COMPLETO' },
];

export default function CortesSection() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('corte');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cortes, setCortes] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadCortes();
  }, []);

  const loadCortes = async () => {
    try {
      const data = await getCortes();
      setCortes(data);
    } catch (err) {
      console.error('Error cargando cortes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setError('');
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setError('Selecciona un archivo'); return; }
    if (!title.trim()) { setError('Agrega un título'); return; }

    setError('');
    setSuccess('');
    setUploading(true);
    setProgress(0);

    try {
      await uploadCorte(file, { title, description, category }, setProgress);
      setSuccess('✅ ¡Subido con éxito!');
      setFile(null);
      setPreview(null);
      setTitle('');
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadCortes();
    } catch (err) {
      setError(err.message || 'Error al subir');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (corte) => {
    if (!confirm(`¿Eliminar "${corte.title}" de la galería?`)) return;
    try {
      await deleteCorte(corte);
      loadCortes();
    } catch (err) {
      setError('Error al eliminar');
    }
  };

  return (
    <div className="mb-12">
      <h2 className="font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-6 flex items-center gap-2">
        GALERÍA DE CORTES
        {cortes.length > 0 && (
          <span className="bg-primary text-on-primary w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
            {cortes.length}
          </span>
        )}
      </h2>

      <form onSubmit={handleUpload} className="bg-surface-container-low p-6 md:p-8 mb-8 border border-outline/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-4">
              FOTO O VIDEO
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-outline/20 hover:border-primary aspect-square flex items-center justify-center cursor-pointer overflow-hidden bg-background/50 transition-colors"
            >
              {preview ? (
                file?.type.startsWith('video/') ? (
                  <video src={preview} className="w-full h-full object-cover" muted playsInline />
                ) : (
                  <img src={preview} className="w-full h-full object-cover" alt="preview" />
                )
              ) : (
                <div className="text-center p-6">
                  <span className="material-symbols-outlined text-5xl text-on-background/30">
                    add_a_photo
                  </span>
                  <p className="font-nav-label text-[10px] uppercase tracking-widest text-on-background/40 mt-3">
                    Toca para tomar foto o video
                  </p>
                  <p className="font-body-main text-xs text-on-background/30 mt-1">
                    JPG, PNG, MP4 (máx 100MB)
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            {file && (
              <p className="font-body-main text-xs text-on-background/40 mt-2">
                {file.name} — {formatBytes(file.size)}
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="block font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-3">
                TÍTULO
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Fade bajo + texturizado"
                className="w-full bg-transparent border-b border-outline/20 focus:border-primary focus:ring-0 px-0 py-3 font-body-main text-primary placeholder:text-on-background/30 outline-none"
              />
            </div>

            <div>
              <label className="block font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-3">
                DESCRIPCIÓN (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Detalles del corte, técnica usada..."
                className="w-full bg-transparent border-b border-outline/20 focus:border-primary focus:ring-0 px-0 py-3 font-body-main text-primary placeholder:text-on-background/30 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block font-nav-label text-[11px] uppercase tracking-widest text-on-background/40 mb-3">
                CATEGORÍA
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`font-nav-label text-[10px] uppercase tracking-widest px-3 py-2 border transition-all ${
                      category === cat.id
                        ? 'bg-primary border-primary text-on-primary'
                        : 'border-outline/20 text-on-background/40 hover:border-primary'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="font-body-main text-sm text-red-400 bg-red-500/10 p-3 border border-red-500/20">
                {error}
              </p>
            )}
            {success && (
              <p className="font-body-main text-sm text-green-400 bg-green-500/10 p-3 border border-green-500/20">
                {success}
              </p>
            )}

            {uploading && (
              <div>
                <div className="flex justify-between font-nav-label text-[10px] uppercase tracking-widest text-on-background/40 mb-2">
                  <span>SUBIENDO</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1 bg-outline/10 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-primary text-on-primary px-6 py-4 font-nav-label text-[11px] uppercase tracking-widest hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? `SUBIENDO ${progress}%` : 'SUBIR A LA GALERÍA'}
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <p className="font-body-small text-on-background/30 text-sm italic text-center py-8">
          Cargando galería...
        </p>
      ) : cortes.length === 0 ? (
        <p className="font-body-small text-on-background/30 text-sm italic text-center py-8">
          Aún no has subido ningún corte. Sube el primero arriba ↑
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {cortes.map((corte) => (
            <div key={corte.id} className="group relative bg-surface-container-low overflow-hidden">
              <div className="relative aspect-square">
                <img
                  src={getThumbnail(corte)}
                  className="w-full h-full object-cover"
                  alt={corte.title}
                  loading="lazy"
                />
                {corte.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                    <span className="material-symbols-outlined text-white text-3xl">
                      play_circle
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-headline-md text-xs uppercase text-primary truncate">
                  {corte.title}
                </p>
                <p className="font-body-main text-[9px] text-on-background/40 mt-1 uppercase">
                  {corte.category}
                </p>
              </div>
              <button
                onClick={() => handleDelete(corte)}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}