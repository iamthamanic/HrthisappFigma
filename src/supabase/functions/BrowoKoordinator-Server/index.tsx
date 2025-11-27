import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
// ❌ REMOVED: import * as kv from "./kv_store.tsx";
// ❌ REMOVED: import { testSubmissionsApp } from "./testSubmissions.ts";
// ❌ REMOVED: import { executeWorkflowGraph } from "./workflowEngine.ts";

// ==================== TRIGGER TYPES & HELPER ====================
const TRIGGER_TYPES = {
  EMPLOYEE_CREATED: 'EMPLOYEE_CREATED',
  EMPLOYEE_UPDATED: 'EMPLOYEE_UPDATED',
  EMPLOYEE_DELETED: 'EMPLOYEE_DELETED',
  ONBOARDING_START: 'ONBOARDING_START',
  OFFBOARDING_START: 'OFFBOARDING_START',
  BENEFIT_ASSIGNED: 'BENEFIT_ASSIGNED',
  BENEFIT_REMOVED: 'BENEFIT_REMOVED',
  TASK_CREATED: 'TASK_CREATED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TRAINING_ASSIGNED: 'TRAINING_ASSIGNED',
  TRAINING_COMPLETED: 'TRAINING_COMPLETED',
  DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
  DOCUMENT_SIGNED: 'DOCUMENT_SIGNED',
  EQUIPMENT_ASSIGNED: 'EQUIPMENT_ASSIGNED',
  EQUIPMENT_RETURNED: 'EQUIPMENT_RETURNED',
  VEHICLE_ASSIGNED: 'VEHICLE_ASSIGNED',
  VEHICLE_RETURNED: 'VEHICLE_RETURNED',
  VEHICLE_DAMAGE_REPORTED: 'VEHICLE_DAMAGE_REPORTED',
  CONTRACT_SIGNED: 'CONTRACT_SIGNED',
  CONTRACT_UPDATED: 'CONTRACT_UPDATED',
};

async function triggerWorkflows(
  triggerType: string,
  context: Record<string, any>,
  authToken: string
): Promise<void> {
  try {
    const projectId = Deno.env.get('SUPABASE_URL')?.split('//')[1]?.split('.')[0];
    if (!projectId) return;

    console.log(`🔔 Triggering workflows for event: ${triggerType}`);

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Workflows/trigger`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify({ trigger_type: triggerType, context }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.warn(`[triggerWorkflows] Failed:`, error);
      return;
    }

    const result = await response.json();
    console.log(`✅ Workflows triggered:`, result);
  } catch (error) {
    console.error(`[triggerWorkflows] Error:`, error);
  }
}

// ==================== INLINE KV STORE ====================
// (Previously from kv_store.tsx)
const kvClient = () => createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
);

const kv = {
  set: async (key: string, value: any): Promise<void> => {
    const supabase = kvClient();
    const { error } = await supabase.from("kv_store_f659121d").upsert({ key, value });
    if (error) throw new Error(error.message);
  },
  
  get: async (key: string): Promise<any> => {
    const supabase = kvClient();
    const { data, error } = await supabase.from("kv_store_f659121d").select("value").eq("key", key).maybeSingle();
    if (error) throw new Error(error.message);
    return data?.value;
  },
  
  del: async (key: string): Promise<void> => {
    const supabase = kvClient();
    const { error } = await supabase.from("kv_store_f659121d").delete().eq("key", key);
    if (error) throw new Error(error.message);
  },
  
  mset: async (keys: string[], values: any[]): Promise<void> => {
    const supabase = kvClient();
    const { error } = await supabase.from("kv_store_f659121d").upsert(keys.map((k, i) => ({ key: k, value: values[i] })));
    if (error) throw new Error(error.message);
  },
  
  mget: async (keys: string[]): Promise<any[]> => {
    const supabase = kvClient();
    const { data, error } = await supabase.from("kv_store_f659121d").select("value").in("key", keys);
    if (error) throw new Error(error.message);
    return data?.map((d) => d.value) ?? [];
  },
  
  mdel: async (keys: string[]): Promise<void> => {
    const supabase = kvClient();
    const { error } = await supabase.from("kv_store_f659121d").delete().in("key", keys);
    if (error) throw new Error(error.message);
  },
  
  getByPrefix: async (prefix: string): Promise<any[]> => {
    const supabase = kvClient();
    const { data, error } = await supabase.from("kv_store_f659121d").select("key, value").like("key", prefix + "%");
    if (error) throw new Error(error.message);
    return data?.map((d) => d.value) ?? [];
  }
};

// ==================== INLINE WORKFLOW ENGINE ====================
// (Previously from workflowEngine.ts)
interface WorkflowNode {
  id: string;
  type: string;
  data: {
    label: string;
    type?: string;
    triggerType?: string;
    config?: any;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

interface Workflow {
  id: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface ExecutionContext {
  userId?: string;
  employeeId?: string;
  [key: string]: any;
}

const getNextNodes = (nodes: WorkflowNode[], edges: WorkflowEdge[], currentNodeId: string) => {
  const outgoingEdges = edges.filter(e => e.source === currentNodeId);
  const targetNodeIds = outgoingEdges.map(e => e.target);
  return nodes.filter(n => targetNodeIds.includes(n.id));
};

const executeAction = async (node: WorkflowNode, context: ExecutionContext) => {
  const actionType = node.data.type;
  const label = node.data.label;
  
  console.log(`⚡ Executing Action: [${actionType}] ${label}`);
  
  switch (actionType) {
    case 'SEND_EMAIL':
      console.log(`📧 Email sent to user ${context.userId}: Subject: "Update from HR"`);
      break;
    case 'ASSIGN_DOCUMENT':
      if (context.userId) {
         const docId = `doc_${Date.now()}`;
         await kv.set(`user_document:${context.userId}:${docId}`, {
           documentName: "Onboarding Checklist",
           assignedAt: new Date().toISOString(),
           status: "PENDING"
         });
         console.log(`📄 Document assigned to ${context.userId}`);
      }
      break;
    case 'ASSIGN_EQUIPMENT':
      console.log(`💻 Equipment request created for ${context.userId}`);
      break;
    case 'ASSIGN_BENEFITS':
      console.log(`🎁 Benefit assigned to ${context.userId}`);
      break;
    case 'DISTRIBUTE_COINS':
      if (context.userId) {
        console.log(`🪙 100 Coins distributed to ${context.userId}`);
      }
      break;
    case 'DELAY':
      console.log(`⏱️ Delay requested. (Skipping for immediate execution prototype)`);
      break;
    default:
      console.log(`⚠️ Unknown action type: ${actionType}`);
  }
  
  return { success: true, action: actionType };
};

const executeWorkflowGraph = async (workflow: Workflow, context: ExecutionContext) => {
  const { nodes, edges } = workflow;
  const logs: string[] = [];
  
  const log = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  log(`🚀 Starting Workflow Execution for ${workflow.id}`);

  const startNode = nodes.find(n => n.type === 'trigger');
  
  if (!startNode) {
    throw new Error("No trigger node found in workflow.");
  }

  log(`🟢 Trigger fired: ${startNode.data.label}`);

  let queue: WorkflowNode[] = [startNode];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentNode = queue.shift()!;
    
    if (visited.has(currentNode.id)) continue;
    visited.add(currentNode.id);

    if (currentNode.type === 'action') {
      try {
        await executeAction(currentNode, context);
        log(`✅ Action executed: ${currentNode.data.label}`);
      } catch (e: any) {
        log(`❌ Action failed: ${currentNode.data.label} - ${e.message}`);
      }
    }

    const nextNodes = getNextNodes(nodes, edges, currentNode.id);
    queue = [...queue, ...nextNodes];
  }

  log(`🏁 Workflow Execution Completed.`);
  return { success: true, logs };
};

// ==================== INLINE TEST SUBMISSIONS APP ====================
// (Previously from testSubmissions.ts)
const testSubmissionsApp = new Hono();

const testSubmissionsSupabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const SUBMISSIONS_BUCKET = 'make-f659121d-submissions';

async function ensureSubmissionsBucketExists() {
  try {
    const { data: buckets } = await testSubmissionsSupabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === SUBMISSIONS_BUCKET);
    
    if (!bucketExists) {
      console.log(`📦 Creating storage bucket: ${SUBMISSIONS_BUCKET}`);
      const { error } = await testSubmissionsSupabase.storage.createBucket(SUBMISSIONS_BUCKET, {
        public: false,
        fileSizeLimit: 52428800,
      });
      
      if (error) {
        console.error(`❌ Error creating bucket ${SUBMISSIONS_BUCKET}:`, error);
        return false;
      }
      console.log(`✅ Storage bucket ${SUBMISSIONS_BUCKET} created`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Error ensuring submissions bucket:`, error);
    return false;
  }
}

