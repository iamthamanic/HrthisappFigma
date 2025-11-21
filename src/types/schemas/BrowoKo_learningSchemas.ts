/**
 * LEARNING SCHEMAS
 * ================
 * Zod schemas for learning-related types
 * Provides runtime validation for videos, quizzes, and progress
 */

import { z } from 'zod';

/**
 * VIDEO SCHEMA
 */
export const VideoSchema = z.object({
  id: z.string().uuid('Video ID muss eine gültige UUID sein'),
  title: z.string().min(1, 'Titel ist erforderlich').max(300, 'Titel zu lang'),
  description: z.string().max(2000, 'Beschreibung zu lang').nullable().optional(),
  youtube_url: z.string().url('Ungültige YouTube URL'),
  duration_minutes: z.number().int().min(1, 'Dauer muss mindestens 1 Minute sein').max(1440).nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  xp_reward: z.number().int().min(0).default(10),
  coin_reward: z.number().int().min(0).default(5),
  organization_id: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Video = z.infer<typeof VideoSchema>;

/**
 * CREATE VIDEO SCHEMA
 */
export const CreateVideoSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(300),
  description: z.string().max(2000).optional(),
  youtube_url: z.string().url('Ungültige YouTube URL'),
  duration_minutes: z.number().int().min(1).max(1440).optional(),
  thumbnail_url: z.string().url().optional(),
  category: z.string().max(100).optional(),
  xp_reward: z.number().int().min(0).default(10).optional(),
  coin_reward: z.number().int().min(0).default(5).optional(),
  organization_id: z.string().uuid().optional(),
});

export type CreateVideoData = z.infer<typeof CreateVideoSchema>;

/**
 * UPDATE VIDEO SCHEMA
 */
export const UpdateVideoSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional(),
  youtube_url: z.string().url().optional(),
  duration_minutes: z.number().int().min(1).max(1440).optional(),
  thumbnail_url: z.string().url().optional(),
  category: z.string().max(100).optional(),
  xp_reward: z.number().int().min(0).optional(),
  coin_reward: z.number().int().min(0).optional(),
});

export type UpdateVideoData = z.infer<typeof UpdateVideoSchema>;

/**
 * QUIZ SCHEMA
 */
export const QuizQuestionSchema = z.object({
  question: z.string().min(1, 'Frage ist erforderlich'),
  options: z.array(z.string()).min(2, 'Mindestens 2 Antwortmöglichkeiten erforderlich'),
  correct_answer: z.number().int().min(0),
  explanation: z.string().optional(),
});

export const QuizSchema = z.object({
  id: z.string().uuid('Quiz ID muss eine gültige UUID sein'),
  video_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'Titel ist erforderlich').max(300),
  description: z.string().max(2000).nullable().optional(),
  questions: z.array(QuizQuestionSchema).min(1, 'Mindestens eine Frage erforderlich'),
  passing_score: z.number().int().min(0).max(100).default(70),
  xp_reward: z.number().int().min(0).default(20),
  coin_reward: z.number().int().min(0).default(10),
  organization_id: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Quiz = z.infer<typeof QuizSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

/**
 * CREATE QUIZ SCHEMA
 */
export const CreateQuizSchema = z.object({
  video_id: z.string().uuid().optional(),
  title: z.string().min(1, 'Titel ist erforderlich').max(300),
  description: z.string().max(2000).optional(),
  questions: z.array(QuizQuestionSchema).min(1, 'Mindestens eine Frage erforderlich'),
  passing_score: z.number().int().min(0).max(100).default(70).optional(),
  xp_reward: z.number().int().min(0).default(20).optional(),
  coin_reward: z.number().int().min(0).default(10).optional(),
  organization_id: z.string().uuid().optional(),
});

export type CreateQuizData = z.infer<typeof CreateQuizSchema>;

/**
 * UPDATE QUIZ SCHEMA
 */
export const UpdateQuizSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional(),
  questions: z.array(QuizQuestionSchema).min(1).optional(),
  passing_score: z.number().int().min(0).max(100).optional(),
  xp_reward: z.number().int().min(0).optional(),
  coin_reward: z.number().int().min(0).optional(),
});

export type UpdateQuizData = z.infer<typeof UpdateQuizSchema>;

/**
 * QUIZ ATTEMPT SCHEMA
 */
export const QuizAttemptSchema = z.object({
  id: z.string().uuid().optional(),
  quiz_id: z.string().uuid('Quiz ID muss eine gültige UUID sein'),
  user_id: z.string().uuid('User ID muss eine gültige UUID sein'),
  score: z.number().int().min(0).max(100),
  answers: z.array(z.any()),
  passed: z.boolean(),
  completed_at: z.string().datetime().optional(),
});

