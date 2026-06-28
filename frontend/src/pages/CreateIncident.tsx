import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { MapPin, X } from 'lucide-react';
import type { IncidentCategory } from '../types';

const categories: { value: IncidentCategory; label: string }[] = [
  { value: 'fire', label: 'Fire' },
  { value: 'medical', label: 'Medical' },
  { value: 'flood', label: 'Flood' },
  { value: 'earthquake', label: 'Earthquake' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'hazard', label: 'Hazard' },
  { value: 'other', label: 'Other' },
];

export function CreateIncident() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title: '', description: '', location: '', category: '' as IncidentCategory | '' });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const r = new FileReader();
      r.onload = (ev) => setPreview(ev.target?.result as string);
      r.readAsDataURL(f);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.location || !form.category) {
      toast.error('All fields required');
      return;
    }
    setSubmitting(true);
    try {
      await apiService.createIncident({
        title: form.title, description: form.description,
        location: form.location, category: form.category as IncidentCategory,
        image: file || undefined,
      });
      toast.success('Incident recorded');
      navigate('/incidents');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const valid = form.title && form.description && form.location && form.category;

  return (
    <div className="page max-w-2xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Report Incident</h1>
        <p className="page-subtitle">Submit an emergency report for triage and dispatch</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="panel space-y-5">
          <div>
            <label className="mono-label mb-1.5 block">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Substation fire" className="input" maxLength={200} required />
          </div>
          <div>
            <label className="mono-label mb-1.5 block">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the situation…" className="textarea" maxLength={2000} required />
            <p className="text-[11px] font-mono text-ink-500 mt-1 text-right">{form.description.length}/2000</p>
          </div>
          <div>
            <label className="mono-label mb-1.5 block">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-500" />
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Sector, street, area…" className="input pl-9" required />
            </div>
          </div>
          <div>
            <label className="mono-label mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button type="button" key={c.value}
                  onClick={() => setForm({ ...form, category: c.value })}
                  className={`px-3 py-1.5 text-sm border transition-colors ${
                    form.category === c.value
                      ? 'bg-ink text-surface border-ink'
                      : 'bg-transparent text-ink-400 border-border hover:border-ink-400'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mono-label mb-1.5 block">Image (optional)</label>
            <input type="file" ref={fileRef} onChange={handleFile} accept="image/*" className="hidden" />
            {preview ? (
              <div className="relative inline-block">
                <img src={preview} alt="preview" className="h-40 object-cover border border-border" />
                <button type="button" onClick={() => { setPreview(null); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="absolute top-2 right-2 bg-surface-100 border border-border p-1 hover:bg-surface-200 transition-colors">
                  <X className="w-3 h-3 text-ink-400" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="px-4 py-3 border border-dashed border-border text-sm text-ink-500 hover:border-ink-400 transition-colors w-full text-left">
                Attach image
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button type="button" onClick={() => navigate('/incidents')} className="btn-secondary text-sm">Cancel</button>
          <button type="submit" disabled={!valid || submitting} className="btn-primary text-sm">
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
