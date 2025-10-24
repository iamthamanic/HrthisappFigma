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
