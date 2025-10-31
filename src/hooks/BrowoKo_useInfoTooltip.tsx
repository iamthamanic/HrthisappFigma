/**
 * @file BrowoKo_useInfoTooltip.tsx
 * @description Wiederverwendbarer Hook für Info-Tooltips
 * @created 2025-01-19
 * @version v4.9.2
 * 
 * Usage:
 * ```tsx
 * const InfoTooltip = useInfoTooltip();
 * 
 * <InfoTooltip text="Deine Erklärung hier" />
 * ```
 * 
 * Advanced Usage:
 * ```tsx
 * const InfoTooltip = useInfoTooltip({ 
 *   iconSize: 'w-5 h-5',
 *   iconColor: 'text-blue-500'
 * });
 * ```
 */

import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';

interface InfoTooltipProps {
  /** Der Text, der im Tooltip angezeigt wird */
  text: string;
  /** Optionale zusätzliche CSS-Klassen für das Icon */
  className?: string;
  /** Max-Width des Tooltip-Contents (default: 'max-w-xs') */
  maxWidth?: string;
  /** Seite, auf der der Tooltip erscheint (default: 'top') */
  side?: 'top' | 'bottom' | 'left' | 'right';
}

interface UseInfoTooltipOptions {
  /** Icon-Größe (default: 'w-4 h-4') */
  iconSize?: string;
  /** Icon-Farbe (default: 'text-gray-400') */
  iconColor?: string;
  /** Cursor-Style (default: 'cursor-help') */
  cursor?: string;
}

/**
 * Hook für wiederverwendbare Info-Tooltips
 * 
 * @param options - Optionale Konfiguration für Icon-Styling
 * @returns InfoTooltip-Komponente
 */
export function useInfoTooltip(options: UseInfoTooltipOptions = {}) {
  const {
    iconSize = 'w-4 h-4',
    iconColor = 'text-gray-400',
    cursor = 'cursor-help'
  } = options;

  /**
   * InfoTooltip-Komponente
   * 
   * @param text - Der anzuzeigende Tooltip-Text
   * @param className - Zusätzliche CSS-Klassen
   * @param maxWidth - Max-Width des Tooltips (default: 'max-w-xs')
   * @param side - Seite des Tooltips (default: 'top')
   */
  const InfoTooltip = ({
    text,
    className = '',
    maxWidth = 'max-w-xs',
    side = 'top'
  }: InfoTooltipProps) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Info 
            className={`${iconSize} ${iconColor} ${cursor} ${className}`}
          />
        </TooltipTrigger>
        <TooltipContent side={side} className={maxWidth}>
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return InfoTooltip;
}