export type QuizAttempt = z.infer<typeof QuizAttemptSchema>;

/**
 * SUBMIT QUIZ ATTEMPT SCHEMA
 */
export const SubmitQuizAttemptSchema = z.object({
  quiz_id: z.string().uuid('Quiz ID muss eine gültige UUID sein'),
  user_id: z.string().uuid('User ID muss eine gültige UUID sein'),
  score: z.number().int().min(0).max(100, 'Score muss zwischen 0 und 100 liegen'),
  answers: z.array(z.any()),
  passed: z.boolean(),
});

export type SubmitQuizAttemptData = z.infer<typeof SubmitQuizAttemptSchema>;

/**
 * LEARNING PROGRESS SCHEMA
 */
export const LearningProgressSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid('User ID muss eine gültige UUID sein'),
  video_id: z.string().uuid('Video ID muss eine gültige UUID sein'),
  progress: z.number().min(0).max(100),
  completed: z.boolean().default(false),
  last_watched_at: z.string().datetime().optional(),
});

export type LearningProgress = z.infer<typeof LearningProgressSchema>;

/**
 * VIDEO FILTERS SCHEMA
 */
export const VideoFiltersSchema = z.object({
  category: z.string().optional(),
  organization_id: z.string().uuid().optional(),
  search: z.string().min(2, 'Suchbegriff zu kurz').optional(),
}).optional();

export type VideoFilters = z.infer<typeof VideoFiltersSchema>;

/**
 * VALIDATION HELPERS
 */
export const validateVideo = (data: unknown) => VideoSchema.parse(data);
export const validateCreateVideo = (data: unknown) => CreateVideoSchema.parse(data);
export const validateUpdateVideo = (data: unknown) => UpdateVideoSchema.parse(data);
export const validateQuiz = (data: unknown) => QuizSchema.parse(data);
export const validateCreateQuiz = (data: unknown) => CreateQuizSchema.parse(data);
export const validateUpdateQuiz = (data: unknown) => UpdateQuizSchema.parse(data);
export const validateQuizAttempt = (data: unknown) => QuizAttemptSchema.parse(data);
export const validateSubmitQuizAttempt = (data: unknown) => SubmitQuizAttemptSchema.parse(data);
export const validateLearningProgress = (data: unknown) => LearningProgressSchema.parse(data);

/**
 * SAFE VALIDATION
 */
export const safeValidateVideo = (data: unknown) => VideoSchema.safeParse(data);
export const safeValidateCreateVideo = (data: unknown) => CreateVideoSchema.safeParse(data);
export const safeValidateQuiz = (data: unknown) => QuizSchema.safeParse(data);
export const safeValidateCreateQuiz = (data: unknown) => CreateQuizSchema.safeParse(data);
export const safeValidateSubmitQuizAttempt = (data: unknown) => SubmitQuizAttemptSchema.safeParse(data);

/**
 * TEST SCHEMAS (v4.13.1)
 * =======================
 */

/**
 * TEST BLOCK TYPES
 */
export const TestBlockTypeEnum = z.enum([
  'MULTIPLE_CHOICE',
  'MULTIPLE_SELECT',
  'TRUE_FALSE',
  'SHORT_TEXT',
  'LONG_TEXT',
  'FILL_BLANKS',
  'ORDERING',
  'MATCHING',
  'SLIDER',
  'FILE_UPLOAD'
]);

export type TestBlockType = z.infer<typeof TestBlockTypeEnum>;

/**
 * TEST BLOCK SCHEMA
 */
export const TestBlockSchema = z.object({
  id: z.string().uuid().optional(),
  test_id: z.string().uuid('Test ID muss eine gültige UUID sein'),
  type: TestBlockTypeEnum,
  title: z.string().min(1, 'Titel ist erforderlich').max(500),
  description: z.string().max(2000).nullable().optional(),
  content: z.any(), // JSON content varies by block type
  points: z.number().int().min(0).default(10),
  is_required: z.boolean().default(true),
  time_limit_seconds: z.number().int().min(1).nullable().optional(),
  position: z.number().int().min(0).default(0),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type TestBlock = z.infer<typeof TestBlockSchema>;

/**
 * TEST SCHEMA
 */
export const TestSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'Titel ist erforderlich').max(300),
  description: z.string().max(2000).nullable().optional(),
  pass_percentage: z.number().int().min(0).max(100).default(80),
  reward_coins: z.number().int().min(0).default(0),
  max_attempts: z.number().int().min(0).default(3),
  time_limit_minutes: z.number().int().min(1).nullable().optional(),
  is_template: z.boolean().default(false),
  template_category: z.string().max(100).nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  created_by: z.string().uuid().nullable().optional(),
  updated_at: z.string().datetime().optional(),
  updated_by: z.string().uuid().nullable().optional(),
});

