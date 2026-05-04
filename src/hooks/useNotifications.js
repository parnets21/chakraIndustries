import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationApi } from '../api/notificationApi';

const POLL_INTERVAL = 30_000; // 30 seconds

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);
  const prevCountRef                      = useRef(0);
  const [hasNew, setHasNew]               = useState(false);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getAll();
      setNotifications(res.data || []);
      const count = res.unreadCount || 0;
      // Flash "new" indicator if count increased since last poll
      if (count > prevCountRef.current) setHasNew(true);
      prevCountRef.current = count;
      setUnreadCount(count);
    } catch (_) {
      // silently fail — don't break the UI
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => { fetch(); }, [fetch]);

  // Polling
  useEffect(() => {
    const id = setInterval(fetch, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetch]);

  const clearNew = () => setHasNew(false);

  return { notifications, unreadCount, loading, hasNew, clearNew, refetch: fetch };
}
