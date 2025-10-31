import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Megaphone, ExternalLink, Video, Gift, X } from './icons/BrowoKoIcons';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Announcement, AnnouncementContentBlock } from '../services/BrowoKo_announcementService';

interface DashboardAnnouncementCardProps {
  announcement: Announcement;
  onVideoClick?: (videoId: string) => void;
  onBenefitClick?: (benefitId: string) => void;
  onDismiss?: () => void;
  canDismiss?: boolean;
}

export default function HRTHIS_DashboardAnnouncementCard({
  announcement,
  onVideoClick,
  onBenefitClick,
  onDismiss,
  canDismiss = false,
}: DashboardAnnouncementCardProps) {
  const renderBlock = (block: AnnouncementContentBlock, index: number) => {
    switch (block.type) {
      case 'richtext':
        // Render HTML from rich text editor
        return (
          <div
            key={index}
            className="prose prose-sm max-w-none dark:prose-invert text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: block.html || '' }}
          />
        );

      case 'text':
        return (
          <p key={index} className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {block.content}
          </p>
        );

      case 'link':
        return (
          <a
            key={index}
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
          >
            {block.text || block.url}
            <ExternalLink className="w-3 h-3" />
          </a>
        );

      case 'image':
        return (
          <div key={index} className="my-3">
            <img
              src={block.url}
              alt={block.alt || 'Announcement image'}
              className="max-w-full h-auto rounded-lg border shadow-sm"
              loading="lazy"
            />
          </div>
        );

      case 'video':
        return (
          <Button
            key={index}
            variant="outline"
            className="w-full justify-start"
            onClick={() => onVideoClick?.(block.videoId || '')}
          >
            <Video className="w-4 h-4 mr-2" />
            Schulungsvideo ansehen
          </Button>
        );

      case 'benefit':
        return (
          <Button
            key={index}
            variant="outline"
            className="w-full justify-start"
            onClick={() => onBenefitClick?.(block.benefitId || '')}
          >
            <Gift className="w-4 h-4 mr-2" />
            Benefit ansehen
          </Button>
        );

      default:
        return null;
    }
  };

  // Check if announcement was edited by someone else
  const wasEditedByOther = announcement.updated_by && 
    announcement.updated_by !== announcement.created_by &&
    announcement.updated_by_name;

  // Determine display name and action text
  const displayName = wasEditedByOther 
    ? announcement.updated_by_name 
    : announcement.created_by_name;
  
  const actionText = wasEditedByOther ? 'Geändert von' : 'Von';

  // Use updated_at if edited by other, otherwise use pushed_live_at or created_at
  const referenceDate = wasEditedByOther 
    ? announcement.updated_at 
    : (announcement.pushed_live_at || announcement.created_at);

  const timeAgo = formatDistanceToNow(new Date(referenceDate), {
    addSuffix: true,
    locale: de,
  });

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800 relative">
      {/* Dismiss Button */}
      {canDismiss && onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 w-8 h-8 p-0"
          onClick={onDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
          <Megaphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {announcement.title}
            </h3>
            <Badge variant="secondary" className="text-xs">
              Aktuell
            </Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {actionText} {displayName} • {timeAgo}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {announcement.content.blocks.map((block, index) => renderBlock(block, index))}
      </div>
    </Card>
  );
}
