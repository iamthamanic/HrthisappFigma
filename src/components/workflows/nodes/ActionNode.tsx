import { memo } from 'react';
import { Handle, Position } from 'reactflow';
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
  ThumbsUp
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

export default memo(({ data }: { data: any }) => {
  const type = data.actionType || data.type || 'CREATE_TASK';
  const isConfigured = data.config && Object.keys(data.config).length > 0;
  
  // Determine border and status color
  const borderColor = isConfigured ? 'border-green-500' : 'border-orange-400';
  const statusColor = isConfigured ? 'bg-green-500' : 'bg-orange-400';
  
  return (
    <div className={`shadow-md rounded-md bg-white border-2 ${borderColor} w-[250px] hover:shadow-lg transition-all relative`}>
      {/* Status Indicator */}
      <div className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full ${statusColor} border-2 border-white z-10`}></div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      
      <div className="p-3 flex items-start gap-3">
        <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
          {getIcon(type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {data.label || getLabel(type)}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {isConfigured ? (data.config.description || 'Konfiguriert ✓') : 'Bitte konfigurieren...'}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
    </div>
  );
});