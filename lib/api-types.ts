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
  ExamEventType,
  ExamEventSeverity,
  QuestionType,
} from "./types"

// ============================================
// COMMON EMBEDDED TYPES
// ============================================

/**
 * Embedded student info in API responses
 */
export interface EmbeddedStudent {
  id: string
  fullName: string
  email: string
  career?: string | null
}

/**
 * Embedded exam info in API responses (minimal)
 */
export interface EmbeddedExamBasic {
  id: string
  title: string
  description?: string | null
}

/**
 * Embedded exam info with duration
 */
export interface EmbeddedExam extends EmbeddedExamBasic {
  durationMinutes: number | null
}

// ============================================
// EXAM TAKING (Student-side)
// ============================================

/**
 * Question with answer options for exam taking
 */
export interface ExamQuestion extends Question {
  answerOptions: AnswerOption[]
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
 * Assignment for grading. The backend returns `student` and `exam` as
 * siblings of `assignment`, not nested inside it.
 */
export interface GradingAssignment {
  id: string
  examId: string
  studentId: string
  magicToken: string
  magicLink: string
  status: "pending" | "in_progress" | "submitted" | "graded"
  assignedAt: string
  startedAt?: string | null
  submittedAt?: string | null
  score?: number | null
}

/**
 * Proctoring event as returned by the grading endpoint (camelCase),
 * distinct from the snake_case `ExamEvent` used by the student-side event API.
 */
export interface GradingEvent {
  id: string
  assignmentId: string
  eventType: ExamEventType
  severity: ExamEventSeverity
  timestamp: string
  details: { message?: string; [key: string]: unknown } | null
}

/**
 * Question with options and answer for grading
 */
export interface GradingQuestion {
  id: string
  title: string
  content: string
  questionType: QuestionType
  typeConfig: Record<string, unknown>
  weight: number
  answer: {
    id: string
    selectedOptionId?: string | null
    answerText?: string | null
    answerNumeric?: number | null
    answerFiles?: Array<{ url: string; kind: string; mime?: string }> | null
    score?: number | null
    feedback?: string | null
  } | null
}

/**
 * Response from GET /assignments/:id/grading
 */
export interface GradingDataResponse {
  assignment: GradingAssignment
  student: EmbeddedStudent
  exam: EmbeddedExamBasic
  questions: GradingQuestion[]
  answers: StudentAnswer[]
  events: GradingEvent[]
  existingGrade: Grade | null
}

// ============================================
// EXAMS MANAGEMENT
// ============================================

/**
 * Response from POST /api/exams/assign
 */
export interface ExamAssignmentResult {
  studentId: string
  studentName: string
  magicToken: string
  magicLink: string
}

export interface ExamAssignResponse {
  assignments: ExamAssignmentResult[]
  skippedCount: number
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
