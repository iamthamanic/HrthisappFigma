import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { 
  MoreHorizontal as MoreVertical, 
  Mail, 
  User as UserIcon, 
  Upload, 
  Edit, 
  FileText, 
  Coins, 
  ArrowRight,
  MapPin,
  Phone,
  MessageCircle
} from './icons/BrowoKoIcons';
import { User } from '../types/database';

export type QuickActionType = 
  | 'email'
  | 'call'
  | 'whatsapp'
  | 'upload-document'
  | 'quick-edit'
  | 'view-avatar'
  | 'add-note'
  | 'award-coins'
  | 'view-details';

interface QuickActionsMenuProps {
  user: User;
  onAction: (action: QuickActionType, user: User) => void;
}

export default function QuickActionsMenu({ user, onAction }: QuickActionsMenuProps) {
  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `mailto:${user.email}`;
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user.phone) {
      window.location.href = `tel:${user.phone}`;
    }
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user.phone) {
      const phoneNumber = user.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${phoneNumber}`, '_blank');
    }
  };

  const handleAction = (e: React.MouseEvent, action: QuickActionType) => {
    e.stopPropagation();
    onAction(action, user);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 md:h-8 md:w-8 hover:bg-gray-100 active:bg-gray-200"
        >
          <MoreVertical className="w-5 h-5 md:w-4 md:h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 md:w-56"
        sideOffset={5}
      >
        {/* Communication */}
        <DropdownMenuItem onClick={handleEmail} className="min-h-[44px] md:min-h-0 py-3 md:py-2 cursor-pointer">
          <Mail className="w-5 h-5 md:w-4 md:h-4 mr-3 md:mr-2 flex-shrink-0" />
          <span className="text-base md:text-sm">E-Mail senden</span>
        </DropdownMenuItem>
        
        {user.phone && (
          <>
            <DropdownMenuItem onClick={handleCall} className="min-h-[44px] md:min-h-0 py-3 md:py-2 cursor-pointer">
              <Phone className="w-5 h-5 md:w-4 md:h-4 mr-3 md:mr-2 flex-shrink-0" />
              <span className="text-base md:text-sm">Anrufen</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleWhatsApp} className="min-h-[44px] md:min-h-0 py-3 md:py-2 cursor-pointer">
              <MessageCircle className="w-5 h-5 md:w-4 md:h-4 mr-3 md:mr-2 flex-shrink-0" />
              <span className="text-base md:text-sm">WhatsApp</span>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Actions */}
        <DropdownMenuItem onClick={(e) => handleAction(e, 'upload-document')} className="min-h-[44px] md:min-h-0 py-3 md:py-2 cursor-pointer">
          <Upload className="w-5 h-5 md:w-4 md:h-4 mr-3 md:mr-2 flex-shrink-0" />
          <span className="text-base md:text-sm">Dokument hochladen</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={(e) => handleAction(e, 'quick-edit')} className="min-h-[44px] md:min-h-0 py-3 md:py-2 cursor-pointer">
          <Edit className="w-5 h-5 md:w-4 md:h-4 mr-3 md:mr-2 flex-shrink-0" />
          <span className="text-base md:text-sm">Schnellbearbeitung</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={(e) => handleAction(e, 'view-avatar')} className="min-h-[44px] md:min-h-0 py-3 md:py-2 cursor-pointer">
          <UserIcon className="w-5 h-5 md:w-4 md:h-4 mr-3 md:mr-2 flex-shrink-0" />
          <span className="text-base md:text-sm">Avatar anzeigen</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={(e) => handleAction(e, 'add-note')} className="min-h-[44px] md:min-h-0 py-3 md:py-2 cursor-pointer">
          <FileText className="w-5 h-5 md:w-4 md:h-4 mr-3 md:mr-2 flex-shrink-0" />
          <span className="text-base md:text-sm">Notiz hinzufügen</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Rewards */}
        <DropdownMenuItem onClick={(e) => handleAction(e, 'award-coins')} className="min-h-[44px] md:min-h-0 py-3 md:py-2 cursor-pointer">
          <Coins className="w-5 h-5 md:w-4 md:h-4 mr-3 md:mr-2 flex-shrink-0" />
          <span className="text-base md:text-sm">Coins vergeben</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Details */}
        <DropdownMenuItem onClick={(e) => handleAction(e, 'view-details')} className="min-h-[44px] md:min-h-0 py-3 md:py-2 cursor-pointer">
          <ArrowRight className="w-5 h-5 md:w-4 md:h-4 mr-3 md:mr-2 flex-shrink-0" />
          <span className="text-base md:text-sm">Details öffnen</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
