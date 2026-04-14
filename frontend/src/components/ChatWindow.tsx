import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../types';
import { useStore } from '../store';

interface Props {
  messages: ChatMessage[];
  onSend: (content: string) => Promise<void>;
  failedIds?: Set<string>;
  onRetry?: (msg: ChatMessage) => void;
}

export function ChatWindow({ messages, onSend, failedIds = new Set() }: Props) {
  const { user } = useStore();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const content = photoUrl ? `${text} ${photoUrl}`.trim() : text.trim();
    if (!content) return;
    setSending(true);
    try {
      await onSend(content);
      setText('');
      setPhotoUrl('');
      setShowPhotoInput(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isSelf = msg.senderId === user?.id;
          const failed = failedIds.has(msg.id);
          return (
            <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                  isSelf ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                } ${failed ? 'opacity-60' : ''}`}
              >
                {!isSelf && <p className="text-xs font-semibold mb-0.5 text-gray-500">{msg.senderName}</p>}
                <p>{msg.content}</p>
                {failed && <p className="text-xs text-red-300 mt-0.5">Failed to send</p>}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {showPhotoInput && (
        <div className="px-4 pb-2">
          <input
            type="url"
            placeholder="Paste photo URL…"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      )}

      <div className="border-t border-gray-200 p-3 flex gap-2 items-end">
        <button
          aria-label="Attach photo URL"
          onClick={() => setShowPhotoInput((v) => !v)}
          className="text-gray-400 hover:text-blue-500 p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          📎
        </button>
        <textarea
          aria-label="Message"
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message…"
          className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          aria-label="Send message"
          onClick={handleSend}
          disabled={sending || (!text.trim() && !photoUrl.trim())}
          className="bg-blue-500 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-blue-600 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          Send
        </button>
      </div>
    </div>
  );
}
