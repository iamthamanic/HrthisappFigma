/**
 * @file HRTHIS_VideosListTab.tsx
 * @domain HR - Learning Management
 * @description Complete videos list tab with category filter and list
 * @namespace HRTHIS_
 */

import { Video } from './icons/HRTHISIcons';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import VideoCategoryFilter from './HRTHIS_VideoCategoryFilter';
import VideoListItem from './HRTHIS_VideoListItem';

interface Category {
  id: string;
  label: string;
  count: number;
}

interface VideosListTabProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  filteredVideos: any[];
  onEditClick: (video: any) => void;
  onDeleteClick: (video: any) => void;
}

export default function VideosListTab({
  categories,
  selectedCategory,
  onSelectCategory,
  filteredVideos,
  onEditClick,
  onDeleteClick,
}: VideosListTabProps) {
  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <VideoCategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
      />

      {/* Videos List */}
      <Card>
        <CardHeader>
          <CardTitle>Schulungsvideos ({filteredVideos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredVideos.map((video) => (
              <VideoListItem
                key={video.id}
                video={video}
                onEditClick={onEditClick}
                onDeleteClick={onDeleteClick}
              />
            ))}
            {filteredVideos.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Keine Videos in dieser Kategorie</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
