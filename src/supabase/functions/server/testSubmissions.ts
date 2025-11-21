/**
 * TEST SUBMISSIONS & REVIEW API
 * ==============================
 * Handles test submissions, file uploads, and review workflow
 */

import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";

export const testSubmissionsApp = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Storage bucket for test submissions
const SUBMISSIONS_BUCKET = 'make-f659121d-submissions';

/**
 * Ensure submissions bucket exists
 */
async function ensureSubmissionsBucketExists() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === SUBMISSIONS_BUCKET);
    
    if (!bucketExists) {
      console.log(`📦 Creating storage bucket: ${SUBMISSIONS_BUCKET}`);
      const { error } = await supabase.storage.createBucket(SUBMISSIONS_BUCKET, {
        public: false, // Private - use signed URLs
        fileSizeLimit: 52428800, // 50MB for videos
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

// Initialize bucket on startup
ensureSubmissionsBucketExists();

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Calculate auto score from answers
 */
function calculateAutoScore(
  autoAnswers: Record<string, any>,
  testBlocks: any[]
): { score: number; maxScore: number; percentage: number } {
  let score = 0;
  let maxScore = 0;

  for (const block of testBlocks) {
    // Only score automatic blocks
    const autoBlockTypes = [
      'MULTIPLE_CHOICE',
      'MULTIPLE_SELECT', 
      'TRUE_FALSE',
      'SHORT_TEXT'
    ];
    
    if (!autoBlockTypes.includes(block.type)) continue;
    
    maxScore += block.points || 10;
    
    const userAnswer = autoAnswers[block.id];
    const correctAnswer = block.content?.correctAnswer;
    
    if (!userAnswer || !correctAnswer) continue;
    
    // Check if answer is correct
    let isCorrect = false;
    
    if (block.type === 'MULTIPLE_CHOICE' || block.type === 'TRUE_FALSE') {
      isCorrect = userAnswer === correctAnswer;
    } else if (block.type === 'MULTIPLE_SELECT') {
      // Must select ALL correct options
      const userSet = new Set(userAnswer);
      const correctSet = new Set(correctAnswer);
      isCorrect = userSet.size === correctSet.size && 
                  [...userSet].every(x => correctSet.has(x));
    } else if (block.type === 'SHORT_TEXT') {
      // Case-insensitive comparison
      isCorrect = userAnswer.toLowerCase().trim() === 
                  correctAnswer.toLowerCase().trim();
    }
    
    if (isCorrect) {
      score += block.points || 10;
    }
  }

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  
  return { score, maxScore, percentage };
}

/**
 * Calculate final score (weighted auto + practical)
 */
function calculateFinalScore(
  autoPercentage: number,
  practicalPassed: boolean,
  test: any
): { finalScore: number; finalPercentage: number; passed: boolean } {
  // Default: 60% auto, 40% practical
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

// ========================================
// API ENDPOINTS
// ========================================

/**
 * GET /submissions
 * Get all submissions (with filters)
 */
testSubmissionsApp.get('/submissions', async (c) => {
  try {
    const status = c.req.query('status'); // PENDING_REVIEW, APPROVED, etc.
    const userId = c.req.query('userId');
    const testId = c.req.query('testId');
    
    let query = supabase
      .from('test_submissions')
      .select(`
        *,
        test:tests!inner(
          id,
          title,
          pass_percentage
        ),
        user:users!test_submissions_user_id_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        reviewer:users!test_submissions_reviewer_id_fkey(
          id,
          first_name,
          last_name
        )
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
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

/**
 * GET /submissions/:id
 * Get single submission with comments
 */
testSubmissionsApp.get('/submissions/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const { data: submission, error } = await supabase
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
    
    // Get test blocks
    const { data: blocks } = await supabase
      .from('test_blocks')
      .select('*')
      .eq('test_id', submission.test_id)
      .order('position');
    
    // Get review comments
    const { data: comments } = await supabase
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
    return c.json({ 
      success: false, 
      error: error.message 
    }, 404);
  }
});

/**
 * POST /submissions
 * Create new submission (auto-save draft)
 */
testSubmissionsApp.post('/submissions', async (c) => {
  try {
    const body = await c.req.json();
    const { testId, userId, videoId } = body;
    
    // Check if user already has a DRAFT submission for this test
    const { data: existing } = await supabase
      .from('test_submissions')
      .select('id')
      .eq('test_id', testId)
      .eq('user_id', userId)
      .eq('status', 'DRAFT')
      .maybeSingle();
    
    if (existing) {
      return c.json({ 
        success: true, 
        data: existing,
        message: 'Draft already exists' 
      });
    }
    
    // Get current attempt number
    const { data: attempts } = await supabase
      .from('test_submissions')
      .select('attempt_number')
      .eq('test_id', testId)
      .eq('user_id', userId)
      .order('attempt_number', { ascending: false })
      .limit(1);
    
    const attemptNumber = (attempts?.[0]?.attempt_number || 0) + 1;
    
    if (attemptNumber > 3) {
      return c.json({ 
        success: false, 
        error: 'Maximale Anzahl an Versuchen erreicht (3)' 
      }, 400);
    }
    
    const { data, error } = await supabase
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
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

/**
 * PATCH /submissions/:id
 * Update submission (auto-save answers)
 */
testSubmissionsApp.patch('/submissions/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { autoAnswers, practicalSubmissions, status } = body;
    
    const updates: any = { updated_at: new Date().toISOString() };
    
    if (autoAnswers) updates.auto_answers = autoAnswers;
    if (practicalSubmissions) updates.practical_submissions = practicalSubmissions;
    if (status) updates.status = status;
    
    const { data, error } = await supabase
      .from('test_submissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ Error updating submission:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

/**
 * POST /submissions/:id/submit
 * Submit for review (calculate auto-score)
 */
testSubmissionsApp.post('/submissions/:id/submit', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { autoAnswers, practicalSubmissions } = body;
    
    // Get submission
    const { data: submission, error: subError } = await supabase
      .from('test_submissions')
      .select('*, test:tests!inner(*)')
      .eq('id', id)
      .single();
    
    if (subError) throw subError;
    
    // Get test blocks
    const { data: blocks, error: blocksError } = await supabase
      .from('test_blocks')
      .select('*')
      .eq('test_id', submission.test_id);
    
    if (blocksError) throw blocksError;
    
    // Calculate auto score
    const autoScoreData = calculateAutoScore(autoAnswers, blocks || []);
    
    // Check if there are practical blocks
    const hasPracticalBlocks = blocks?.some(b => 
      b.type === 'FILE_UPLOAD' || b.type === 'VIDEO'
    );
    
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
      // Needs review
      updates.status = 'PENDING_REVIEW';
    } else {
      // Only auto questions - can be scored immediately
      const finalScoreData = calculateFinalScore(
        autoScoreData.percentage,
        true, // No practical blocks
        submission.test
      );
      
      updates.status = finalScoreData.passed ? 'APPROVED' : 'FAILED';
      updates.final_score = finalScoreData.finalScore;
      updates.final_percentage = finalScoreData.finalPercentage;
      updates.passed = finalScoreData.passed;
    }
    
    const { data, error } = await supabase
      .from('test_submissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ Error submitting for review:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

/**
 * POST /submissions/:id/review
 * Submit review decision (Admin/Trainer only)
 */
testSubmissionsApp.post('/submissions/:id/review', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { reviewerId, decision, reason, stars, comments } = body;
    
    // Validate decision
    if (!['approve', 'needs_revision', 'fail'].includes(decision)) {
      return c.json({ 
        success: false, 
        error: 'Invalid decision' 
      }, 400);
    }
    
    // Validate reason length
    if (!reason || reason.length < 20) {
      return c.json({ 
        success: false, 
        error: 'Begründung muss mindestens 20 Zeichen lang sein' 
      }, 400);
    }
    
    // Get submission
    const { data: submission, error: subError } = await supabase
      .from('test_submissions')
      .select('*, test:tests!inner(*)')
      .eq('id', id)
      .single();
    
    if (subError) throw subError;
    
    // Calculate final score
    const practicalPassed = decision === 'approve';
    const finalScoreData = calculateFinalScore(
      submission.auto_percentage,
      practicalPassed,
      submission.test
    );
    
    // Determine new status
    let newStatus = 'PENDING_REVIEW';
    if (decision === 'approve') {
      newStatus = finalScoreData.passed ? 'APPROVED' : 'FAILED';
    } else if (decision === 'needs_revision') {
      newStatus = 'NEEDS_REVISION';
    } else if (decision === 'fail') {
      newStatus = 'FAILED';
    }
    
    // Update submission
    const { data, error } = await supabase
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
    
    // Save comments if provided
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
      
      await supabase
        .from('review_comments')
        .insert(commentInserts);
    }
    
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ Error reviewing submission:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

/**
 * POST /upload-submission-file
 * Upload file for practical task
 */
testSubmissionsApp.post('/upload-submission-file', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const submissionId = formData.get('submissionId') as string;
    const blockId = formData.get('blockId') as string;
    
    if (!file || !submissionId || !blockId) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, 400);
    }
    
    // Generate file path
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const fileName = `${submissionId}/${blockId}-${timestamp}.${ext}`;
    
    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data, error } = await supabase.storage
      .from(SUBMISSIONS_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });
    
    if (error) throw error;
    
    // Get signed URL (expires in 7 days)
    const { data: signedUrlData } = await supabase.storage
      .from(SUBMISSIONS_BUCKET)
      .createSignedUrl(fileName, 604800); // 7 days
    
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
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

/**
 * DELETE /submissions/:id
 * Delete submission (only drafts)
 */
testSubmissionsApp.delete('/submissions/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    // Only allow deleting DRAFT submissions
    const { data: submission } = await supabase
      .from('test_submissions')
      .select('status')
      .eq('id', id)
      .single();
    
    if (submission?.status !== 'DRAFT') {
      return c.json({ 
        success: false, 
        error: 'Nur Entwürfe können gelöscht werden' 
      }, 400);
    }
    
    const { error } = await supabase
      .from('test_submissions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error deleting submission:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});