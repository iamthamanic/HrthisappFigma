/**
 * @file HttpRequestNode.tsx
 * @version 1.0.0
 * @description HTTP Request Node für Workflow-System (wie n8n)
 * 
 * Features:
 * - GET, POST, PUT, PATCH, DELETE
 * - Authentication: API Key, Bearer Token, Basic Auth, OAuth2
 * - Custom Headers & Query Parameters
 * - Request Body (JSON, Form Data, Raw)
 * - Response Mapping & Variable Extraction
 * - Error Handling & Retries
 */

import { memo } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { Globe, Lock, Send, X } from '../../../components/icons/BrowoKoIcons';
import { Badge } from '../../ui/badge';
import { HttpMethod } from '../../../types/workflow';

interface HttpRequestNodeProps {
  id: string;
  data: {
    label: string;
    config: {
      method?: HttpMethod;
      url?: string;
      auth?: {
        type: string;
      };
    };
  };
  isConnectable: boolean;
  selected: boolean;
}

export const HttpRequestNode = memo(({ id, data, isConnectable, selected }: HttpRequestNodeProps) => {
  const { setNodes } = useReactFlow();
  const method = data.config?.method || 'GET';
  const url = data.config?.url || 'https://api.example.com';
  const authType = data.config?.auth?.type || 'NONE';
  
  // Method colors (n8n-style)
  const methodColors: Record<HttpMethod, string> = {
    GET: 'bg-blue-500',
    POST: 'bg-green-500',
    PUT: 'bg-orange-500',
    PATCH: 'bg-yellow-500',
    DELETE: 'bg-red-500',
  };
  
  const handleDelete = () => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
  };
  
  return (
    <div 
      className={`
        px-4 py-3 rounded-lg border-2 min-w-[280px] max-w-[320px]
        bg-white shadow-lg transition-all relative group
        ${selected ? 'border-blue-500 shadow-xl' : 'border-gray-200 hover:border-gray-300'}
      `}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="!bg-gray-400 !w-3 !h-3 !border-2 !border-white"
      />
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded">
          <Globe className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{data.label}</div>
          <div className="text-xs text-gray-500">HTTP Request</div>
        </div>
        <button
          onClick={handleDelete}
          className="p-1.5 rounded bg-red-100 hover:bg-red-200 transition-colors text-red-600 shrink-0"
          title="Node entfernen"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Method Badge */}
      <div className="flex items-center gap-2 mb-2">
        <Badge className={`${methodColors[method]} text-white text-xs px-2 py-0.5`}>
          {method}
        </Badge>
        {authType !== 'NONE' && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Lock className="w-3 h-3" />
            <span>{authType.replace('_', ' ')}</span>
          </div>
        )}
      </div>
      
      {/* URL Preview */}
      <div className="bg-gray-50 px-2 py-1.5 rounded border border-gray-200 mb-2">
        <div className="text-xs text-gray-600 font-mono truncate" title={url}>
          {url}
        </div>
      </div>
      
      {/* Info */}
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Send className="w-3 h-3" />
        <span>Externes API-Call</span>
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="!bg-purple-500 !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  );
});

HttpRequestNode.displayName = 'HttpRequestNode';