import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { chatService } from '../../services/chat';
import { useStore } from '../../store';
import { useWebSocket } from '../../hooks/useWebSocket';
import { ChatWindow } from '../../components/ChatWindow';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function ClientChatPage() {
  const { id: jobId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, messages, setMessages, appendMessage, addToast } = useStore();
  useWebSocket('chat', jobId);

  const { isLoading, data } = useQuery({
    queryKey: ['chatMessages', jobId],
    queryFn: () => chatService.getMessages(jobId!),
    enabled: !!jobId,
  });

  useEffect(() => {
    if (data?.messages) setMessages(data.messages);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend(content: string) {
    if (!jobId || !user) return;
    const optimistic = {
      id: `optimistic-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role as 'CLIENT' | 'HANDYMAN' | 'AI',
      content,
      isAI: false,
      createdAt: new Date().toISOString(),
    };
    appendMessage(optimistic);
    try {
      await chatService.sendMessage(jobId, content);
    } catch {
      addToast('Failed to send message', 'error');
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="text-gray-400 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="font-semibold text-gray-900 text-sm">Job Chat</h1>
          <p className="text-xs text-gray-400">Job #{jobId?.slice(0, 8)}</p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="flex-1 overflow-hidden">
          <ChatWindow messages={messages} onSend={handleSend} />
        </div>
      )}
    </div>
  );
}
