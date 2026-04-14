import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '../store';
import { useQueryClient } from '@tanstack/react-query';
import type { ChatMessage, JobStatus } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';

export function useWebSocket(activeView?: string, chatJobId?: string) {
  const jobsSocketRef = useRef<Socket | null>(null);
  const chatSocketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const { accessToken, updateStatus, updateHandymanLocation, appendMessage, addToast } = useStore();

  useEffect(() => {
    if (!accessToken) return;

    const jobsSocket = io(`${WS_URL}/jobs`, { auth: { token: accessToken } });
    const chatSocket = io(`${WS_URL}/chat`, { auth: { token: accessToken } });

    // Join the specific chat room once connected (for jobs created after initial connect)
    if (chatJobId) {
      chatSocket.on('connect', () => chatSocket.emit('chat:join', { jobId: chatJobId }));
    }

    jobsSocketRef.current = jobsSocket;
    chatSocketRef.current = chatSocket;

    // 5.2 job:matched
    jobsSocket.on('job:matched', () => {
      updateStatus('MATCHED');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    });

    // 5.3 job:available — invalidate handyman job board
    jobsSocket.on('job:available', () => {
      queryClient.invalidateQueries({ queryKey: ['handymanJobs'] });
    });

    // 5.4 job:status_update
    jobsSocket.on('job:status_update', (data: { status: JobStatus }) => {
      updateStatus(data.status);
    });

    // 5.5 handyman:location
    jobsSocket.on('handyman:location', (data: { lat: number; lng: number }) => {
      updateHandymanLocation(data.lat, data.lng);
    });

    // 5.7 job:completed
    jobsSocket.on('job:completed', (data: { jobId: string }) => {
      addToast('Job complete! Proceeding to payment.', 'success');
      // Navigation is handled at page level via store status
      updateStatus('COMPLETED');
      queryClient.invalidateQueries({ queryKey: ['job', data.jobId] });
    });

    // 5.8 disconnect/reconnect
    jobsSocket.on('disconnect', () => addToast('Reconnecting…', 'info'));
    jobsSocket.on('connect', () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    });

    // 5.6 chat:message
    chatSocket.on('chat:message', (msg: ChatMessage) => {
      appendMessage(msg);
      if (activeView !== 'chat') {
        addToast(`${msg.senderName}: ${msg.content.slice(0, 50)}`, 'info');
      }
    });

    return () => {
      jobsSocket.disconnect();
      chatSocket.disconnect();
    };
  }, [accessToken, chatJobId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { jobsSocket: jobsSocketRef.current, chatSocket: chatSocketRef.current };
}
