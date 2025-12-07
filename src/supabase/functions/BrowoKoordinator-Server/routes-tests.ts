// File: supabase/functions/BrowoKoordinator-Server/routes-tests.ts
import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import { PermissionKey } from "./permissions.ts";
import { ForbiddenError } from "./errors.ts";

export const testSubmissionsApp = new Hono();

const testSubmissionsSupabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const SUBMISSIONS_BUCKET = "make-f659121d-submissions";

async function ensureSubmissionsBucketExists() {
  try {
    const { data: buckets } =
      await testSubmissionsSupabase.storage.listBuckets();
    const bucketExists = buckets?.some(
      (bucket) => bucket.name === SUBMISSIONS_BUCKET,
    );

    if (!bucketExists) {
      console.log(
        `📦 Creating storage bucket: ${SUBMISSIONS_BUCKET}`,
      );
      const { error } =
        await testSubmissionsSupabase.storage.createBucket(
          SUBMISSIONS_BUCKET,
          {
            public: false,
            fileSizeLimit: 52428800,
          },
        );

      if (error) {
        console.error(
          `❌ Error creating bucket ${SUBMISSIONS_BUCKET}:`,
          error,
        );
        return false;
      }
      console.log(
        `✅ Storage bucket ${SUBMISSIONS_BUCKET} created`,
      );
    }
    return true;
  } catch (error) {
    console.error(
      `❌ Error ensuring submissions bucket:`,
      error,
    );
    return false;
  }
}

ensureSubmissionsBucketExists();

function calculateAutoScore(
  autoAnswers: Record<string, any>,
  testBlocks: any[],
): { score: number; maxScore: number; percentage: number } {
  let score = 0;
  let maxScore = 0;

  for (const block of testBlocks) {
    const autoBlockTypes = [
      "MULTIPLE_CHOICE",
      "MULTIPLE_SELECT",
      "TRUE_FALSE",
      "SHORT_TEXT",
    ];

    if (!autoBlockTypes.includes(block.type)) continue;

    maxScore += block.points || 10;

    const userAnswer = autoAnswers[block.id];
    const correctAnswer = block.content?.correctAnswer;

    if (!userAnswer || !correctAnswer) continue;

    let isCorrect = false;

    if (
      block.type === "MULTIPLE_CHOICE" ||
      block.type === "TRUE_FALSE"
    ) {
      isCorrect = userAnswer === correctAnswer;
    } else if (block.type === "MULTIPLE_SELECT") {
      const userSet = new Set(userAnswer);
      const correctSet = new Set(correctAnswer);
      isCorrect =
        userSet.size === correctSet.size &&
        [...userSet].every((x) => correctSet.has(x));
    } else if (block.type === "SHORT_TEXT") {
      isCorrect =
        userAnswer.toLowerCase().trim() ===
        correctAnswer.toLowerCase().trim();
    }

    if (isCorrect) {
      score += block.points || 10;
    }
  }

  const percentage =
    maxScore > 0 ? (score / maxScore) * 100 : 0;

  return { score, maxScore, percentage };
}

function calculateFinalScore(
  autoPercentage: number,
  practicalPassed: boolean,
  test: any,
): {
  finalScore: number;
  finalPercentage: number;
  passed: boolean;
} {
  const autoWeight = 0.6;
  const practicalWeight = 0.4;

  const practicalScore = practicalPassed ? 100 : 0;
  const finalPercentage =
    autoPercentage * autoWeight +
    practicalScore * practicalWeight;
  const passPercentage = test.pass_percentage || 80;

  return {
    finalScore: Math.round(finalPercentage),
    finalPercentage: Math.round(finalPercentage),
    passed: finalPercentage >= passPercentage,
  };
}

// GET /submissions
testSubmissionsApp.get("/submissions", async (c) => {
  const auth = c.get("auth");

  // Check permission to view courses/tests
  if (!auth.hasPermission(PermissionKey.VIEW_COURSES) && !auth.isAdmin) {
    throw new ForbiddenError("Missing permission to view test submissions");
  }

  const status = c.req.query("status");
  const userId = c.req.query("userId");
  const testId = c.req.query("testId");

  let query = testSubmissionsSupabase
    .from("test_submissions")
    .select(
      `
        *,
        test:tests!inner(id, title, pass_percentage),
        user:users!test_submissions_user_id_fkey(id, first_name, last_name, email),
        reviewer:users!test_submissions_reviewer_id_fkey(id, first_name, last_name)
      `,
    )
    .order("created_at", { ascending: false });

  // Non-admins can only see their own submissions
  if (!auth.isAdmin) {
    query = query.eq("user_id", auth.user.id);
  } else {
    // Admins can filter by user
    if (userId) query = query.eq("user_id", userId);
  }

  if (status) query = query.eq("status", status);
  if (testId) query = query.eq("test_id", testId);

  const { data, error } = await query;

  if (error) throw error;

  return c.json({ success: true, data });
});

