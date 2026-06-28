import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { LocationPicker } from '../components/LocationPicker';
import type { LocationResult } from '../components/LocationPicker';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
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
  useDocumentTitle('Report Incident');
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    categories: [] as IncidentCategory[],
  });
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const r = new FileReader();
      r.onload = (ev) => setPreview(ev.target?.result as string);
      r.readAsDataURL(f);
    }
  };

  const toggleCategory = (value: IncidentCategory) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(value)
        ? prev.categories.filter((c) => c !== value)
        : [...prev.categories, value],
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.categories;
      return next;
    });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    else if (form.title.length < 3) e.title = 'Title must be at least 3 characters';
    else if (form.title.length > 200) e.title = 'Title must be under 200 characters';

    if (!form.description.trim()) e.description = 'Description is required';
    else if (form.description.length < 10) e.description = 'Please provide a meaningful description (at least 10 characters)';
    else if (form.description.length > 2000) e.description = 'Description must be under 2000 characters';

    if (form.categories.length === 0) e.categories = 'Select at least one category';

    if (!location) e.location = 'Location is required';
    else if (!location.address.trim()) e.location = 'Please select a valid location';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    setSubmitting(true);
    try {
      await apiService.createIncident({
        title: form.title.trim(),
        description: form.description.trim(),
        location: location!.address,
        categories: form.categories,
        latitude: location!.latitude,
        longitude: location!.longitude,
        city: location!.city || undefined,
        state: location!.state || undefined,
        country: location!.country || undefined,
        postal_code: location!.postal_code || undefined,
        place_id: location!.place_id || undefined,
        landmark: location!.landmark || undefined,
        image: file || undefined,
      });
      toast.success('Incident reported successfully');
      navigate('/incidents');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-8 py-10 space-y-8 animate-fade">
      <div className="border-b border-border pb-6">
        <h1 className="text-[1.625rem] font-light tracking-[-0.01em] text-ink">Report Incident</h1>
        <p className="text-sm text-ink-300 mt-1.5 font-[350]">Submit an emergency report for AI intelligence analysis and dispatch</p>
      </div>

      <form onSubmit={submit} className="space-y-8">
        {/* Title */}
        <div className="bg-surface-100 border border-border p-6 space-y-5">
          <div>
            <label className="input-label">Incident Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => { setForm({ ...form, title: e.target.value }); setErrors((p) => { const n = { ...p }; delete n.title; return n; }); }}
              placeholder="e.g. Wildfire near Bannerghatta, Substation explosion, Major road accident"
              className={`input ${errors.title ? 'border-critical' : ''}`}
              maxLength={200}
            />
            {errors.title && <p className="text-[11px] font-mono text-critical mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="input-label">Incident Description</label>
            <textarea
              value={form.description}
              onChange={(e) => { setForm({ ...form, description: e.target.value }); setErrors((p) => { const n = { ...p }; delete n.description; return n; }); }}
              placeholder="Describe the situation in detail — what happened, what you see, any immediate dangers, people affected…"
              className={`textarea ${errors.description ? 'border-critical' : ''}`}
              maxLength={2000}
              rows={5}
            />
            <div className="flex justify-between mt-1">
              {errors.description && <p className="text-[11px] font-mono text-critical">{errors.description}</p>}
              <p className="text-[11px] font-mono text-ink-500 ml-auto">{form.description.length}/2000</p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-surface-100 border border-border p-6 space-y-3">
          <label className="input-label">Incident Categories</label>
          <p className="text-[11px] text-ink-500">Select all that apply — an incident may involve multiple emergency domains</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const selected = form.categories.includes(c.value);
              return (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => toggleCategory(c.value)}
                  className={`px-3 py-1.5 text-sm border transition-colors ${
                    selected
                      ? 'bg-ink text-surface border-ink'
                      : 'bg-transparent text-ink-400 border-border hover:border-ink-400'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          {form.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {form.categories.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-ink/10 border border-ink/20 text-ink-300">
                  {c}
                  <button type="button" onClick={() => toggleCategory(c)} className="hover:text-ink">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {errors.categories && <p className="text-[11px] font-mono text-critical">{errors.categories}</p>}
        </div>

        {/* Location with Google Maps */}
        <div className="bg-surface-100 border border-border p-6 space-y-3">
          <label className="input-label">Location</label>
          <p className="text-[11px] text-ink-500">Search for the incident location or use your current GPS position</p>
          <LocationPicker
            value={location}
            onChange={(loc) => { setLocation(loc); setErrors((p) => { const n = { ...p }; delete n.location; return n; }); }}
          />
          {errors.location && <p className="text-[11px] font-mono text-critical">{errors.location}</p>}
        </div>

        {/* Image */}
        <div className="bg-surface-100 border border-border p-6 space-y-3">
          <label className="input-label">Image Evidence</label>
          <input type="file" ref={fileRef} onChange={handleFile} accept="image/*" className="hidden" />
          {preview ? (
            <div className="relative inline-block">
              <img src={preview} alt="preview" className="h-40 object-cover border border-border" />
              <button
                type="button"
                onClick={() => { setPreview(null); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                className="absolute top-2 right-2 bg-surface-100 border border-border p-1 hover:bg-surface-200 transition-colors"
              >
                <X className="w-3 h-3 text-ink-400" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-4 py-3 border border-dashed border-border text-sm text-ink-500 hover:border-ink-400 transition-colors w-full text-left"
            >
              Upload image — photos help the AI assess the situation
            </button>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => navigate('/incidents')} className="btn-secondary text-sm">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary text-sm">
            {submitting ? 'Submitting…' : 'Submit Intelligence Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
