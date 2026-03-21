'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/adapters/http';
import { Button } from '@/components/ui/Button';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    lastName: string;
    image: string | null;
  };
}

interface PublicationProps {
  publication: {
    id: string;
    content: string;
    images: string[];
    createdAt: string;
    author: {
      id: string;
      name: string;
      lastName: string;
      image: string | null;
    };
    likesCount: number;
    commentsCount: number;
    isLikedByMe: boolean;
  };
  onDelete?: () => void;
  onUpdate?: () => void | Promise<void>;
}

export function PublicationCard({ publication: pub, onDelete, onUpdate }: PublicationProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(pub.isLikedByMe);
  const [likesCount, setLikesCount] = useState(pub.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const handleLike = async () => {
    try {
      const res = await api.post(`/publications/${pub.id}/like`);
      setIsLiked(res.data.data.liked);
      setLikesCount(prev => res.data.data.liked ? prev + 1 : prev - 1);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta publicación?')) return;
    try {
      await api.delete(`/publications/${pub.id}`);
      if (onDelete) onDelete();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    setLoadingComments(true);
    setShowComments(true);
    try {
      const res = await api.get(`/publications/${pub.id}/comments`);
      setComments(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/publications/${pub.id}/comments`, { content: newComment });
      setComments(prev => [...prev, res.data.data]);
      setNewComment('');
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const canDelete = user?.id === pub.author.id || ['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-bg-card border-2 border-black mb-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_var(--accent-primary)] transition-all group"
    >
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b-2 border-black/5 bg-gradient-to-r from-bg-secondary to-transparent">
        <Link href={`/players/${pub.author.id}`} className="flex items-center gap-4 group/author">
          <div className="h-14 w-14 border-2 border-black flex items-center justify-center overflow-hidden bg-black group-hover/author:-rotate-3 transition-transform">
            {pub.author.image ? (
              <img src={pub.author.image} alt={pub.author.name} className="h-full w-full object-cover grayscale hover:grayscale-0 transition-grayscale" />
            ) : (
              <span className="text-white font-black text-xl italic">{pub.author.name[0]}</span>
            )}
          </div>
          <div>
            <p className="text-lg font-black text-text-primary leading-none uppercase italic group-hover/author:text-accent-primary transition-colors">
              {pub.author.name} {pub.author.lastName}
            </p>
            <p className="text-[10px] text-text-secondary uppercase font-black tracking-[0.2em] mt-1 opacity-50">{formatDate(pub.createdAt)}</p>
          </div>
        </Link>
        {canDelete && (
          <button 
            onClick={handleDelete}
            className="text-text-secondary hover:text-red-600 transition-colors p-2 hover:bg-red-50"
            title="Eliminar publicación"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-8">
        <p className="text-lg text-text-primary whitespace-pre-wrap font-bold leading-relaxed">{pub.content}</p>
      </div>

      {/* Images */}
      {pub.images && pub.images.length > 0 && (
        <div className="px-8 pb-8">
          <div className={`grid gap-2 border-2 border-black ${pub.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {pub.images.map((img, idx) => (
              <img 
                key={idx} 
                src={img} 
                alt="Post attachment" 
                className="w-full aspect-video object-cover grayscale hover:grayscale-0 transition-all cursor-crosshair border-black/5 border"
              />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-8 py-5 border-t-2 border-black flex items-center gap-10 bg-black text-white">
        <button 
          onClick={handleLike}
          className={`flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all ${isLiked ? 'text-accent-secondary' : 'text-white/60 hover:text-white hover:scale-105'}`}
        >
          <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={3} />
          <span>{likesCount} LIKES</span>
        </button>
        <button 
          onClick={fetchComments}
          className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white/60 hover:text-accent-primary hover:scale-105 transition-all"
        >
          <MessageCircle size={22} strokeWidth={3} />
          <span>{pub.commentsCount} COMENTARIOS</span>
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-bg-secondary border-t-4 border-black"
          >
            <div className="p-8 space-y-8">
              {loadingComments ? (
                <div className="py-10 text-center text-[10px] font-black uppercase tracking-widest animate-pulse italic">Cargando comentarios...</div>
              ) : (
                <div className="space-y-6 max-h-80 overflow-y-auto scrollbar-hide pr-2">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex gap-4">
                      <Link href={`/players/${comment.author.id}`} className="h-10 w-10 border-2 border-black bg-black flex items-center justify-center shrink-0 overflow-hidden hover:rotate-6 transition-all">
                        {comment.author.image ? (
                          <img src={comment.author.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-white font-black italic">{comment.author.name[0]}</span>
                        )}
                      </Link>
                      <div className="flex-1 space-y-1">
                        <Link href={`/players/${comment.author.id}`}>
                          <p className="text-[10px] font-black text-accent-primary uppercase tracking-widest hover:underline italic">
                            {comment.author.name} {comment.author.lastName}
                          </p>
                        </Link>
                        <p className="text-sm text-text-primary font-bold">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-black/10">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">Sin comentarios aún.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="AGREGAR COMENTARIO..."
                  className="flex-1 bg-bg-card border-2 border-black px-6 py-4 text-[10px] font-black uppercase text-text-primary focus:outline-none focus:ring-4 focus:ring-accent-primary/10 tracking-widest"
                />
                <button type="submit" className="bg-black text-white px-8 font-black uppercase text-[10px] hover:bg-accent-primary transition-colors border-2 border-black active:translate-y-1">
                  POST
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