// GET /submissions/:id
testSubmissionsApp.get("/submissions/:id", async (c) => {
  const auth = c.get("auth");
  const id = c.req.param("id");

  const { data: submission, error } =
    await testSubmissionsSupabase
      .from("test_submissions")
      .select(
        `
        *,
        test:tests!inner(*),
        user:users!test_submissions_user_id_fkey(id, first_name, last_name, email),
        reviewer:users!test_submissions_reviewer_id_fkey(id, first_name, last_name)
      `,
      )
      .eq("id", id)
      .single();

  if (error) throw error;

  // Users can only view their own submissions (unless admin)
  if (submission.user_id !== auth.user.id && !auth.isAdmin) {
    throw new ForbiddenError("Cannot view other users' submissions");
  }

  const { data: blocks } = await testSubmissionsSupabase
    .from("test_blocks")
    .select("*")
    .eq("test_id", submission.test_id)
    .order("position");

  const { data: comments } = await testSubmissionsSupabase
    .from("review_comments")
    .select("*")
    .eq("submission_id", id)
    .order("created_at");

  return c.json({
    success: true,
    data: {
      ...submission,
      blocks: blocks || [],
      comments: comments || [],
    },
  });
});

// POST /submissions
testSubmissionsApp.post("/submissions", async (c) => {
  const auth = c.get("auth");

  // Check permission to take quizzes
  if (!auth.hasPermission(PermissionKey.TAKE_QUIZZES)) {
    throw new ForbiddenError("Missing permission to create test submissions");
  }

  const body = await c.req.json();
  const { testId, userId, videoId } = body;

  // Users can only create submissions for themselves
  if (userId !== auth.user.id) {
    throw new ForbiddenError("Cannot create submissions for other users");
  }

  const { data: existing } = await testSubmissionsSupabase
    .from("test_submissions")
    .select("id")
    .eq("test_id", testId)
    .eq("user_id", userId)
    .eq("status", "DRAFT")
    .maybeSingle();

  if (existing) {
    return c.json({
      success: true,
      data: existing,
      message: "Draft already exists",
    });
  }

  const { data: attempts } = await testSubmissionsSupabase
    .from("test_submissions")
    .select("attempt_number")
    .eq("test_id", testId)
    .eq("user_id", userId)
    .order("attempt_number", { ascending: false })
    .limit(1);

  const attemptNumber =
    (attempts?.[0]?.attempt_number || 0) + 1;

  if (attemptNumber > 3) {
    throw new Error("Maximale Anzahl an Versuchen erreicht (3)");
  }

  const { data, error } = await testSubmissionsSupabase
    .from("test_submissions")
    .insert({
      test_id: testId,
      user_id: userId,
      video_id: videoId,
      status: "DRAFT",
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
});

// PATCH /submissions/:id
testSubmissionsApp.patch("/submissions/:id", async (c) => {
  const auth = c.get("auth");
  const id = c.req.param("id");

  // Check ownership
  const { data: submission } = await testSubmissionsSupabase
    .from("test_submissions")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!submission) {
    throw new Error("Submission not found");
  }

  // Users can only update their own submissions
  if (submission.user_id !== auth.user.id && !auth.isAdmin) {
    throw new ForbiddenError("Cannot update other users' submissions");
  }

  const body = await c.req.json();
  const { autoAnswers, practicalSubmissions, status } = body;

  const updates: any = {
    updated_at: new Date().toISOString(),
  };

  if (autoAnswers) updates.auto_answers = autoAnswers;
  if (practicalSubmissions)
    updates.practical_submissions = practicalSubmissions;
  if (status) updates.status = status;

  const { data, error } = await testSubmissionsSupabase
    .from("test_submissions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return c.json({ success: true, data });
});

// POST /submissions/:id/submit
testSubmissionsApp.post(
  "/submissions/:id/submit",
  async (c) => {
    const auth = c.get("auth");
    const id = c.req.param("id");

    // Check ownership
    const { data: submission, error: subError } =
      await testSubmissionsSupabase
        .from("test_submissions")
        .select("*, test:tests!inner(*)")
        .eq("id", id)
        .single();

    if (subError) throw subError;

    // Users can only submit their own submissions
    if (submission.user_id !== auth.user.id && !auth.isAdmin) {
      throw new ForbiddenError("Cannot submit other users' submissions");
    }

    const body = await c.req.json();
    const { autoAnswers, practicalSubmissions } = body;

    const { data: blocks, error: blocksError } =
      await testSubmissionsSupabase
        .from("test_blocks")
        .select("*")
        .eq("test_id", submission.test_id);

    if (blocksError) throw blocksError;

    const autoScoreData = calculateAutoScore(
      autoAnswers,
      blocks || [],
    );

    const hasPracticalBlocks = blocks?.some(
      (b) => b.type === "FILE_UPLOAD" || b.type === "VIDEO",
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
      updates.status = "PENDING_REVIEW";
    } else {
      const finalScoreData = calculateFinalScore(
        autoScoreData.percentage,
        true,
        submission.test,
      );
      updates.status = finalScoreData.passed
        ? "APPROVED"
        : "FAILED";
      updates.final_score = finalScoreData.finalScore;
      updates.final_percentage =
        finalScoreData.finalPercentage;
      updates.passed = finalScoreData.passed;
    }

    const { data, error } = await testSubmissionsSupabase
      .from("test_submissions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return c.json({ success: true, data });
  },
);

// POST /submissions/:id/review
testSubmissionsApp.post(
  "/submissions/:id/review",
  async (c) => {
    const auth = c.get("auth");
    const id = c.req.param("id");

    // Check permission to edit courses (reviewers need this)
    if (!auth.hasPermission(PermissionKey.EDIT_COURSES) && !auth.isAdmin) {
      throw new ForbiddenError("Missing permission to review test submissions");
    }

    const body = await c.req.json();
    const { reviewerId, decision, reason, stars, comments } =
      body;

    // Ensure reviewer is the authenticated user
    if (reviewerId !== auth.user.id) {
      throw new ForbiddenError("Cannot review on behalf of other users");
    }

    if (
      !["approve", "needs_revision", "fail"].includes(
        decision,
      )
    ) {
      throw new Error("Invalid decision");
    }

    if (!reason || reason.length < 20) {
      throw new Error("Begründung muss mindestens 20 Zeichen lang sein");
    }

    const { data: submission, error: subError } =
      await testSubmissionsSupabase
        .from("test_submissions")
        .select("*, test:tests!inner(*)")
        .eq("id", id)
        .single();

    if (subError) throw subError;

    const practicalPassed = decision === "approve";
    const finalScoreData = calculateFinalScore(
      submission.auto_percentage,
      practicalPassed,
      submission.test,
    );

    let newStatus = "PENDING_REVIEW";
    if (decision === "approve") {
      newStatus = finalScoreData.passed
        ? "APPROVED"
        : "FAILED";
    } else if (decision === "needs_revision") {
      newStatus = "NEEDS_REVISION";
    } else if (decision === "fail") {
      newStatus = "FAILED";
    }

    const { data, error } = await testSubmissionsSupabase
      .from("test_submissions")
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
      .eq("id", id)
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

      await testSubmissionsSupabase
        .from("review_comments")
        .insert(commentInserts);
    }

    return c.json({ success: true, data });
  },
);

// POST /upload-submission-file
testSubmissionsApp.post(
  "/upload-submission-file",
  async (c) => {
    const auth = c.get("auth");

    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const submissionId = formData.get(
      "submissionId",
    ) as string;
    const blockId = formData.get("blockId") as string;

    if (!file || !submissionId || !blockId) {
      throw new Error("Missing required fields");
    }

    // Verify ownership of submission
    const { data: submission } = await testSubmissionsSupabase
      .from("test_submissions")
      .select("user_id")
      .eq("id", submissionId)
      .single();

    if (!submission) {
      throw new Error("Submission not found");
    }

    // Users can only upload files to their own submissions
    if (submission.user_id !== auth.user.id && !auth.isAdmin) {
      throw new ForbiddenError("Cannot upload files to other users' submissions");
    }

    const timestamp = Date.now();
    const ext = file.name.split(".").pop();
    const fileName = `${submissionId}/${blockId}-${timestamp}.${ext}`;

    const fileBuffer = await file.arrayBuffer();
    const { data, error } =
      await testSubmissionsSupabase.storage
        .from(SUBMISSIONS_BUCKET)
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

    if (error) throw error;

    const { data: signedUrlData } =
      await testSubmissionsSupabase.storage
        .from(SUBMISSIONS_BUCKET)
        .createSignedUrl(fileName, 604800);

    return c.json({
      success: true,
      data: {
        fileUrl: signedUrlData?.signedUrl,
        fileName: file.name,
        fileSize: file.size,
        filePath: fileName,
      },
    });
  },
);

// DELETE /submissions/:id
testSubmissionsApp.delete("/submissions/:id", async (c) => {
  const auth = c.get("auth");
  const id = c.req.param("id");

  const { data: submission } = await testSubmissionsSupabase
    .from("test_submissions")
    .select("user_id, status")
    .eq("id", id)
    .single();

  if (!submission) {
    throw new Error("Submission not found");
  }

  // Users can only delete their own submissions
  if (submission.user_id !== auth.user.id && !auth.isAdmin) {
    throw new ForbiddenError("Cannot delete other users' submissions");
  }

  if (submission.status !== "DRAFT") {
    throw new Error("Nur Entwürfe können gelöscht werden");
  }

  const { error } = await testSubmissionsSupabase
    .from("test_submissions")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return c.json({ success: true });
});