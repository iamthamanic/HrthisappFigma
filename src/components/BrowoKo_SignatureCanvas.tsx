/**
 * SIGNATURE CANVAS COMPONENT
 * ==========================
 * Digitale Unterschrift mit Canvas
 */

import { useRef, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Trash2, Check, PenTool } from 'lucide-react';

interface SignatureCanvasProps {
  onSave: (signatureData: string) => void;
  onClear?: () => void;
  existingSignature?: string;
  disabled?: boolean;
  label?: string;
}

export function SignatureCanvas({
  onSave,
  onClear,
  existingSignature,
  disabled = false,
  label = 'Unterschrift'
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    context.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Configure drawing
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    setCtx(context);

    // Load existing signature
    if (existingSignature) {
      loadSignature(existingSignature, context);
    }
  }, [existingSignature]);

  // Load signature from data URL
  const loadSignature = (dataUrl: string, context: CanvasRenderingContext2D) => {
    const img = new Image();
    img.onload = () => {
      context.drawImage(img, 0, 0);
      setHasSignature(true);
    };
    img.src = dataUrl;
  };

  // Start drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled || !ctx) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  // Draw
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctx || disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // Stop drawing
  const stopDrawing = () => {
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    
    if (onClear) {
      onClear();
    }
  };

  // Save signature
  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Label */}
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium">{label}</span>
        </div>

        {/* Canvas */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white">
          <canvas
            ref={canvasRef}
            className="w-full h-40 cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ touchAction: 'none' }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearCanvas}
            disabled={!hasSignature || disabled}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Löschen
          </Button>
          <Button
            size="sm"
            onClick={saveSignature}
            disabled={!hasSignature || disabled}
          >
            <Check className="w-4 h-4 mr-2" />
            Speichern
          </Button>
        </div>

        {/* Info Text */}
        {!hasSignature && (
          <p className="text-xs text-gray-500 text-center">
            Unterschreiben Sie mit Maus oder Touchscreen
          </p>
        )}
      </div>
    </Card>
  );
}
