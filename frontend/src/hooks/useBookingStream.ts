import { useState, useEffect, useCallback, useRef } from 'react';

export interface BookingEvent {
  type: 'booking-created' | 'booking-cancelled' | 'booking-rescheduled' | 'connected';
  data: {
    bookingId?: string;
    roomId?: string;
    roomName?: string;
    startTime?: string;
    endTime?: string;
    userId?: string;
    userName?: string;
    message?: string;
  };
  timestamp: Date;
}

interface UseBookingStreamReturn {
  events: BookingEvent[];
  isConnected: boolean;
  lastEvent: BookingEvent | null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useBookingStream = (): UseBookingStreamReturn => {
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<BookingEvent | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  const connect = useCallback(() => {
    // cleanup existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`${API_URL}/bookings/stream`);
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log('SSE connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;
    };

    es.onerror = () => {
      console.log('SSE error, attempting reconnect...');
      setIsConnected(false);
      es.close();

      // exponential backoff reconnect
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`Reconnecting... attempt ${reconnectAttempts.current}`);
          connect();
        }, delay);
      }
    };

    // handle connected event
    es.addEventListener('connected', (e) => {
      const event: BookingEvent = {
        type: 'connected',
        data: JSON.parse(e.data),
        timestamp: new Date(),
      };
      setLastEvent(event);
    });

    // handle booking events
    const handleBookingEvent = (type: BookingEvent['type']) => (e: MessageEvent) => {
      const event: BookingEvent = {
        type,
        data: JSON.parse(e.data),
        timestamp: new Date(),
      };
      setEvents((prev) => [...prev.slice(-50), event]); // keep last 50 events
      setLastEvent(event);
    };

    es.addEventListener('booking-created', handleBookingEvent('booking-created'));
    es.addEventListener('booking-cancelled', handleBookingEvent('booking-cancelled'));
    es.addEventListener('booking-rescheduled', handleBookingEvent('booking-rescheduled'));

  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { events, isConnected, lastEvent };
};