ensureSubmissionsBucketExists();

function calculateAutoScore(
  autoAnswers: Record<string, any>,
  testBlocks: any[]
): { score: number; maxScore: number; percentage: number } {
  let score = 0;
  let maxScore = 0;

  for (const block of testBlocks) {
    const autoBlockTypes = ['MULTIPLE_CHOICE', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'SHORT_TEXT'];
    
    if (!autoBlockTypes.includes(block.type)) continue;
    
    maxScore += block.points || 10;
    
    const userAnswer = autoAnswers[block.id];
    const correctAnswer = block.content?.correctAnswer;
    
    if (!userAnswer || !correctAnswer) continue;
    
    let isCorrect = false;
    
    if (block.type === 'MULTIPLE_CHOICE' || block.type === 'TRUE_FALSE') {
      isCorrect = userAnswer === correctAnswer;
    } else if (block.type === 'MULTIPLE_SELECT') {
      const userSet = new Set(userAnswer);
      const correctSet = new Set(correctAnswer);
      isCorrect = userSet.size === correctSet.size && [...userSet].every(x => correctSet.has(x));
    } else if (block.type === 'SHORT_TEXT') {
      isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    }
    
    if (isCorrect) {
      score += block.points || 10;
    }
  }

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  
  return { score, maxScore, percentage };
}

function calculateFinalScore(
  autoPercentage: number,
  practicalPassed: boolean,
  test: any
): { finalScore: number; finalPercentage: number; passed: boolean } {
  const autoWeight = 0.6;
  const practicalWeight = 0.4;
  
  const practicalScore = practicalPassed ? 100 : 0;
  const finalPercentage = (autoPercentage * autoWeight) + (practicalScore * practicalWeight);
  const passPercentage = test.pass_percentage || 80;
  
  return {
    finalScore: Math.round(finalPercentage),
    finalPercentage: Math.round(finalPercentage),
    passed: finalPercentage >= passPercentage
  };
}

