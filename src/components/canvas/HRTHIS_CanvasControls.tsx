import { ZoomIn, ZoomOut, Maximize2 } from '../icons/HRTHISIcons';
import { Button } from '../ui/button';

/**
 * CANVAS ORGANIGRAM CONTROLS
 * ==========================
 * UI Controls for zoom and canvas manipulation
 */

interface CanvasControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
}

export default function CanvasControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
}: CanvasControlsProps) {
  return (
    <div className="absolute bottom-4 left-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-2">
      <Button onClick={onZoomIn} size="sm" variant="outline" title="Zoom In (Cmd/Ctrl + +)">
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button onClick={onZoomOut} size="sm" variant="outline" title="Zoom Out (Cmd/Ctrl + -)">
        <ZoomOut className="w-4 h-4" />
      </Button>
      <Button onClick={onFitToScreen} size="sm" variant="outline" title="Fit to Screen (F)">
        <Maximize2 className="w-4 h-4" />
      </Button>

      <div className="text-sm text-gray-600 ml-2 font-medium">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
