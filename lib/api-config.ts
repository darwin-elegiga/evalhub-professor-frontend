// Configuración de la API del backend NestJS
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  ENDPOINTS: {
    // Auth
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",

    // Teachers
    TEACHERS: "/teachers",

    // Students
    STUDENTS: "/students",
    STUDENT_BY_ID: (id: string) => `/students/${id}`,

    // Groups
    GROUPS: "/groups",
    GROUP_BY_ID: (id: string) => `/groups/${id}`,

    // Exams
    EXAMS: "/exams",
    EXAM_BY_ID: (id: string) => `/exams/${id}`,
    EXAMS_CREATE: "/exams/create",
    EXAMS_ASSIGN: "/exams/assign",
    ASSIGN_EXAM: "/exams/assign",

    // Questions (Bank)
    QUESTIONS: "/questions",
    QUESTION_BY_ID: (id: string) => `/questions/${id}`,

    // Topics
    TOPICS: "/topics",
    TOPIC_BY_ID: (id: string) => `/topics/${id}`,

    // Assignments
    ASSIGNMENTS: "/assignments",
    ASSIGNMENT_BY_ID: (id: string) => `/assignments/${id}`,
    ASSIGNMENTS_TOKEN: "/assignments/token",
    EXAM_BY_TOKEN: (token: string) => `/assignments/token/${token}`,
    ASSIGNMENTS_START: "/assignments/start",
    ASSIGNMENTS_ANSWER: "/assignments/answer",
    ASSIGNMENTS_SUBMIT: "/assignments/submit",
    START_EXAM: "/assignments/start",
    SUBMIT_ANSWER: "/assignments/answer",
    SUBMIT_EXAM: "/assignments/submit",

    // Grades
    GRADES: "/grades",
    GRADE_ANSWER: (answerId: string) => `/grades/answer/${answerId}`,
    GRADES_SUBMIT: "/grades/submit",
    SUBMIT_GRADE: "/grades/submit",

    // Levels
    LEVELS: "/levels",
  },
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any,
  ) {
    super(message)
    this.name = "ApiError"
  }
}