testSubmissionsApp.get('/submissions', async (c) => {
  try {
    const status = c.req.query('status');
    const userId = c.req.query('userId');
    const testId = c.req.query('testId');
    
    let query = testSubmissionsSupabase
      .from('test_submissions')
      .select(`
        *,
        test:tests!inner(id, title, pass_percentage),
        user:users!test_submissions_user_id_fkey(id, first_name, last_name, email),
        reviewer:users!test_submissions_reviewer_id_fkey(id, first_name, last_name)
      `)
      .order('created_at', { ascending: false });
    
    if (status) query = query.eq('status', status);
    if (userId) query = query.eq('user_id', userId);
    if (testId) query = query.eq('test_id', testId);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ Error fetching submissions:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

testSubmissionsApp.get('/submissions/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const { data: submission, error } = await testSubmissionsSupabase
      .from('test_submissions')
      .select(`
        *,
        test:tests!inner(*),
        user:users!test_submissions_user_id_fkey(id, first_name, last_name, email),
        reviewer:users!test_submissions_reviewer_id_fkey(id, first_name, last_name)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    const { data: blocks } = await testSubmissionsSupabase
      .from('test_blocks')
      .select('*')
      .eq('test_id', submission.test_id)
      .order('position');
    
    const { data: comments } = await testSubmissionsSupabase
      .from('review_comments')
      .select('*')
      .eq('submission_id', id)
      .order('created_at');
    
    return c.json({ 
      success: true, 
      data: {
        ...submission,
        blocks: blocks || [],
        comments: comments || []
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching submission:', error);
    return c.json({ success: false, error: error.message }, 404);
  }
});

testSubmissionsApp.post('/submissions', async (c) => {
  try {
    const body = await c.req.json();
    const { testId, userId, videoId } = body;
    
    const { data: existing } = await testSubmissionsSupabase
      .from('test_submissions')
      .select('id')
      .eq('test_id', testId)
      .eq('user_id', userId)
      .eq('status', 'DRAFT')
      .maybeSingle();
    
    if (existing) {
      return c.json({ success: true, data: existing, message: 'Draft already exists' });
    }
    
    const { data: attempts } = await testSubmissionsSupabase
      .from('test_submissions')
      .select('attempt_number')
      .eq('test_id', testId)
      .eq('user_id', userId)
      .order('attempt_number', { ascending: false })
      .limit(1);
    
    const attemptNumber = (attempts?.[0]?.attempt_number || 0) + 1;
    
    if (attemptNumber > 3) {
      return c.json({ success: false, error: 'Maximale Anzahl an Versuchen erreicht (3)' }, 400);
    }
    
    const { data, error } = await testSubmissionsSupabase
      .from('test_submissions')
      .insert({
        test_id: testId,
        user_id: userId,
        video_id: videoId,
        status: 'DRAFT',
        attempt_number: attemptNumber,
        auto_answers: {},
        practical_submissions: [],
        auto_score: 0,
        auto_max_score: 0,
        auto_percentage: 0,
        final_score: 0,
        final_percentage: 0,
        passed: false,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ Error creating submission:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

testSubmissionsApp.patch('/submissions/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { autoAnswers, practicalSubmissions, status } = body;
    
    const updates: any = { updated_at: new Date().toISOString() };
    
    if (autoAnswers) updates.auto_answers = autoAnswers;
    if (practicalSubmissions) updates.practical_submissions = practicalSubmissions;
    if (status) updates.status = status;
    
    const { data, error } = await testSubmissionsSupabase
      .from('test_submissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ Error updating submission:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

testSubmissionsApp.post('/submissions/:id/submit', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { autoAnswers, practicalSubmissions } = body;
    
    const { data: submission, error: subError } = await testSubmissionsSupabase
      .from('test_submissions')
      .select('*, test:tests!inner(*)')
      .eq('id', id)
      .single();
    
    if (subError) throw subError;
    
    const { data: blocks, error: blocksError } = await testSubmissionsSupabase
      .from('test_blocks')
      .select('*')
      .eq('test_id', submission.test_id);
    
    if (blocksError) throw blocksError;
    
    const autoScoreData = calculateAutoScore(autoAnswers, blocks || []);
    
    const hasPracticalBlocks = blocks?.some(b => b.type === 'FILE_UPLOAD' || b.type === 'VIDEO');
    
    const updates: any = {
      auto_answers: autoAnswers,
      practical_submissions: practicalSubmissions || [],
      auto_score: autoScoreData.score,
      auto_max_score: autoScoreData.maxScore,
      auto_percentage: autoScoreData.percentage,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    if (hasPracticalBlocks) {
      updates.status = 'PENDING_REVIEW';
    } else {
      const finalScoreData = calculateFinalScore(autoScoreData.percentage, true, submission.test);
      updates.status = finalScoreData.passed ? 'APPROVED' : 'FAILED';
      updates.final_score = finalScoreData.finalScore;
      updates.final_percentage = finalScoreData.finalPercentage;
      updates.passed = finalScoreData.passed;
    }
    
    const { data, error } = await testSubmissionsSupabase
      .from('test_submissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ Error submitting for review:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

testSubmissionsApp.post('/submissions/:id/review', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { reviewerId, decision, reason, stars, comments } = body;
    
    if (!['approve', 'needs_revision', 'fail'].includes(decision)) {
      return c.json({ success: false, error: 'Invalid decision' }, 400);
    }
    
    if (!reason || reason.length < 20) {
      return c.json({ success: false, error: 'Begründung muss mindestens 20 Zeichen lang sein' }, 400);
    }
    
    const { data: submission, error: subError } = await testSubmissionsSupabase
      .from('test_submissions')
      .select('*, test:tests!inner(*)')
      .eq('id', id)
      .single();
    
    if (subError) throw subError;
    
    const practicalPassed = decision === 'approve';
    const finalScoreData = calculateFinalScore(submission.auto_percentage, practicalPassed, submission.test);
    
    let newStatus = 'PENDING_REVIEW';
    if (decision === 'approve') {
      newStatus = finalScoreData.passed ? 'APPROVED' : 'FAILED';
    } else if (decision === 'needs_revision') {
      newStatus = 'NEEDS_REVISION';
    } else if (decision === 'fail') {
      newStatus = 'FAILED';
    }
    
    const { data, error } = await testSubmissionsSupabase
      .from('test_submissions')
      .update({
        reviewer_id: reviewerId,
        reviewed_at: new Date().toISOString(),
        review_decision: decision,
        review_reason: reason,
        review_stars: stars || null,
        status: newStatus,
        final_score: finalScoreData.finalScore,
        final_percentage: finalScoreData.finalPercentage,
        passed: finalScoreData.passed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    if (comments && comments.length > 0) {
      const commentInserts = comments.map((comment: any) => ({
        submission_id: id,
        block_id: comment.blockId,
        reviewer_id: reviewerId,
        type: comment.type,
        position_x: comment.positionX,
        position_y: comment.positionY,
        timestamp: comment.timestamp,
        text: comment.text,
      }));
      
      await testSubmissionsSupabase.from('review_comments').insert(commentInserts);
    }
    
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ Error reviewing submission:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

testSubmissionsApp.post('/upload-submission-file', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const submissionId = formData.get('submissionId') as string;
    const blockId = formData.get('blockId') as string;
    
    if (!file || !submissionId || !blockId) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }
    
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const fileName = `${submissionId}/${blockId}-${timestamp}.${ext}`;
    
    const fileBuffer = await file.arrayBuffer();
    const { data, error } = await testSubmissionsSupabase.storage
      .from(SUBMISSIONS_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });
    
    if (error) throw error;
    
    const { data: signedUrlData } = await testSubmissionsSupabase.storage
      .from(SUBMISSIONS_BUCKET)
      .createSignedUrl(fileName, 604800);
    
    return c.json({ 
      success: true, 
      data: {
        fileUrl: signedUrlData?.signedUrl,
        fileName: file.name,
        fileSize: file.size,
        filePath: fileName,
      }
    });
  } catch (error: any) {
    console.error('❌ Error uploading file:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

testSubmissionsApp.delete('/submissions/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const { data: submission } = await testSubmissionsSupabase
      .from('test_submissions')
      .select('status')
      .eq('id', id)
      .single();
    
    if (submission?.status !== 'DRAFT') {
      return c.json({ success: false, error: 'Nur Entwürfe können gelöscht werden' }, 400);
    }
    
    const { error } = await testSubmissionsSupabase
      .from('test_submissions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error deleting submission:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ==================== MAIN SERVER CODE ====================
const app = new Hono();

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Storage bucket names
const LOGO_BUCKET = 'make-f659121d-company-logos';
const PROFILE_BUCKET = 'make-f659121d-profile-pictures';
const ANNOUNCEMENTS_BUCKET = 'make-f659121d-announcements';

// Ensure storage buckets exist on server startup
async function ensureBucketExists(bucketName: string) {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`❌ Error listing buckets:`, listError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`📦 Creating storage bucket: ${bucketName}`);
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
      if (error) {
        console.error(`❌ Error creating bucket ${bucketName}:`, error);
        return false;
      } else {
        console.log(`✅ Storage bucket ${bucketName} created successfully`);
        return true;
      }
    } else {
      console.log(`✅ Storage bucket ${bucketName} already exists`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error ensuring bucket ${bucketName} exists:`, error);
    return false;
  }
}

// Initialize all buckets
async function initializeAllBuckets() {
  console.log('🔄 Initializing storage buckets...');
  const logoBucketReady = await ensureBucketExists(LOGO_BUCKET);
  const profileBucketReady = await ensureBucketExists(PROFILE_BUCKET);
  
  // Announcements bucket with larger file size limit for PDFs
  const { data: buckets } = await supabase.storage.listBuckets();
  const announcementsBucketExists = buckets?.some(b => b.name === ANNOUNCEMENTS_BUCKET);
  
  let announcementsBucketReady = false;
  if (!announcementsBucketExists) {
    console.log(`📦 Creating storage bucket: ${ANNOUNCEMENTS_BUCKET}`);
    const { error } = await supabase.storage.createBucket(ANNOUNCEMENTS_BUCKET, {
      public: false, // Private bucket - use signed URLs
      fileSizeLimit: 20971520, // 20MB for PDFs
    });
    if (error) {
      console.error(`❌ Error creating bucket ${ANNOUNCEMENTS_BUCKET}:`, error);
    } else {
      console.log(`✅ Storage bucket ${ANNOUNCEMENTS_BUCKET} created successfully`);
      announcementsBucketReady = true;
    }
  } else {
    console.log(`✅ Storage bucket ${ANNOUNCEMENTS_BUCKET} already exists`);
    announcementsBucketReady = true;
  }
  
  if (logoBucketReady && profileBucketReady && announcementsBucketReady) {
    console.log('✅ All storage buckets initialized successfully');
    return true;
  } else {
    console.error('⚠️ Some buckets failed to initialize');
    return false;
  }
}

// Enable logger
app.use('*', logger(console.log));

// ✅ PHASE 4 - Priority 1: OPEN CORS Configuration (for Figma Make compatibility)
// IMPORTANT: Figma Make uses non-standard origins, so we allow ALL origins
app.use(
  "/*",
  cors({
    origin: '*', // Allow ALL origins (needed for Figma Make)
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "X-Client-Info", "apikey"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Length", "Content-Type"],
    maxAge: 86400, // 24 hours
  }),
);

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// Bucket status endpoint
app.get("/storage/status", async (c) => {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      return c.json({ 
        status: "error", 
        error: error.message,
        buckets: {
          logo: LOGO_BUCKET,
          profile: PROFILE_BUCKET
        }
      }, 500);
    }
    
    const logoBucketExists = buckets?.some(bucket => bucket.name === LOGO_BUCKET);
    const profileBucketExists = buckets?.some(bucket => bucket.name === PROFILE_BUCKET);
    const logoBucket = buckets?.find(bucket => bucket.name === LOGO_BUCKET);
    const profileBucket = buckets?.find(bucket => bucket.name === PROFILE_BUCKET);
    
    return c.json({
      status: (logoBucketExists && profileBucketExists) ? "ready" : "partial",
      buckets: {
        logo: {
          name: LOGO_BUCKET,
          exists: logoBucketExists,
          details: logoBucket || null
        },
        profile: {
          name: PROFILE_BUCKET,
          exists: profileBucketExists,
          details: profileBucket || null
        }
      },
      allBuckets: buckets?.map(b => b.name) || []
    });
  } catch (error: any) {
    return c.json({ 
      status: "error", 
      error: error.message,
      buckets: {
        logo: LOGO_BUCKET,
        profile: PROFILE_BUCKET
      }
    }, 500);
  }
});

