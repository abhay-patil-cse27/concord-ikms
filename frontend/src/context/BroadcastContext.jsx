import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';
import { BrutalToast } from '../components/brutal';

const BroadcastContext = createContext(null);

const CHANNEL_NAME = 'concord_system_broadcast';

/**
 * BroadcastProvider
 * Option C: Real-time Institutional Broadcast Engine.
 * Combines cross-tab synchronization via BroadcastChannel with
 * server-driven Server-Sent Events (SSE) push notifications.
 */
export function BroadcastProvider({ children }) {
  const { user } = useAuth();
  const [activeToast, setActiveToast] = useState(null);
  const [latestEngineEvent, setLatestEngineEvent] = useState(null);
  const channelRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Present a Stark Yellow Brutalist broadcast toast
  const showBroadcastToast = useCallback((toastData) => {
    setActiveToast({
      id: Date.now(),
      type: toastData.type || 'warning',
      title: toastData.title || 'Institutional Broadcast',
      message: toastData.message || '',
      duration: toastData.duration || 6000,
    });
  }, []);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  // Dispatch custom browser event for reactive components (e.g., RAGAssistantView header badge)
  const notifyComponentSubscribers = useCallback((eventType, data) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(`concord:${eventType}`, { detail: data })
      );
    }
  }, []);

  // Synchronize dynamic bulletin into user's notification drawer
  const appendToDrawerStorage = useCallback((notice) => {
    if (!user?.id) return;
    try {
      const storageKey = `ikms_notifs_${user.id}`;
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      const newEntry = {
        id: `broadcast-${Date.now()}`,
        title: notice.title,
        message: notice.message,
        type: notice.severity || notice.type || 'info',
        timestamp: 'Just now',
        read: false,
        icon: notice.icon || 'Cpu',
      };
      const updated = [newEntry, ...parsed.slice(0, 19)];
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // Storage quota or parsing error fallback
    }
  }, [user?.id]);

  // Handle inbound broadcast event (from SSE or BroadcastChannel)
  const handleInboundEvent = useCallback((eventType, data, source = 'sse') => {
    if (eventType === 'llm_engine_switched') {
      setLatestEngineEvent(data);
      notifyComponentSubscribers('llm_status_changed', data);

      const isLocal = data.provider_mode === 'local';
      showBroadcastToast({
        type: isLocal ? 'warning' : 'success',
        title: '⚡ Institutional AI Engine Hot-Swapped',
        message: `Inference routing dynamically directed to ${data.display_name} (${data.active_model}) with zero downtime.`,
        duration: 7000,
      });

      appendToDrawerStorage({
        title: `AI Engine: ${data.display_name}`,
        message: data.message || `Switched to ${data.display_name}`,
        severity: isLocal ? 'warning' : 'info',
        icon: 'Cpu',
      });
    } else if (eventType === 'system_alert' || eventType === 'system_maintenance') {
      showBroadcastToast({
        type: data.severity || 'warning',
        title: data.title || 'Campus Administrative Alert',
        message: data.message,
        duration: 8000,
      });

      appendToDrawerStorage({
        title: data.title,
        message: data.message,
        severity: data.severity,
        icon: 'AlertTriangle',
      });
    }

    // If received from SSE, mirror across local browser tabs via BroadcastChannel
    if (source === 'sse' && channelRef.current) {
      try {
        channelRef.current.postMessage({ eventType, data });
      } catch {
        // Fallback
      }
    }
  }, [showBroadcastToast, notifyComponentSubscribers, appendToDrawerStorage]);

  // 1. Establish Native Browser BroadcastChannel for instant cross-tab sync
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        const { eventType, data } = event.data || {};
        if (eventType && data) {
          handleInboundEvent(eventType, data, 'channel');
        }
      };

      return () => {
        channel.close();
        channelRef.current = null;
      };
    }
  }, [handleInboundEvent]);

  // 2. Establish Server-Sent Events (SSE) stream when user is authenticated
  useEffect(() => {
    if (!user) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const streamUrl = api.getEventsStreamUrl();
    let es;
    try {
      es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.addEventListener('connected', () => {
        // Connected to CONCORD real-time broadcast hub
      });

      es.addEventListener('llm_engine_switched', (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          handleInboundEvent('llm_engine_switched', payload, 'sse');
        } catch (err) {
          console.error('Failed to parse SSE payload:', err);
        }
      });

      es.addEventListener('system_alert', (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          handleInboundEvent('system_alert', payload, 'sse');
        } catch (err) {
          console.error('Failed to parse system_alert payload:', err);
        }
      });

      es.addEventListener('system_maintenance', (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          handleInboundEvent('system_maintenance', payload, 'sse');
        } catch (err) {
          console.error('Failed to parse system_maintenance payload:', err);
        }
      });

      es.onerror = () => {
        // EventSource will automatically attempt reconnection
      };
    } catch {
      // Fallback
    }

    return () => {
      if (es) {
        es.close();
      }
      eventSourceRef.current = null;
    };
  }, [user, handleInboundEvent]);

  // Broadcast function exposed to administration components
  const publishBroadcastEvent = useCallback(async (eventType, payload) => {
    // 1. Send via backend API for global distribution
    try {
      await api.publishBroadcast({
        event_type: eventType,
        title: payload.title,
        message: payload.message,
        severity: payload.severity || 'info',
      });
    } catch (err) {
      console.warn('API broadcast publish failed, broadcasting locally:', err);
    }

    // 2. Mirror immediately across current browser tabs
    if (channelRef.current) {
      channelRef.current.postMessage({ eventType, data: payload });
    }
    handleInboundEvent(eventType, payload, 'local');
  }, [handleInboundEvent]);

  return (
    <BroadcastContext.Provider
      value={{
        latestEngineEvent,
        showBroadcastToast,
        publishBroadcastEvent,
        dismissToast,
      }}
    >
      {children}

      {/* Floating System Broadcast Toast Banner (Option C) */}
      {activeToast && (
        <BrutalToast
          isOpen={Boolean(activeToast)}
          onClose={dismissToast}
          type={activeToast.type}
          title={activeToast.title}
          message={activeToast.message}
          duration={activeToast.duration}
          className="fixed bottom-6 right-6 z-[60] border-3 shadow-brutal-lg max-w-md"
        />
      )}
    </BroadcastContext.Provider>
  );
}

export function useBroadcast() {
  const context = useContext(BroadcastContext);
  if (!context) {
    return {
      latestEngineEvent: null,
      showBroadcastToast: () => {},
      publishBroadcastEvent: () => {},
      dismissToast: () => {},
    };
  }
  return context;
}

