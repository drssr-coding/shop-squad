import React, { useState, useEffect, useRef } from 'react';
import { Send, X } from 'lucide-react';
import { doc, updateDoc, arrayUnion, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Message, Party } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface ChatPanelProps {
  partyId: string;
  messages: Message[];
  isOpen: boolean;
  onClose: () => void;
}

export function ChatPanel({ partyId, messages: initialMessages, isOpen, onClose }: ChatPanelProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Set up real-time listener for messages
    const partyRef = doc(db, 'parties', partyId);
    const unsubscribe = onSnapshot(partyRef, (doc) => {
      if (doc.exists()) {
        const partyData = doc.data() as Party;
        setMessages(partyData.messages || []);
      }
    });

    return () => unsubscribe();
  }, [partyId, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const message: Message = {
        id: crypto.randomUUID(),
        text: newMessage.trim(),
        senderId: user.uid,
        senderName: user.displayName || 'Anonymous',
        senderAvatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Anonymous')}`,
        timestamp: Timestamp.now()
      };

      const partyRef = doc(db, 'parties', partyId);
      await updateDoc(partyRef, {
        messages: arrayUnion(message)
      });

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-lg flex flex-col z-40">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Squad Chat</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start max-w-[75%] ${message.senderId === user?.uid ? 'flex-row-reverse' : ''}`}>
              <img
                src={message.senderAvatar}
                alt={message.senderName}
                className="h-8 w-8 rounded-full flex-shrink-0"
              />
              <div className={`mx-2 ${message.senderId === user?.uid ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-2xl px-4 py-2 ${
                  message.senderId === user?.uid
                    ? 'bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm">{message.text}</p>
                </div>
                <div className={`mt-1 text-xs text-gray-500 flex gap-2 ${
                  message.senderId === user?.uid ? 'justify-end' : ''
                }`}>
                  <span>{message.senderName}</span>
                  <span>·</span>
                  <span>{formatDistanceToNow(message.timestamp.toDate(), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-gray-200 focus:border-[#FF4D8D] focus:ring focus:ring-[#FF4D8D] focus:ring-opacity-50"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-white p-2 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}