// Logo Upload endpoint
app.post("/logo/upload", async (c) => {
  try {
    console.log('📤 Incoming logo upload request');
    
    // Ensure bucket exists before upload
    const bucketReady = await ensureBucketExists(LOGO_BUCKET);
    if (!bucketReady) {
      console.error('❌ Bucket is not ready');
      return c.json({ error: 'Storage bucket is not available. Please try again.' }, 503);
    }
    
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const organizationId = formData.get('organizationId') as string;

    console.log(`📋 Upload details - Org: ${organizationId}, File: ${file?.name}, Size: ${file?.size} bytes`);

    if (!file || !organizationId) {
      return c.json({ error: 'File and organizationId are required' }, 400);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return c.json({ error: 'Only image files are allowed' }, 400);
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: 'File size must be less than 5MB' }, 400);
    }

    // Get current organization to check for existing logo
    const { data: org } = await supabase
      .from('organizations')
      .select('logo_url')
      .eq('id', organizationId)
      .single();

    // Delete old logo if exists
    if (org?.logo_url) {
      const oldFileName = org.logo_url.split('/').pop();
      if (oldFileName) {
        await supabase.storage.from(LOGO_BUCKET).remove([oldFileName]);
        console.log(`🗑️ Deleted old logo: ${oldFileName}`);
      }
    }

    // Upload new logo
    const fileExt = file.name.split('.').pop();
    const fileName = `${organizationId}-${Date.now()}.${fileExt}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    console.log(`📤 Uploading to bucket: ${LOGO_BUCKET}, fileName: ${fileName}`);
    
    const { error: uploadError } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Upload error details:', {
        message: uploadError.message,
        name: uploadError.name,
        bucket: LOGO_BUCKET,
        fileName: fileName
      });
      return c.json({ 
        error: `Upload failed: ${uploadError.message}. Bucket: ${LOGO_BUCKET}` 
      }, 500);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(LOGO_BUCKET)
      .getPublicUrl(fileName);

    // Update organization with new logo URL
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ logo_url: publicUrl })
      .eq('id', organizationId);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      throw updateError;
    }

    console.log(`✅ Logo uploaded successfully: ${fileName}`);
    return c.json({ publicUrl });

  } catch (error: any) {
    console.error('❌ Logo upload error:', error);
    return c.json({ error: error.message || 'Failed to upload logo' }, 500);
  }
});

// Logo Delete endpoint
app.delete("/logo/:organizationId", async (c) => {
  try {
    // Ensure bucket exists before delete
    await ensureBucketExists(LOGO_BUCKET);
    
    const organizationId = c.req.param('organizationId');

    // Get organization to find logo URL
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('logo_url')
      .eq('id', organizationId)
      .single();

    if (fetchError) throw fetchError;

    if (!org?.logo_url) {
      return c.json({ error: 'No logo found' }, 404);
    }

    // Delete from storage
    const fileName = org.logo_url.split('/').pop();
    if (fileName) {
      const { error: deleteError } = await supabase.storage
        .from(LOGO_BUCKET)
        .remove([fileName]);

      if (deleteError) {
        console.error('❌ Storage delete error:', deleteError);
      } else {
        console.log(`🗑️ Deleted logo: ${fileName}`);
      }
    }

    // Update organization
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ logo_url: null })
      .eq('id', organizationId);

    if (updateError) throw updateError;

    console.log(`✅ Logo deleted successfully for org: ${organizationId}`);
    return c.json({ success: true });

  } catch (error: any) {
    console.error('❌ Logo delete error:', error);
    return c.json({ error: error.message || 'Failed to delete logo' }, 500);
  }
});

// Profile Picture Upload endpoint
app.post("/profile-picture/upload", async (c) => {
  try {
    console.log('📤 Incoming profile picture upload request');
    
    // Ensure bucket exists before upload
    const bucketReady = await ensureBucketExists(PROFILE_BUCKET);
    if (!bucketReady) {
      console.error('❌ Profile bucket is not ready');
      return c.json({ error: 'Storage bucket is not available. Please try again.' }, 503);
    }
    
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    console.log(`📋 Upload details - User: ${userId}, File: ${file?.name}, Size: ${file?.size} bytes`);

    if (!file || !userId) {
      return c.json({ error: 'File and userId are required' }, 400);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return c.json({ error: 'Only image files are allowed' }, 400);
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: 'File size must be less than 5MB' }, 400);
    }

    // Get current user to check for existing profile picture
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('profile_picture')
      .eq('id', userId)
      .single();

    // Check for missing column error
    if (fetchError && fetchError.code === 'PGRST204') {
      console.error('❌ DATABASE MIGRATION REQUIRED: profile_picture column missing');
      return c.json({ 
        error: 'DATABASE_MIGRATION_REQUIRED',
        message: 'Die Datenbank muss aktualisiert werden. Bitte führe die Migration 021_ensure_profile_picture_column.sql in Supabase aus.',
        instructions: 'Gehe zu Supabase Dashboard → SQL Editor und führe die Migration aus. Details: QUICK_FIX_GUIDE.md',
        migrationNeeded: true
      }, 500);
    }
    
    if (fetchError) {
      console.error('❌ Error fetching user:', fetchError);
      throw fetchError;
    }

    // Delete old profile picture if exists
    if (user?.profile_picture) {
      const oldFileName = user.profile_picture.split('/').pop();
      if (oldFileName) {
        await supabase.storage.from(PROFILE_BUCKET).remove([oldFileName]);
        console.log(`🗑️ Deleted old profile picture: ${oldFileName}`);
      }
    }

    // Upload new profile picture
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    console.log(`📤 Uploading to bucket: ${PROFILE_BUCKET}, fileName: ${fileName}`);
    
    const { error: uploadError } = await supabase.storage
      .from(PROFILE_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Upload error details:', {
        message: uploadError.message,
        name: uploadError.name,
        bucket: PROFILE_BUCKET,
        fileName: fileName
      });
      return c.json({ 
        error: `Upload failed: ${uploadError.message}. Bucket: ${PROFILE_BUCKET}` 
      }, 500);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(PROFILE_BUCKET)
      .getPublicUrl(fileName);

    // Update user with new profile picture URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_picture: publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      
      // Check for missing column error
      if (updateError.code === 'PGRST204') {
        console.error('❌ DATABASE MIGRATION REQUIRED: profile_picture column missing');
        return c.json({ 
          error: 'DATABASE_MIGRATION_REQUIRED',
          message: 'Die Datenbank muss aktualisiert werden. Bitte führe die Migration 021_ensure_profile_picture_column.sql in Supabase aus.',
          instructions: 'Gehe zu Supabase Dashboard → SQL Editor und führe die Migration aus. Details: QUICK_FIX_GUIDE.md',
          migrationNeeded: true
        }, 500);
      }
      
      throw updateError;
    }

    console.log(`✅ Profile picture uploaded successfully: ${fileName}`);
    return c.json({ publicUrl });

  } catch (error: any) {
    console.error('❌ Profile picture upload error:', error);
    return c.json({ error: error.message || 'Failed to upload profile picture' }, 500);
  }
});

// Profile Picture Delete endpoint
app.delete("/profile-picture/:userId", async (c) => {
  try {
    // Ensure bucket exists before delete
    await ensureBucketExists(PROFILE_BUCKET);
    
    const userId = c.req.param('userId');

    // Get user to find profile picture URL
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('profile_picture')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    if (!user?.profile_picture) {
      return c.json({ error: 'No profile picture found' }, 404);
    }

    // Delete from storage
    const fileName = user.profile_picture.split('/').pop();
    if (fileName) {
      const { error: deleteError } = await supabase.storage
        .from(PROFILE_BUCKET)
        .remove([fileName]);

      if (deleteError) {
        console.error('❌ Storage delete error:', deleteError);
      } else {
        console.log(`🗑️ Deleted profile picture: ${fileName}`);
      }
    }

    // Update user
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_picture: null })
      .eq('id', userId);

    if (updateError) throw updateError;

    console.log(`✅ Profile picture deleted successfully for user: ${userId}`);
    return c.json({ success: true });

  } catch (error: any) {
    console.error('❌ Profile picture delete error:', error);
    return c.json({ error: error.message || 'Failed to delete profile picture' }, 500);
  }
});

// ============================================
// TIME ACCOUNT SYSTEM (Phase 1 - Woche 1)
// TODO: Re-enable when timeAccountCalculation.ts is implemented
// ============================================

/*
// Calculate time account for a specific user and month
app.post("/time-account/calculate", async (c) => {
  try {
    console.log('⏰ Time Account calculation request...');
    
    const body = await c.req.json();
    const { userId, month, year } = body;

    if (!userId || !month || !year) {
      return c.json({ 
        error: 'userId, month, and year are required' 
      }, 400);
    }

    // Validate month (1-12)
    if (month < 1 || month > 12) {
      return c.json({ 
        error: 'Month must be between 1 and 12' 
      }, 400);
    }

    // Validate year
    if (year < 2020 || year > 2100) {
      return c.json({ 
        error: 'Year must be between 2020 and 2100' 
      }, 400);
    }

    const result = await calculateTimeAccount({ userId, month, year });

    if (!result) {
      return c.json({ 
        error: 'Failed to calculate time account' 
      }, 500);
    }

    return c.json({ 
      success: true, 
      timeAccount: result 
    });

  } catch (error: any) {
    console.error('❌ Time account calculation error:', error);
    return c.json({ 
      error: error.message || 'Failed to calculate time account',
      details: error.details || error.hint || 'No additional details'
    }, 500);
  }
});

// Calculate time accounts for all users (Batch processing)
app.post("/time-account/calculate-all", async (c) => {
  try {
    console.log('⏰ Batch time account calculation request...');
    
    const body = await c.req.json();
    const { month, year } = body;

    if (!month || !year) {
      return c.json({ 
        error: 'month and year are required' 
      }, 400);
    }

    await calculateTimeAccountsForAllUsers(month, year);

    return c.json({ 
      success: true,
      message: `Time accounts calculated for all users for ${month}/${year}` 
    });

  } catch (error: any) {
    console.error('❌ Batch time account calculation error:', error);
    return c.json({ 
      error: error.message || 'Failed to calculate time accounts',
      details: error.details || error.hint || 'No additional details'
    }, 500);
  }
});
*/

// Get time account for a user
app.get("/time-account/:userId/:month/:year", async (c) => {
  try {
    const userId = c.req.param('userId');
    const month = parseInt(c.req.param('month'));
    const year = parseInt(c.req.param('year'));

    const { data, error } = await supabase
      .from('time_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .single();

    if (error) {
      return c.json({ error: error.message }, 404);
    }

    return c.json({ timeAccount: data });

  } catch (error: any) {
    console.error('❌ Get time account error:', error);
    return c.json({ 
      error: error.message || 'Failed to get time account'
    }, 500);
  }
});

// ============================================
// USER MANAGEMENT
// ============================================

// Create User endpoint (Admin only)
app.post("/users/create", async (c) => {
  try {
    console.log('👤 Creating new user...');
    
    // Get request body
    const body = await c.req.json();
    const { email, password, userData } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Create auth user with admin API
    // Note: This will trigger the handle_new_user() function which auto-creates:
    // - User profile in users table
    // - Avatar in user_avatars table
    // - Welcome notification
    // - Welcome coins
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: userData?.first_name || '',
        last_name: userData?.last_name || '',
      }
    });

    if (authError) {
      console.error('❌ Auth creation error:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create auth user - no user returned');
    }

    const userId = authData.user.id;
    console.log(`✅ Auth user created: ${userId}`);

    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update the user profile with additional data
    // (The trigger already created it with basic info)
    const { data: profileData, error: updateError } = await supabase
      .from('users')
      .update({
        // Update with all provided userData fields
        ...userData,
        email: email, // Ensure email matches
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Profile update error:', updateError);
      throw updateError;
    }

    console.log(`✅ User profile updated: ${userId}`);
    
    // 🔔 TRIGGER WORKFLOWS: EMPLOYEE_CREATED
    // This will automatically start any onboarding workflows configured for this organization
    console.log(`🔔 Triggering EMPLOYEE_CREATED workflows for user ${userId}...`);
    
    try {
      // Get auth header to pass to trigger function
      const authHeader = c.req.header('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
      
      await triggerWorkflows(
        TRIGGER_TYPES.EMPLOYEE_CREATED,
        {
          userId: profileData.id,
          employeeId: profileData.id,
          employeeName: `${profileData.first_name} ${profileData.last_name}`,
          employeeEmail: profileData.email,
          department: profileData.department || 'Unbekannt',
          organizationId: profileData.organization_id,
        },
        authHeader
      );
      
      console.log(`✅ Workflows triggered successfully for ${profileData.email}`);
    } catch (triggerError) {
      // Don't fail the user creation if workflow triggering fails
      console.error('⚠️ Failed to trigger workflows (non-fatal):', triggerError);
    }

    return c.json({ 
      success: true, 
      user: profileData,
      message: 'User created successfully'
    });

  } catch (error: any) {
    console.error('❌ User creation error:', error);
    return c.json({ 
      error: error.message || 'Failed to create user',
      details: error.details || error.hint || 'No additional details'
    }, 500);
  }
});

/**
 * =================================
 * STORAGE PROXY ENDPOINTS (Phase 1)
 * =================================
 * All Storage operations go through BFF
 */

const DOCUMENTS_BUCKET = 'make-f659121d-documents';

// Upload document
app.post('/documents/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;
    const userId = formData.get('userId') as string | null;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    if (!path) {
      return c.json({ error: 'No path provided' }, 400);
    }

    console.log(`📤 Uploading document: ${path}`);

    // Ensure documents bucket exists
    await ensureBucketExists(DOCUMENTS_BUCKET);

    // Upload file
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error('❌ Upload error:', error);
      return c.json({ error: error.message }, 500);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(path);

    console.log(`✅ Document uploaded: ${publicUrl}`);

    return c.json({ 
      success: true,
      path: data.path,
      publicUrl,
    });
  } catch (error: any) {
    console.error('❌ Document upload error:', error);
    return c.json({ error: error.message || 'Upload failed' }, 500);
  }
});

// Delete documents
app.delete('/documents', async (c) => {
  try {
    const { bucket, paths } = await c.req.json();

    if (!bucket || !paths || !Array.isArray(paths)) {
      return c.json({ error: 'Invalid request: bucket and paths[] required' }, 400);
    }

    console.log(`🗑️ Deleting ${paths.length} files from ${bucket}`);

    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      console.error('❌ Delete error:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log(`✅ Deleted ${paths.length} files`);

    return c.json({ success: true, deletedCount: paths.length });
  } catch (error: any) {
    console.error('❌ Document delete error:', error);
    return c.json({ error: error.message || 'Delete failed' }, 500);
  }
});

// Get signed URL
app.get('/storage/sign', async (c) => {
  try {
    const bucket = c.req.query('bucket');
    const path = c.req.query('path');
    const expiresIn = Number(c.req.query('expiresIn')) || 3600; // Default 1 hour

    if (!bucket || !path) {
      return c.json({ error: 'bucket and path query params required' }, 400);
    }

    console.log(`🔑 Creating signed URL for ${bucket}/${path}`);

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('❌ Signed URL error:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log(`✅ Signed URL created`);

    return c.json({ 
      success: true,
      signedUrl: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Signed URL error:', error);
    return c.json({ error: error.message || 'Failed to create signed URL' }, 500);
  }
});

// ============================================
// TEST SUBMISSIONS & REVIEW API
// ============================================
app.route('/tests', testSubmissionsApp);

// ============================================
// WORKFLOW SYSTEM
// ============================================

// Save Workflow
app.post("/workflows", async (c) => {
  try {
    const body = await c.req.json();
    const { id, ...workflowData } = body;
    
    if (!id) return c.json({ error: 'ID required' }, 400);
    
    console.log(`💾 Saving workflow: ${id}`);
    await kv.set(`workflow:${id}`, { id, ...workflowData });
    return c.json({ success: true });
  } catch (e: any) {
    console.error('❌ Save workflow error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// Get All Workflows
app.get("/workflows", async (c) => {
  try {
    const workflows = await kv.getByPrefix("workflow:");
    return c.json({ workflows });
  } catch (e: any) {
    console.error('❌ Get workflows error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// Get Single Workflow
app.get("/workflows/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const workflow = await kv.get(`workflow:${id}`);
    if (!workflow) return c.json({ error: 'Not found' }, 404);
    return c.json({ workflow });
  } catch (e: any) {
    console.error('❌ Get workflow error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// Delete Workflow
app.delete("/workflows/:id", async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`workflow:${id}`);
    return c.json({ success: true });
  } catch (e: any) {
    console.error('❌ Delete workflow error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// Execute Workflow (Skeleton Engine)
app.post("/workflows/execute", async (c) => {
   try {
     const { workflowId, context } = await c.req.json();
     console.log(`🚀 Executing Workflow Request: ${workflowId}`);
     
     const workflow = await kv.get(`workflow:${workflowId}`);
     
     if (!workflow) {
       return c.json({ error: 'Workflow not found' }, 404);
     }

     // Run the Engine
     const result = await executeWorkflowGraph(workflow, context || {});
     
     // Log execution
     const executionId = `exec_${Date.now()}`;
     await kv.set(`execution:${executionId}`, {
       id: executionId,
       workflowId,
       status: 'COMPLETED',
       startTime: new Date().toISOString(),
       endTime: new Date().toISOString(),
       logs: result.logs,
       context
     });

     return c.json({ 
       success: true, 
       message: 'Workflow execution completed',
       executionId,
       logs: result.logs
     });
   } catch (e: any) {
     console.error('❌ Execution error:', e);
     return c.json({ error: e.message }, 500);
   }
});

// Trigger Workflows
app.post("/workflows/trigger", async (c) => {
  try {
    const { triggerType, context } = await c.req.json();
    console.log(`🚀 Triggering Workflows: ${triggerType}`);
    
    if (!triggerType || !Object.values(TRIGGER_TYPES).includes(triggerType)) {
      return c.json({ error: 'Invalid trigger type' }, 400);
    }

    // Note: triggerWorkflows expects authToken, but we don't need it here for the /trigger route
    // We'll pass an empty string or fetch it from headers if needed
    const authHeader = c.req.header('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
    await triggerWorkflows(triggerType, context || {}, authHeader);
    
    return c.json({ 
      success: true, 
      message: 'Workflows triggered successfully',
    });
  } catch (e: any) {
    console.error('❌ Trigger error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// ============================================
// IT EQUIPMENT SYSTEM (KV Store Backed)
// ============================================

app.post("/it-equipment", async (c) => {
  try {
    const body = await c.req.json();
    const { id, ...data } = body;
    if (!id) return c.json({ error: 'ID required' }, 400);
    
    await kv.set(`it_equipment:${id}`, { id, ...data });
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.get("/it-equipment", async (c) => {
  try {
    const items = await kv.getByPrefix("it_equipment:");
    return c.json({ items });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.delete("/it-equipment/:id", async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`it_equipment:${id}`);
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Initialize server after ensuring buckets exist
(async () => {
  console.log('🚀 Starting server...');
  await initializeAllBuckets();
  await ensureBucketExists(DOCUMENTS_BUCKET); // Ensure documents bucket exists
  console.log('✅ Server initialization complete');
  Deno.serve(app.fetch);
})();