export type Test = z.infer<typeof TestSchema>;

/**
 * CREATE TEST SCHEMA
 */
export const CreateTestSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(300),
  description: z.string().max(2000).optional(),
  pass_percentage: z.number().int().min(0).max(100).default(80).optional(),
  reward_coins: z.number().int().min(0).default(0).optional(),
  max_attempts: z.number().int().min(0).default(3).optional(),
  time_limit_minutes: z.number().int().min(1).nullable().optional(),
  is_template: z.boolean().default(false).optional(),
  template_category: z.string().max(100).nullable().optional(),
  organization_id: z.string().uuid().optional(),
});

export type CreateTestData = z.infer<typeof CreateTestSchema>;

/**
 * UPDATE TEST SCHEMA
 */
export const UpdateTestSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional(),
  pass_percentage: z.number().int().min(0).max(100).optional(),
  reward_coins: z.number().int().min(0).optional(),
  max_attempts: z.number().int().min(0).optional(),
  time_limit_minutes: z.number().int().min(1).nullable().optional(),
  is_template: z.boolean().optional(),
  template_category: z.string().max(100).nullable().optional(),
});

export type UpdateTestData = z.infer<typeof UpdateTestSchema>;

/**
 * CREATE TEST BLOCK SCHEMA
 */
export const CreateTestBlockSchema = z.object({
  test_id: z.string().uuid('Test ID muss eine gültige UUID sein'),
  type: TestBlockTypeEnum,
  title: z.string().min(1, 'Titel ist erforderlich').max(500),
  description: z.string().max(2000).optional(),
  content: z.any(),
  points: z.number().int().min(0).default(10).optional(),
  is_required: z.boolean().default(true).optional(),
  time_limit_seconds: z.number().int().min(1).nullable().optional(),
  position: z.number().int().min(0).default(0).optional(),
});

export type CreateTestBlockData = z.infer<typeof CreateTestBlockSchema>;

/**
 * UPDATE TEST BLOCK SCHEMA
 */
export const UpdateTestBlockSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  content: z.any().optional(),
  points: z.number().int().min(0).optional(),
  is_required: z.boolean().optional(),
  time_limit_seconds: z.number().int().min(1).nullable().optional(),
  position: z.number().int().min(0).optional(),
});

export type UpdateTestBlockData = z.infer<typeof UpdateTestBlockSchema>;

/**
 * TEST VALIDATION HELPERS
 */
export const validateTest = (data: unknown) => TestSchema.parse(data);
export const validateCreateTest = (data: unknown) => CreateTestSchema.parse(data);
export const validateUpdateTest = (data: unknown) => UpdateTestSchema.parse(data);
export const validateTestBlock = (data: unknown) => TestBlockSchema.parse(data);
export const validateCreateTestBlock = (data: unknown) => CreateTestBlockSchema.parse(data);
export const validateUpdateTestBlock = (data: unknown) => UpdateTestBlockSchema.parse(data);

/**
 * SAFE TEST VALIDATION
 */
export const safeValidateTest = (data: unknown) => TestSchema.safeParse(data);
export const safeValidateCreateTest = (data: unknown) => CreateTestSchema.safeParse(data);
export const safeValidateTestBlock = (data: unknown) => TestBlockSchema.safeParse(data);
export const safeValidateCreateTestBlock = (data: unknown) => CreateTestBlockSchema.safeParse(data);

/**
 * ========================================
 * TEST SUBMISSION & REVIEW SYSTEM
 * ========================================
 */

/**
 * TEST SUBMISSION STATUS
 */
export const TestSubmissionStatusEnum = z.enum([
  'DRAFT',            // User ist noch am Bearbeiten
  'PENDING_REVIEW',   // Abgegeben, wartet auf Prüfer
  'NEEDS_REVISION',   // Abgelehnt, User muss überarbeiten
  'APPROVED',         // Bestanden
  'FAILED'            // Durchgefallen (endgültig)
]);

export type TestSubmissionStatus = z.infer<typeof TestSubmissionStatusEnum>;

/**
 * PRACTICAL SUBMISSION (File/Video Upload)
 */
