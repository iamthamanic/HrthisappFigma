DELETE FROM node_connections
WHERE 
  source_node_id::text LIKE 'node-%' 
  OR target_node_id::text LIKE 'node-%';

DELETE FROM org_nodes
WHERE id::text LIKE 'node-%';
