'use client';

import { api } from '@/adapters/http';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAlert } from '@/context/AlertContext';
import { useAuth } from '@/context/AuthContext';
import { Camera, ChevronLeft, Facebook, Info, Instagram, Layers, MapPin, Phone, Save, Shield } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function TeamEditPage() {
  const params = useParams();
  const teamId = params['id'] as string;
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { success, error } = useAlert();
  
  const [formData, setFormData] = useState({
    name: '',
    nameShort: '',
    description: '',
    logo: '',
    city: '',
    state: '',
    country: 'Argentina',
    stadium: '',
    phone: '',
    email: '',
    category: '',
    division: '',
    colorPrimary: '#10b981',
    colorSecondary: '#06b6d4',
    colorTertiary: '#3b82f6',
    instagram: '',
    facebook: '',
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [teamRes, catRes, divRes] = await Promise.all([
          api.get(`/teams/${teamId}`),
          api.get('/categories'),
          api.get('/divisions'),
        ]);
        
        const t = teamRes.data.data;
        setCategories(catRes.data.data);
        setDivisions(divRes.data.data);
        
        if (!authLoading && user) {
          const canEdit = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.id === t.presidentId;
          if (!canEdit) {
            router.push(`/teams/${teamId}`);
            return;
          }
        }

        setFormData({
          name: t.name || '',
          nameShort: t.nameShort || '',
          description: t.description || '',
          logo: t.logo || '',
          city: t.city || '',
          state: t.state || '',
          country: t.country || 'Argentina',
          stadium: t.stadium || '',
          phone: t.phone || '',
          email: t.email || '',
          category: t.category || '',
          division: t.division || '',
          colorPrimary: t.colorPrimary || '#10b981',
          colorSecondary: t.colorSecondary || '#06b6d4',
          colorTertiary: t.colorTertiary || '#3b82f6',
          instagram: t.instagram || '',
          facebook: t.facebook || '',
        });
      } catch (err) {
        
      } finally {
        setLoading(false);
      }
    }
    if (teamId) fetchData();
  }, [teamId, user, authLoading, router]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData(prev => ({ ...prev, logo: res.data.data.url }));
      success('Logo subido correctamente');
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/teams/${teamId}`, formData);
      success('Equipo actualizado correctamente');
      router.push(`/teams/${teamId}`);
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al actualizar equipo');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading || authLoading) return <div className="p-8 text-center text-text-secondary">Cargando...</div>;

  return (
    <div className="min-h-screen bg-bg-primary mesh-bg pb-20">
      <div className="bg-black text-white border-b-8 border-accent-primary p-6 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={() => router.back()} className="h-12 w-12 flex items-center justify-center bg-white/10 border-2 border-white/20 hover:bg-white hover:text-black transition-all">
          <ChevronLeft size={20} strokeWidth={3} />
        </button>
        <h1 className="text-lg font-black uppercase italic tracking-tighter">Editar Equipo</h1>
      </div>

      <form onSubmit={handleSubmit} className="main-container p-6 space-y-8 max-w-2xl mx-auto">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-accent-primary mb-2">
            <Info size={16} />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Información General</h2>
          </div>

          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="relative group">
              <div className="h-24 w-24 bg-black border-4 border-bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] uppercase font-bold text-text-secondary opacity-50">Logo</span>
                )}
              </div>
              <button 
                type="button"
                onClick={() => document.getElementById('team-edit-logo-upload')?.click()} 
                disabled={uploadingImage}
                className={`absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center border-2 border-black bg-accent-primary text-black shadow-md hover:scale-110 active:scale-95 transition-all ${uploadingImage ? 'opacity-50' : ''}`}
              >
                <Camera size={14} strokeWidth={3} className={uploadingImage ? 'animate-pulse' : ''} />
              </button>
              <input 
                id="team-edit-logo-upload"
                type="file" 
                onChange={handleImageChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nombre del Equipo" name="name" value={formData.name} onChange={handleChange} required />
            <Input label="Nombre Corto / Siglas" name="nameShort" value={formData.nameShort} onChange={handleChange} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-text-secondary tracking-widest ml-1">Descripción</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full bg-bg-secondary border-2 border-black px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-all resize-none"
              placeholder="Habla un poco sobre el equipo..."
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-accent-primary mb-2">
            <MapPin size={16} />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Ubicación</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Ciudad" name="city" value={formData.city} onChange={handleChange} required />
            <Input label="Provincia/Estado" name="state" value={formData.state} onChange={handleChange} />
            <Input label="País" name="country" value={formData.country} onChange={handleChange} />
          </div>
          <Input label="Estadio Local" name="stadium" value={formData.stadium} onChange={handleChange} />
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-accent-primary mb-2">
            <Layers size={16} />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Categoría y División</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-text-secondary tracking-widest ml-1">Categoría</label>
              <select 
                name="category"
                value={formData.category}
                onChange={handleChange as any}
                className="w-full bg-bg-secondary border-2 border-black px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-all appearance-none"
              >
                <option value="">Seleccionar Categoría...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-text-secondary tracking-widest ml-1">División</label>
              <select 
                name="division"
                value={formData.division}
                onChange={handleChange as any}
                className="w-full bg-bg-secondary border-2 border-black px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-all appearance-none"
              >
                <option value="">Seleccionar División...</option>
                {divisions.map(div => (
                  <option key={div.id} value={div.name}>{div.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-accent-primary mb-2">
            <Shield size={16} />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Identidad Visual</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Color Principal" name="colorPrimary" type="color" value={formData.colorPrimary} onChange={handleChange} className="h-12 p-1 pt-8" />
            <Input label="Color Secundario" name="colorSecondary" type="color" value={formData.colorSecondary} onChange={handleChange} className="h-12 p-1 pt-8" />
            <Input label="Color Terciario" name="colorTertiary" type="color" value={formData.colorTertiary} onChange={handleChange} className="h-12 p-1 pt-8" />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-accent-primary mb-2">
            <Phone size={16} />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Contacto y Redes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Teléfono" name="phone" value={formData.phone} onChange={handleChange} />
            <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
            <div className="flex items-center gap-3 bg-bg-secondary border-2 border-black px-4">
               <Instagram size={16} className="text-text-secondary" />
               <input name="instagram" value={formData.instagram} onChange={handleChange} placeholder="Instagram" className="bg-transparent border-none py-3 text-sm text-text-primary flex-1 focus:outline-none" />
            </div>
            <div className="flex items-center gap-3 bg-bg-secondary border-2 border-black px-4">
               <Facebook size={16} className="text-text-secondary" />
               <input name="facebook" value={formData.facebook} onChange={handleChange} placeholder="Facebook" className="bg-transparent border-none py-3 text-sm text-text-primary flex-1 focus:outline-none" />
            </div>
          </div>
        </section>

        <Button type="submit" disabled={saving} className="w-full py-4 flex items-center justify-center gap-2">
          {saving ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
        </Button>
      </form>
    </div>
  );
}
