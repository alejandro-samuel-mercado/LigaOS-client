'use client';

import { api } from '@/adapters/http';
import { Button } from '@/components/ui/Button';
import { useAlert } from '@/context/AlertContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Entity {
  id: string;
  name: string;
  [key: string]: any;
}

interface EntityManagerProps {
  endpoint: string;
  title: string;
  placeholder?: string;
  onClose?: () => void;
}

export function EntityManager({ endpoint, title, placeholder = "Nuevo elemento...", onClose }: EntityManagerProps) {
  const [items, setItems] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [issubmitting, setIsSubmitting] = useState(false);
  const { success, error: showError } = useAlert();

  const fetchItems = async () => {
    try {
      const { data } = await api.get(endpoint);
      setItems(data.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [endpoint]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    setIsSubmitting(true);
    try {
      await api.post(endpoint, { name: inputValue.trim() });
      setInputValue('');
      fetchItems();
      success('Elemento agregado');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Error al agregar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return;
    
    try {
      await api.delete(`${endpoint}/${id}`);
      fetchItems();
      success('Elemento eliminado');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <div className="space-y-6 max-h-[70vh] flex flex-col">
      {/* Form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-bg-secondary border-2 border-black px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
          disabled={issubmitting}
        />
        <Button size="sm" type="submit" disabled={issubmitting || !inputValue.trim()}>
          {issubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          <span className="ml-1 hidden sm:inline">Agregar</span>
        </Button>
      </form>

      {/* List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-2 no-scrollbar">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-text-secondary" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center py-10 text-xs text-text-secondary italic font-black uppercase tracking-widest">No hay elementos registrados.</p>
        ) : (
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-between p-3 bg-bg-secondary border-2 border-border-subtle hover:border-black transition-colors group"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-black text-text-primary uppercase italic">{item.name}</span>
                  {item.description && <span className="text-[10px] text-text-secondary truncate max-w-[200px]">{item.description}</span>}
                </div>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-text-secondary hover:text-red-600 hover:bg-red-600/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
