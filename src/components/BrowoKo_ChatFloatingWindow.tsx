import { useState } from 'react';
import { MessageCircle, Users, BookOpen, MessageSquare, Send, Mic, Paperclip, X } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import imgImageAnnaAdmin from 'figma:asset/2fde41815db85ae521e9a5900aa07977fada684b.png';
import imgImageTinaTest from 'figma:asset/ec40b5f662787bd7e00839363cf176c723116de5.png';
import imgImageHarryHr from 'figma:asset/cfb9a7fd1443959528303c580f33650f821af63b.png';

interface ChatFloatingWindowProps {
  open: boolean;
  onClose: () => void;
}

type TabType = 'dm' | 'groups' | 'knowledge' | 'feedback';

export default function BrowoKoChatFloatingWindow({ open, onClose }: ChatFloatingWindowProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dm');
  const [message, setMessage] = useState('');

  // TODO: Replace with real data from API
  const mockUsers = [
    { id: '1', name: 'Anna Admin', avatar: imgImageAnnaAdmin, unread: 2 },
    { id: '2', name: 'Tina Test', avatar: imgImageTinaTest, unread: 1 },
    { id: '3', name: 'Harry HR', avatar: imgImageHarryHr, unread: 0 },
    { id: '4', name: 'Albert Admin', avatar: null, unread: 0 },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      // TODO: Send message via API
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop/Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Floating Chat Window */}
      <div className="fixed bottom-24 right-6 z-50 w-[350px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
        {/* Header with Close Button */}
        <div className="relative p-3 border-b border-gray-200">
          {/* Red X Button - Top Right */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded flex items-center justify-center transition-colors z-10"
            aria-label="Schließen"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Red Notification Dot - Top Left */}
          <div className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full" />

          {/* 4 Icon Tabs */}
          <div className="flex items-center justify-center gap-3 mt-4">
            {/* DM Tab */}
            <button
              onClick={() => setActiveTab('dm')}
              className={`flex flex-col items-center gap-1 ${
                activeTab === 'dm' ? 'text-purple-600' : 'text-gray-600'
              }`}
            >
              <div className={`w-12 h-12 rounded flex items-center justify-center ${
                activeTab === 'dm' ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px]">DM</span>
            </button>

            {/* Groups Tab */}
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex flex-col items-center gap-1 ${
                activeTab === 'groups' ? 'text-purple-600' : 'text-gray-600'
              }`}
            >
              <div className={`w-12 h-12 rounded flex items-center justify-center ${
                activeTab === 'groups' ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px]">Gruppen</span>
            </button>

            {/* Knowledge Tab */}
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`flex flex-col items-center gap-1 ${
                activeTab === 'knowledge' ? 'text-purple-600' : 'text-gray-600'
              }`}
            >
              <div className={`w-12 h-12 rounded flex items-center justify-center ${
                activeTab === 'knowledge' ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[10px]">Knowledge</span>
            </button>

            {/* Feedback Tab */}
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex flex-col items-center gap-1 ${
                activeTab === 'feedback' ? 'text-purple-600' : 'text-gray-600'
              }`}
            >
              <div className={`w-12 h-12 rounded flex items-center justify-center ${
                activeTab === 'feedback' ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-[10px]">Feedback</span>
            </button>
          </div>
        </div>

        {/* Content Area - DM Tab */}
        {activeTab === 'dm' && (
          <>
            {/* Conversations List */}
            <ScrollArea className="h-[320px] bg-gray-50">
              <div className="p-2 space-y-2">
                {mockUsers.map((user) => (
                  <button
                    key={user.id}
                    className="w-full flex items-center gap-3 p-2 bg-white hover:bg-gray-50 rounded border border-gray-200 transition-colors relative"
                  >
                    {/* Avatar */}
                    <Avatar className="w-10 h-10 shrink-0">
                      {user.avatar ? (
                        <AvatarImage src={user.avatar} alt={user.name} />
                      ) : (
                        <AvatarFallback className="bg-purple-100 text-purple-600 font-semibold text-sm">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    {/* Name */}
                    <span className="text-sm font-medium text-gray-900 flex-1 text-left">
                      {user.name}
                    </span>

                    {/* Unread Badge */}
                    {user.unread > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-medium text-white">
                          {user.unread}
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>

            {/* Input Field */}
            <div className="p-3 border-t border-gray-200 bg-white rounded-b-lg">
              <div className="flex items-center gap-2 bg-gray-50 rounded border border-gray-200 px-3 py-2">
                {/* Paperclip Icon */}
                <button className="text-gray-500 hover:text-gray-700 shrink-0">
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Input */}
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Nachricht..."
                  className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-gray-400"
                />

                {/* Mic Icon */}
                <button className="text-gray-500 hover:text-gray-700 shrink-0">
                  <Mic className="w-4 h-4" />
                </button>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  className="bg-[rgb(38,82,188)] hover:bg-purple-700 text-white rounded px-3 py-1.5 shrink-0 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Content Area - Groups Tab */}
        {activeTab === 'groups' && (
          <div className="h-[400px] flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium">Gruppenchats</p>
              <p className="text-xs mt-1">Noch keine Gruppen vorhanden</p>
            </div>
          </div>
        )}

        {/* Content Area - Knowledge Tab */}
        {activeTab === 'knowledge' && (
          <div className="h-[400px] flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium">Knowledge Wiki</p>
              <p className="text-xs mt-1">Wissensdatenbank</p>
            </div>
          </div>
        )}

        {/* Content Area - Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="h-[400px] flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium">Feedback System</p>
              <p className="text-xs mt-1">Feedback senden</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
