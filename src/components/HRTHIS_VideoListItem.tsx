/**
 * @file HRTHIS_VideoListItem.tsx
 * @domain HR - Learning Management
 * @description Single video list item with edit/delete actions
 * @namespace HRTHIS_
 */

import { Video, Edit, Trash2 } from './icons/HRTHISIcons';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getVideoDurationMinutes, getVideoXPReward, getVideoCoinReward } from '../utils/HRTHIS_videoHelper';

interface VideoListItemProps {
  video: any;
  onEditClick: (video: any) => void;
  onDeleteClick: (video: any) => void;
}

export default function VideoListItem({
  video,
  onEditClick,
  onDeleteClick,
}: VideoListItemProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-24 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
          <Video className="w-8 h-8 text-gray-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900">{video.title}</h3>
            <Badge variant="secondary">{video.category}</Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">{video.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>{getVideoDurationMinutes(video)} Min</span>
            <span>•</span>
            <span>{getVideoXPReward(video)} XP</span>
            <span>•</span>
            <span>{getVideoCoinReward(video)} Coins</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onEditClick(video)}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onDeleteClick(video)}>
          <Trash2 className="w-4 h-4 text-red-600" />
        </Button>
      </div>
    </div>
  );
}
