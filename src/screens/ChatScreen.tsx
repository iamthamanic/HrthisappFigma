import { useState } from 'react';
import { MessageCircle, Users, BookOpen, MessageSquare, Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';

export default function ChatScreen() {
  const [activeTab, setActiveTab] = useState('dm');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // TODO: Replace with real data from API
  const mockUsers = [
    { id: '1', name: 'Anna Schmidt', avatar: null, online: true, unread: 3 },
    { id: '2', name: 'Max Müller', avatar: null, online: false, unread: 0 },
    { id: '3', name: 'Julia Weber', avatar: null, online: true, unread: 1 },
    { id: '4', name: 'Tom Fischer', avatar: null, online: false, unread: 0 },
  ];

  const mockGroups = [
    { id: 'g1', name: 'Team Marketing', members: 8, unread: 5 },
    { id: 'g2', name: 'Projekt Alpha', members: 4, unread: 0 },
    { id: 'g3', name: 'HR Team', members: 6, unread: 2 },
  ];

  const mockKnowledge = [
    { id: 'k1', title: 'Onboarding Guide', category: 'HR', views: 45, updatedAt: '2025-10-20' },
    { id: 'k2', title: 'API Documentation', category: 'Tech', views: 89, updatedAt: '2025-10-25' },
    { id: 'k3', title: 'Urlaubsantrag Prozess', category: 'HR', views: 123, updatedAt: '2025-10-15' },
  ];

  const mockFeedback = [
    { id: 'f1', title: 'Feature Request: Dark Mode', status: 'PENDING', priority: 'MEDIUM', createdAt: '2025-10-26' },
    { id: 'f2', title: 'Bug: Kalender lädt nicht', status: 'IN_PROGRESS', priority: 'HIGH', createdAt: '2025-10-27' },
  ];

  const mockMessages = [
    { id: 'm1', userId: '1', userName: 'Anna Schmidt', content: 'Hey, hast du die Unterlagen schon bekommen?', timestamp: '14:30', isOwn: false },
    { id: 'm2', userId: 'me', userName: 'Du', content: 'Ja, schaue ich mir gleich an!', timestamp: '14:32', isOwn: true },
    { id: 'm3', userId: '1', userName: 'Anna Schmidt', content: 'Super, danke! 👍', timestamp: '14:33', isOwn: false },
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      // TODO: Send message via API
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold">Chat</h1>
        <p className="text-gray-500 text-sm">Kommunikation & Wissensaustausch</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with Tabs */}
        <div className="w-80 border-r flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            {/* Tab List */}
            <TabsList className="grid w-full grid-cols-4 rounded-none border-b h-auto p-0">
              <TabsTrigger 
                value="dm" 
                className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs">DM</span>
              </TabsTrigger>
              <TabsTrigger 
                value="groups"
                className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none"
              >
                <Users className="w-5 h-5" />
                <span className="text-xs">Gruppen</span>
              </TabsTrigger>
              <TabsTrigger 
                value="knowledge"
                className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none"
              >
                <BookOpen className="w-5 h-5" />
                <span className="text-xs">Knowledge</span>
              </TabsTrigger>
              <TabsTrigger 
                value="feedback"
                className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-xs">Feedback</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <TabsContent value="dm" className="flex-1 mt-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-2">
                  {mockUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedConversation(user.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                        selectedConversation === user.id ? 'bg-purple-50' : ''
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback className="bg-purple-100 text-purple-600">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        {user.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500 truncate">
                          {user.online ? 'Online' : 'Offline'}
                        </div>
                      </div>
                      {user.unread > 0 && (
                        <Badge className="bg-red-500 text-white">{user.unread}</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="groups" className="flex-1 mt-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-2">
                  {mockGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => setSelectedConversation(group.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                        selectedConversation === group.id ? 'bg-purple-50' : ''
                      }`}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-purple-100 text-purple-600">
                          <Users className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{group.name}</div>
                        <div className="text-sm text-gray-500">{group.members} Mitglieder</div>
                      </div>
                      {group.unread > 0 && (
                        <Badge className="bg-red-500 text-white">{group.unread}</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="knowledge" className="flex-1 mt-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-2">
                  {mockKnowledge.map((page) => (
                    <Card key={page.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{page.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Badge variant="outline">{page.category}</Badge>
                            <span>•</span>
                            <span>{page.views} Views</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        Aktualisiert: {page.updatedAt}
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="feedback" className="flex-1 mt-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-2">
                  {mockFeedback.map((item) => (
                    <Card key={item.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium flex-1">{item.title}</h3>
                        <Badge 
                          className={
                            item.priority === 'HIGH' ? 'bg-red-100 text-red-600' :
                            item.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-gray-100 text-gray-600'
                          }
                        >
                          {item.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline"
                          className={
                            item.status === 'IN_PROGRESS' ? 'border-blue-500 text-blue-600' :
                            item.status === 'RESOLVED' ? 'border-green-500 text-green-600' :
                            'border-gray-400 text-gray-600'
                          }
                        >
                          {item.status}
                        </Badge>
                        <span className="text-xs text-gray-400">{item.createdAt}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="border-b p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-purple-100 text-purple-600">
                      {getInitials(mockUsers[0]?.name || 'User')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold">{mockUsers[0]?.name || 'User'}</h2>
                    <p className="text-sm text-gray-500">Online</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MessageCircle className="w-5 h-5" />
                </Button>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {mockMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${msg.isOwn ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`p-3 rounded-lg ${
                            msg.isOwn
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p>{msg.content}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 px-1">
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Nachricht schreiben..."
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon">
                    <Smile className="w-5 h-5" />
                  </Button>
                  <Button onClick={handleSendMessage} className="bg-purple-600 hover:bg-purple-700">
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Wähle eine Konversation aus</p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
