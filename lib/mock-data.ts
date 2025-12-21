import type {
  Teacher,
  Student,
  StudentGroup,
  Exam,
  Question,
  AnswerOption,
  ExamAssignment,
  StudentExamAssignment,
  StudentAnswer,
  Grade,
  ExamLevel,
  Subject,
  QuestionTopic,
  BankQuestion,
  ExamEvent,
} from "./types"

// Import JSON data from organized folders
import teacherData from "./mock/teacher/teacher.json"
import groupsData from "./mock/groups/groups.json"
import studentsData from "./mock/students/students.json"
import levelsData from "./mock/exams/levels.json"
import subjectsData from "./mock/subjects/subjects.json"
import examsData from "./mock/exams/exams.json"
import questionsData from "./mock/questions/questions.json"
import answerOptionsData from "./mock/questions/answer-options.json"
import bankQuestionsData from "./mock/questions/bank-questions.json"
import topicsData from "./mock/topics/topics.json"
import examAssignmentsData from "./mock/assignments/exam-assignments.json"
import studentAssignmentsData from "./mock/assignments/student-assignments.json"
import studentAnswersData from "./mock/assignments/student-answers.json"
import gradesData from "./mock/grades/grades.json"
import examEventsData from "./mock/events/exam-events.json"

// Export mock data with proper typing
export const MOCK_DATA = {
  teacher: teacherData as Teacher,
  studentGroups: groupsData as StudentGroup[],
  students: studentsData as Student[],
  levels: levelsData as ExamLevel[],
  subjects: subjectsData as Subject[],
  exams: examsData as Exam[],
  questions: questionsData as Question[],
  answerOptions: answerOptionsData as AnswerOption[],
  bankQuestions: bankQuestionsData as BankQuestion[],
  topics: topicsData as QuestionTopic[],
  examAssignments: examAssignmentsData as ExamAssignment[],
  assignments: studentAssignmentsData as StudentExamAssignment[],
  studentAnswers: studentAnswersData as StudentAnswer[],
  grades: gradesData as Grade[],
  examEvents: examEventsData as ExamEvent[],
}

// Flag para activar/desactivar modo mock
export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK === "true"