export const PracticalSubmissionSchema = z.object({
  blockId: z.string().uuid(),
  type: z.enum(['file', 'video']),
  fileUrl: z.string().url(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  userExplanation: z.string().max(2000).optional(),
  reviewStatus: z.enum(['pending', 'approved', 'rejected']).default('pending'),
});

export type PracticalSubmission = z.infer<typeof PracticalSubmissionSchema>;

/**
 * TEST SUBMISSION SCHEMA
 */
export const TestSubmissionSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  testId: z.string().uuid(),
  videoId: z.string().uuid().nullable().optional(),
  status: TestSubmissionStatusEnum.default('DRAFT'),
  attemptNumber: z.number().int().min(1).max(3).default(1),
  
  // Auto-Scores (sofort berechnet)
  autoAnswers: z.record(z.any()).optional(), // { blockId: answer }
  autoScore: z.number().min(0).default(0),
  autoMaxScore: z.number().min(0).default(0),
  autoPercentage: z.number().min(0).max(100).default(0),
  
  // Praktische Aufgaben
  practicalSubmissions: z.array(PracticalSubmissionSchema).default([]),
  
  // Review Data
  reviewerId: z.string().uuid().nullable().optional(),
  reviewedAt: z.string().datetime().nullable().optional(),
  reviewDecision: z.enum(['approve', 'needs_revision', 'fail']).nullable().optional(),
  reviewReason: z.string().max(2000).nullable().optional(),
  reviewStars: z.number().int().min(1).max(5).nullable().optional(),
  
  // Calculated
  finalScore: z.number().min(0).max(100).default(0),
  finalPercentage: z.number().min(0).max(100).default(0),
  passed: z.boolean().default(false),
  
  submittedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type TestSubmission = z.infer<typeof TestSubmissionSchema>;

/**
 * REVIEW COMMENT SCHEMA
 */
export const ReviewCommentSchema = z.object({
  id: z.string().uuid().optional(),
  submissionId: z.string().uuid(),
  blockId: z.string().uuid(),
  reviewerId: z.string().uuid(),
  
  type: z.enum(['image', 'video']),
  
  // For image comments (position as % from top/left)
  positionX: z.number().min(0).max(100).nullable().optional(),
  positionY: z.number().min(0).max(100).nullable().optional(),
  
  // For video comments (timestamp in seconds)
  timestamp: z.number().min(0).nullable().optional(),
  
  text: z.string().min(1).max(1000),
  createdAt: z.string().datetime().optional(),
});

export type ReviewComment = z.infer<typeof ReviewCommentSchema>;

/**
 * CREATE SUBMISSION SCHEMA
 */
export const CreateTestSubmissionSchema = z.object({
  testId: z.string().uuid(),
  userId: z.string().uuid(),
  videoId: z.string().uuid().nullable().optional(),
  autoAnswers: z.record(z.any()).optional(),
  practicalSubmissions: z.array(PracticalSubmissionSchema).optional(),
});

export type CreateTestSubmissionData = z.infer<typeof CreateTestSubmissionSchema>;

/**
 * UPDATE SUBMISSION SCHEMA
 */
export const UpdateTestSubmissionSchema = z.object({
  autoAnswers: z.record(z.any()).optional(),
  practicalSubmissions: z.array(PracticalSubmissionSchema).optional(),
  status: TestSubmissionStatusEnum.optional(),
});

export type UpdateTestSubmissionData = z.infer<typeof UpdateTestSubmissionSchema>;

/**
 * SUBMIT FOR REVIEW SCHEMA
 */
export const SubmitForReviewSchema = z.object({
  submissionId: z.string().uuid(),
  autoAnswers: z.record(z.any()),
  practicalSubmissions: z.array(PracticalSubmissionSchema),
});

export type SubmitForReviewData = z.infer<typeof SubmitForReviewSchema>;

/**
 * REVIEW SUBMISSION SCHEMA
 */
export const ReviewSubmissionSchema = z.object({
  submissionId: z.string().uuid(),
  reviewerId: z.string().uuid(),
  decision: z.enum(['approve', 'needs_revision', 'fail']),
  reason: z.string().min(20, 'Begründung muss mindestens 20 Zeichen lang sein').max(2000),
  stars: z.number().int().min(1).max(5).optional(),
  comments: z.array(z.object({
    blockId: z.string().uuid(),
    type: z.enum(['image', 'video']),
    positionX: z.number().min(0).max(100).nullable().optional(),
    positionY: z.number().min(0).max(100).nullable().optional(),
    timestamp: z.number().min(0).nullable().optional(),
    text: z.string().min(1).max(1000),
  })).optional(),
});

export type ReviewSubmissionData = z.infer<typeof ReviewSubmissionSchema>;