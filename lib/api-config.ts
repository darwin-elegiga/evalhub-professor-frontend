// Configuración de la API del backend NestJS
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "https://evalhub-backend.onrender.com/",
  ENDPOINTS: {
    // Auth
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",

    // Teachers
    TEACHERS: "/teachers",

    // Students
    STUDENTS: "/students",
    STUDENT_BY_ID: (id: string) => `/students/${id}`,

    // Careers
    CAREERS: "/careers",

    // Groups
    GROUPS: "/groups",
    GROUP_BY_ID: (id: string) => `/groups/${id}`,
    GROUP_STUDENTS: (id: string) => `/groups/${id}/students`,

    // Exams
    EXAMS: "/exams",
    EXAM_BY_ID: (id: string) => `/exams/${id}`,
    EXAMS_CREATE: "/exams/create",
    EXAMS_ASSIGN: "/exams/assign",

    // Questions (Bank)
    QUESTIONS: "/questions",
    QUESTION_BY_ID: (id: string) => `/questions/${id}`,

    // Topics
    TOPICS: "/topics",
    TOPIC_BY_ID: (id: string) => `/topics/${id}`,

    // Subjects
    SUBJECTS: "/subjects",
    SUBJECT_BY_ID: (id: string) => `/subjects/${id}`,

    // Assignments
    ASSIGNMENTS: "/assignments",
    ASSIGNMENT_BY_ID: (id: string) => `/assignments/${id}`,
    ASSIGNMENT_GRADING: (id: string) => `/assignments/${id}/grading`,
    ASSIGNMENT_BY_TOKEN: (token: string) => `/assignments/token/${token}`,
    ASSIGNMENTS_START: "/assignments/start",
    ASSIGNMENTS_ANSWER: "/assignments/answer",
    ASSIGNMENTS_SUBMIT: "/assignments/submit",

    // Grades
    GRADES: "/grades",
    GRADE_ANSWER: (answerId: string) => `/grades/answer/${answerId}`,
    GRADES_SUBMIT: "/grades/submit",

    // Levels
    LEVELS: "/levels",
    LEVEL_BY_ID: (id: string) => `/levels/${id}`,

    // Config
    EXAM_DEFAULT_CONFIG: "/config/exam-defaults",

    // Exam Events (Monitoring)
    EXAM_EVENTS: "/exam/events",
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
