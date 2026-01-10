// Re-export all models from the models folder for backward compatibility
// New code should import directly from @/lib/models

export type {
  // User/Teacher
  Teacher,

  // Students
  Student,
  StudentGroupRef,

  // Groups
  StudentGroup,

  // Careers
  Career,

  // Subjects & Levels
  Subject,
  ExamLevel,

  // Exams
  Exam,
  ExamAssignment,
  StudentExamAssignment,
  ExamConfig,
  ExamDefaultConfig,
  ExamWithConfig,

  // Questions
  QuestionType,
  QuestionDifficulty,
  Question,
  AnswerOption,
  QuestionTopic,
  MultipleChoiceConfig,
  NumericConfig,
  GraphClickConfig,
  ImageHotspotConfig,
  OpenTextConfig,
  QuestionConfig,
  BankQuestion,
  ExamQuestion,

  // Grades
  QuestionScore,
  GradeRoundingMethod,
  FinalGrade,
  StudentAnswer,
  Grade,
  GradeWithDetails,

  // Exam Events (Monitoring)
  ExamEventType,
  ExamEventSeverity,
  ExamEvent,
} from "./models"
