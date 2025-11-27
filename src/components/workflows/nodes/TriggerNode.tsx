
import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Play } from '../../../components/icons/BrowoKoIcons';

export default memo(({ data }: { data: any }) => {
  return (
    <div className="shadow-lg rounded-md bg-white border-2 border-blue-500 w-[250px]">
      <div className="bg-blue-50 p-3 rounded-t-md border-b border-blue-100 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <Play className="w-4 h-4" />
        </div>
        <div>
          <div className="text-sm font-bold text-gray-900">Start</div>
          <div className="text-xs text-gray-500 uppercase">{data.triggerType || 'Trigger'}</div>
        </div>
      </div>
      
      <div className="p-3 text-sm text-gray-600 bg-white rounded-b-md">
        {data.label || 'Wenn Mitarbeiter angelegt wird...'}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  );
});
