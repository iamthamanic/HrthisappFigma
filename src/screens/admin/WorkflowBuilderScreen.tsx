import { useCallback, useState, useRef, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Settings, Play } from '../../components/icons/BrowoKoIcons';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// Custom Nodes
import TriggerNode from '../../components/workflows/nodes/TriggerNode';
import ActionNode from '../../components/workflows/nodes/ActionNode';

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
};

const INITIAL_NODES: Node[] = [
  {
    id: 'start',
    type: 'trigger',
    position: { x: 250, y: 50 },
    data: { label: 'Mitarbeiter Onboarding Start', triggerType: 'ONBOARDING_START' },
  },
];

let id = 1;
const getId = () => `dndnode_${id++}`;

const WorkflowBuilder = () => {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [workflowName, setWorkflowName] = useState('Neuer Workflow');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const actionType = event.dataTransfer.getData('application/actionType');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: { label: `Neue Aktion`, type: actionType },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeLabel = (evt: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: evt.target.value,
            },
          };
        }
        return node;
      })
    );
  };

  const handleSave = async () => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      const idToSave = workflowId || `wf_${Date.now()}`;
      
      const workflowData = {
        id: idToSave,
        name: workflowName,
        nodes: flow.nodes,
        edges: flow.edges,
        updated_at: new Date().toISOString(),
        viewport: flow.viewport
      };

      const toastId = toast.loading('Speichere Workflow...');

      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Server/workflows`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(workflowData)
        });

        if (!response.ok) throw new Error('Save failed');

        toast.success('Workflow erfolgreich gespeichert!', { id: toastId });
        
        // If this was a new workflow (no ID in URL), we might want to update URL
        // But for now we just stay here
      } catch (error) {
        console.error(error);
        toast.error('Fehler beim Speichern', { id: toastId });
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="h-16 border-b flex items-center justify-between px-6 bg-white z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/workflows')}>
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Button>
          <div className="flex items-center gap-2">
             <Input 
               value={workflowName} 
               onChange={(e) => setWorkflowName(e.target.value)} 
               className="font-semibold text-lg border-none shadow-none hover:bg-gray-50 w-[300px]"
             />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} className="bg-blue-600">
            <Save className="w-4 h-4 mr-2" />
            Speichern
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar / Library */}
        <div className="w-64 border-r bg-gray-50 p-4 overflow-y-auto flex flex-col gap-6">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Aktionen</div>
            <div className="space-y-2">
              <DraggableItem type="action" actionType="SEND_EMAIL" label="Email senden" icon="✉️" />
              <DraggableItem type="action" actionType="ASSIGN_DOCUMENT" label="Dokument zuweisen" icon="📄" />
              <DraggableItem type="action" actionType="ASSIGN_TEST" label="Test zuweisen" icon="🎓" />
              <DraggableItem type="action" actionType="ASSIGN_VIDEO" label="Video zuweisen" icon="🎥" />
              <DraggableItem type="action" actionType="CREATE_TASK" label="Aufgabe erstellen" icon="✅" />
              <DraggableItem type="action" actionType="ASSIGN_EQUIPMENT" label="Equipment zuweisen" icon="💻" />
              <DraggableItem type="action" actionType="ASSIGN_BENEFITS" label="Benefits zuweisen" icon="🎁" />
              <DraggableItem type="action" actionType="DISTRIBUTE_COINS" label="Coins verteilen" icon="🪙" />
              <DraggableItem type="action" actionType="DELAY" label="Warten (Delay)" icon="⏱️" />
            </div>
          </div>
          
          <Card className="p-3 bg-blue-50 border-blue-100">
            <div className="text-xs text-blue-800">
              <Settings className="w-3 h-3 inline mr-1" />
              Drag & Drop die Aktionen auf den Canvas.
            </div>
          </Card>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative h-full" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            className="bg-gray-50"
          >
            <Controls />
            <Background gap={12} size={1} />
            <Panel position="top-right">
              {selectedNode && (
                <Card className="w-72 p-4 shadow-xl border-blue-200">
                  <h3 className="font-semibold mb-3 border-b pb-2">Einstellungen</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500">Beschriftung</label>
                      <Input 
                        value={selectedNode.data.label} 
                        onChange={updateNodeLabel} 
                        className="mt-1"
                      />
                    </div>
                    <div className="text-xs text-gray-400">
                      ID: {selectedNode.id}<br/>
                      Type: {selectedNode.data.type}
                    </div>
                    {/* Here we would add specific config based on node type */}
                  </div>
                </Card>
              )}
            </Panel>
          </ReactFlow>
        </div>

      </div>
    </div>
  );
};

const DraggableItem = ({ type, actionType, label, icon }: { type: string, actionType: string, label: string, icon: string }) => {
  const onDragStart = (event: React.DragEvent, nodeType: string, aType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/actionType', aType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="bg-white p-3 rounded-md border border-gray-200 shadow-sm cursor-grab hover:shadow-md hover:border-blue-300 transition-all flex items-center gap-3 select-none"
      onDragStart={(event) => onDragStart(event, type, actionType)}
      draggable
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
  );
};

export default function WorkflowBuilderWrapper() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilder />
    </ReactFlowProvider>
  );
}