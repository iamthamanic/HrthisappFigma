import { useState, useCallback } from "react";
import Cropper from "react-easy-crop@5.0.8";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { ZoomIn, ZoomOut } from "./icons/BrowoKoIcons";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc?: string;
  onCropComplete: (croppedBlob: Blob) => void;
}

export function ImageCropDialog({ open, onOpenChange, imageSrc, onCropComplete: handleCropComplete }: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    try {
      if (!imageSrc) return;
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      handleCropComplete(croppedBlob);
    } catch (e) {
      console.error(e);
    }
  };

  // Don't render if no image source
  if (!imageSrc) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Profilbild bearbeiten</DialogTitle>
          <DialogDescription>
            Verschiebe und zoome das Bild, um den gewünschten Ausschnitt festzulegen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Crop Area */}
          <div className="relative w-full aspect-square bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Zoom Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ZoomOut className="size-4" />
                Zoom
              </span>
              <ZoomIn className="size-4" />
            </div>
            <Slider
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={1}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11">
            Abbrechen
          </Button>
          <Button onClick={createCroppedImage} className="h-11">
            Übernehmen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to create cropped image and return as Blob
async function getCroppedImg(imageSrc: string, pixelCrop: any, maxSize = 400): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Calculate the size to fit within maxSize while maintaining aspect ratio
  let width = pixelCrop.width;
  let height = pixelCrop.height;
  
  // Scale down if necessary
  if (width > maxSize || height > maxSize) {
    const scaleFactor = maxSize / Math.max(width, height);
    width = Math.round(width * scaleFactor);
    height = Math.round(height * scaleFactor);
  }

  // Set canvas size
  canvas.width = width;
  canvas.height = height;

  // Draw the cropped and scaled image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height
  );

  // Return as Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas to Blob conversion failed'));
      }
    }, 'image/jpeg', 0.9);
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}
