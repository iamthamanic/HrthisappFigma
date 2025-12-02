import { memo } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { 
  Mail, 
  FileText, 
  Video, 
  Package, 
  Users, 
  ClipboardList, 
  Clock,
  GraduationCap,
  Laptop,
  Gift,
  Coins,
  Bell,
  UserPlus,
  BookOpen,
  ThumbsUp,
  X
} from '../../../components/icons/BrowoKoIcons';

const getIcon = (type: string) => {
  switch (type) {
    case 'SEND_EMAIL': return <Mail className="w-4 h-4" />;
    case 'ASSIGN_DOCUMENT': return <FileText className="w-4 h-4" />;
    case 'ASSIGN_TEST': return <GraduationCap className="w-4 h-4" />;
    case 'ASSIGN_VIDEO': return <Video className="w-4 h-4" />;
    case 'CREATE_TASK': return <ClipboardList className="w-4 h-4" />;
    case 'ASSIGN_EQUIPMENT': return <Laptop className="w-4 h-4" />;
    case 'ASSIGN_BENEFITS': return <Gift className="w-4 h-4" />;
    case 'DISTRIBUTE_COINS': return <Coins className="w-4 h-4" />;
    case 'DELAY': return <Clock className="w-4 h-4" />;
    case 'CREATE_NOTIFICATION': return <Bell className="w-4 h-4" />;
    case 'ADD_TO_TEAM': return <UserPlus className="w-4 h-4" />;
    case 'ASSIGN_TRAINING': return <BookOpen className="w-4 h-4" />;
    case 'APPROVE_REQUEST': return <ThumbsUp className="w-4 h-4" />;
    default: return <ClipboardList className="w-4 h-4" />;
  }
};

const getLabel = (type: string) => {
  switch (type) {
    case 'SEND_EMAIL': return 'Email senden';
    case 'ASSIGN_DOCUMENT': return 'Dokument zuweisen';
    case 'ASSIGN_TEST': return 'Test zuweisen';
    case 'ASSIGN_VIDEO': return 'Video zuweisen';
    case 'CREATE_TASK': return 'Aufgabe erstellen';
    case 'ASSIGN_EQUIPMENT': return 'Equipment zuweisen';
    case 'ASSIGN_BENEFITS': return 'Benefits zuweisen';
    case 'DISTRIBUTE_COINS': return 'Coins verteilen';
    case 'DELAY': return 'Warten (Delay)';
    case 'CREATE_NOTIFICATION': return 'Benachrichtigung senden';
    case 'ADD_TO_TEAM': return 'Zu Team hinzufügen';
    case 'ASSIGN_TRAINING': return 'Schulung zuweisen';
    case 'APPROVE_REQUEST': return 'Antrag genehmigen';
    default: return 'Neue Aktion';
  }
};

export default memo(({ data, id }: { data: any; id: string }) => {
  const { setNodes } = useReactFlow();
  const type = data.actionType || data.type || 'CREATE_TASK';
  const isConfigured = data.config && Object.keys(data.config).length > 0;
  
  // Determine border and status color
  const borderColor = isConfigured ? 'border-green-500' : 'border-orange-400';
  const statusColor = isConfigured ? 'bg-green-500' : 'bg-orange-400';
  
  const handleDelete = () => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
  };
  
  return (
    <div className={`shadow-md rounded-md bg-white border-2 ${borderColor} w-[250px] hover:shadow-lg transition-all relative group`}>
      {/* Status Indicator */}
      <div className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full ${statusColor} border-2 border-white z-10`}></div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-3 rounded-t-md flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="bg-white/20 p-1.5 rounded">
            {getIcon(type)}
          </div>
          <span className="font-medium text-white text-sm truncate">
            {getLabel(type)}
          </span>
        </div>
        <button
          onClick={handleDelete}
          className="p-1.5 rounded bg-red-100 hover:bg-red-200 transition-colors text-red-600 shrink-0"
          title="Node entfernen"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
    </div>
  );
});