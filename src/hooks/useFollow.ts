import { useState, useEffect } from 'react';
import { api } from '@/adapters/http';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/context/AlertContext';

export function useFollow(userId: string) {
  const { isAuthenticated, user } = useAuth();
  const { error, success } = useAlert();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !userId || user?.id === userId) {
      setIsLoading(false);
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await api.get(`/users/${userId}/followers`);
        const followers = res.data.data;
        setIsFollowing(followers.some((f: any) => f.id === user?.id));
      } catch (error) {
        console.error('Error checking follow status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [userId, isAuthenticated, user?.id]);

  const toggle = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await api.post(`/users/${userId}/follow`);
      setIsFollowing(res.data.isFollowing);
      success(res.data.message);
    } catch (err) {
      error('No se pudo actualizar el estado de seguimiento');
    } finally {
      setIsLoading(false);
    }
  };

  return { isFollowing, toggle, isLoading };
}
