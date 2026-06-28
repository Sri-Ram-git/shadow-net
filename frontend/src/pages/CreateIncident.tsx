import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Send,
  Image as ImageIcon,
  MapPin,
  X,
  Loader2,
} from 'lucide-react';
import type { IncidentCategory } from '../types';

const categories: { value: IncidentCategory; label: string; icon: string }[] = [
  { value: 'fire', label: 'Fire', icon: '🔥' },
  { value: 'medical', label: 'Medical', icon: '🏥' },
  { value: 'flood', label: 'Flood', icon: '🌊' },
  { value: 'earthquake', label: 'Earthquake', icon: '🏚️' },
  { value: 'infrastructure', label: 'Infrastructure', icon: '🏗️' },
  { value: 'hazard', label: 'Hazard', icon: '☣️' },
  { value: 'other', label: 'Other', icon: '📋' },
];

export function CreateIncident() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    category: '' as IncidentCategory | '',
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.location || !form.category) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const incident = await apiService.createIncident({
        title: form.title,
        description: form.description,
        location: form.location,
        category: form.category as IncidentCategory,
        image: imageFile || undefined,
      });
      toast.success('Incident reported successfully');
      navigate('/incidents');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create incident');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = form.title && form.description && form.location && form.category;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Report Emergency</h1>
        <p className="text-sm text-gray-500 mt-1">Submit a new incident for AI triage and dispatch</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Transformer Explosion at Main Street"
              className="input-field"
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Description <span className="text-danger">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the emergency situation in detail..."
              className="input-field min-h-[120px] resize-y"
              maxLength={2000}
              required
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{form.description.length}/2000</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Location <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g., Sector 12, Main Street"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Category <span className="text-danger">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat.value })}
                    className={`p-2 rounded-lg text-center transition-all ${
                      form.category === cat.value
                        ? 'bg-accent/10 border border-accent/30 text-accent'
                        : 'bg-dark-700 border border-dark-500 text-gray-400 hover:border-dark-400'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <p className="text-xs mt-0.5">{cat.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Image (optional)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Incident preview"
                  className="h-48 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 rounded-full bg-dark-900/80 hover:bg-dark-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-dark-500 hover:border-dark-400 transition-colors text-sm text-gray-400 hover:text-gray-300"
              >
                <ImageIcon className="w-5 h-5" />
                Upload image
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/incidents')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isFormValid || submitting}
            className="btn-primary flex items-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {submitting ? 'Submitting...' : 'Submit Incident'}
          </button>
        </div>
      </form>
    </div>
  );
}
