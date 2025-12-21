/**
 * API Response Types
 * Types for API responses used across the application
 */

import type {
  StudentExamAssignment,
  Question,
  AnswerOption,
  StudentAnswer,
  Grade,
  ExamEvent,
} from "./types"

// ============================================
// COMMON EMBEDDED TYPES
// ============================================

/**
 * Embedded student info in API responses
 */
export interface EmbeddedStudent {
  full_name: string
  email: string
}

/**
 * Embedded exam info in API responses (minimal)
 */
export interface EmbeddedExamBasic {
  id: string
  title: string
  description: string | null
}

/**
 * Embedded exam info with duration
 */
export interface EmbeddedExam extends EmbeddedExamBasic {
  duration_minutes: number | null
}

// ============================================
// EXAM TAKING (Student-side)
// ============================================

/**
 * Question with answer options for exam taking
 */
export interface ExamQuestion extends Question {
  answer_options: AnswerOption[]
}

/**
 * Assignment with embedded student and exam info (for exam taking)
 */
export interface ExamTakingAssignment extends StudentExamAssignment {
  student: EmbeddedStudent
  exam: EmbeddedExam
}

/**
 * Response from GET /api/exam/token/:token
 */
export interface ExamTokenResponse {
  assignment: ExamTakingAssignment
  questions: ExamQuestion[]
  existingAnswers: StudentAnswer[]
}

// ============================================
// GRADING (Teacher-side)
// ============================================

/**
 * Assignment for grading with embedded info
 */
export interface GradingAssignment {
  id: string
  status: "pending" | "in_progress" | "submitted" | "graded"
  student: EmbeddedStudent
  exam: EmbeddedExamBasic
}

/**
 * Question with options for grading
 */
export interface GradingQuestion extends Question {
  answer_options: AnswerOption[]
}

/**
 * Response from GET /api/assignments/:id/grading
 */
export interface GradingDataResponse {
  assignment: GradingAssignment
  questions: GradingQuestion[]
  studentAnswers: StudentAnswer[]
  existingGrade: Grade | null
  examEvents?: ExamEvent[]
}

// ============================================
// EXAMS MANAGEMENT
// ============================================

/**
 * Response from POST /api/exams/assign
 */
export interface ExamAssignmentResult {
  student_id: string
  student_name: string
  magic_token: string
  url: string
}

export interface ExamAssignResponse {
  assignments: ExamAssignmentResult[]
}

// ============================================
// GENERIC API RESPONSES
// ============================================

/**
 * Generic success response with data
 */
export interface ApiResponse<T> {
  data?: T
  error?: string
}

/**
 * Response for answer submission
 */
export interface AnswerResponse {
  answer: StudentAnswer
}

/**
 * Response for grade submission
 */
export interface GradeResponse {
  grade: Grade
}
