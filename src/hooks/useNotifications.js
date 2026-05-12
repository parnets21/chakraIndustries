import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationApi } from '../api/notificationApi';
import { useAuth } from '../auth/AuthContext';

const POLL_INTERVAL = 30_000; // 30 seconds

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);
  const prevCountRef                      = useRef(0);
  const [hasNew, setHasNew]               = useState(false);

  const fetch = useCallback(async (retries = 2) => {
    // Don't fetch if user is not logged in
    if (!user) {
      console.log('User not logged in, skipping notification fetch');
      return;
    }
    
    try {
      setLoading(true);
      const res = await notificationApi.getAll();
      setNotifications(res.data || []);
      const count = res.unreadCount || 0;
      // Flash "new" indicator if count increased since last poll
      if (count > prevCountRef.current) setHasNew(true);
      prevCountRef.current = count;
      setUnreadCount(count);
    } catch (err) {
      console.error('Notification fetch error:', err);
      // Retry once on connection failure (e.g. Render cold start)
      if (retries > 0) {
        setTimeout(() => fetch(retries - 1), 5000);
        return;
      }
      // silently fail after retries — don't break the UI
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => { 
    if (user) {
      fetch();
    }
  }, [fetch, user]);

  // Polling
  useEffect(() => {
    if (!user) return;
    const id = setInterval(fetch, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetch, user]);

  const clearNew = () => setHasNew(false);

  return { notifications, unreadCount, loading, hasNew, clearNew, refetch: fetch };
}
