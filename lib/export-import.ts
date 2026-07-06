import type { BankQuestion, Exam, QuestionTopic } from "./types"

// ============================================
// EXPORT FORMATS
// ============================================

export interface ExportedQuestion {
  // Core question data
  title: string
  content: string
  question_type: BankQuestion["questionType"]
  type_config: BankQuestion["typeConfig"]
  difficulty: BankQuestion["difficulty"]
  estimated_time_minutes: number | null
  tags: string[]
  weight: number
  // Optional topic name (for reference)
  topic_name?: string
}

export interface ExportedExam {
  title: string
  description: string | null
  duration_minutes: number | null
  questions: ExportedQuestion[]
}

export interface QuestionBankExport {
  version: "1.0"
  type: "question_bank"
  exported_at: string
  questions: ExportedQuestion[]
  topics?: { name: string; color: string; description: string | null }[]
}

export interface ExamExport {
  version: "1.0"
  type: "exam"
  exported_at: string
  exam: ExportedExam
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Export a single question to JSON format
 */
export function exportQuestion(
  question: BankQuestion,
  topic?: QuestionTopic | null
): ExportedQuestion {
  return {
    title: question.title,
    content: question.content,
    question_type: question.questionType,
    type_config: question.typeConfig,
    difficulty: question.difficulty,
    estimated_time_minutes: question.estimatedTimeMinutes,
    tags: question.tags,
    weight: question.weight,
    topic_name: topic?.name,
  }
}

/**
 * Export multiple questions as a question bank JSON
 */
export function exportQuestionBank(
  questions: BankQuestion[],
  topics: QuestionTopic[]
): QuestionBankExport {
  const topicsMap = new Map(topics.map((t) => [t.id, t]))

  return {
    version: "1.0",
    type: "question_bank",
    exported_at: new Date().toISOString(),
    questions: questions.map((q) => exportQuestion(q, topicsMap.get(q.topicId || ""))),
    topics: topics.map((t) => ({
      name: t.name,
      color: t.color,
      description: t.description,
    })),
  }
}

/**
 * Export an exam with its questions to JSON format
 */
export function exportExam(
  exam: Exam,
  questions: BankQuestion[],
  topics?: QuestionTopic[]
): ExamExport {
  const topicsMap = new Map(topics?.map((t) => [t.id, t]) || [])

  const exportedQuestions: ExportedQuestion[] = questions.map((q) =>
    exportQuestion(q, topicsMap.get(q.topicId || ""))
  )

  return {
    version: "1.0",
    type: "exam",
    exported_at: new Date().toISOString(),
    exam: {
      title: exam.title,
      description: exam.description,
      duration_minutes: exam.durationMinutes,
      questions: exportedQuestions,
    },
  }
}

// ============================================
// DOWNLOAD HELPERS
// ============================================

/**
 * Download data as a JSON file
 */
export function downloadJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download questions as JSON
 */
export function downloadQuestions(
  questions: BankQuestion[],
  topics: QuestionTopic[],
  filename?: string
): void {
  const exported = exportQuestionBank(questions, topics)
  const name = filename || `banco-preguntas-${new Date().toISOString().split("T")[0]}`
  downloadJSON(exported, name)
}

/**
 * Download an exam as JSON
 */
export function downloadExam(
  exam: Exam,
  questions: BankQuestion[],
  topics?: QuestionTopic[],
  filename?: string
): void {
  const exported = exportExam(exam, questions, topics)
  const name = filename || `examen-${exam.title.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}`
  downloadJSON(exported, name)
}

// ============================================
// IMPORT FUNCTIONS
// ============================================

export interface ImportResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Parse and validate a question bank import file
 */
export function parseQuestionBankImport(json: string): ImportResult<QuestionBankExport> {
  try {
    const data = JSON.parse(json)

    // Validate structure
    if (data.type !== "question_bank") {
      return { success: false, error: "El archivo no es un banco de preguntas válido" }
    }

    if (!data.version || !data.questions || !Array.isArray(data.questions)) {
      return { success: false, error: "Formato de archivo inválido" }
    }

    // Validate each question has required fields
    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i]
      if (!q.title || !q.content || !q.question_type) {
        return {
          success: false,
          error: `Pregunta ${i + 1} tiene campos requeridos faltantes`,
        }
      }
    }

    return { success: true, data: data as QuestionBankExport }
  } catch {
    return { success: false, error: "Error al parsear el archivo JSON" }
  }
}

/**
 * Parse and validate an exam import file
 */
export function parseExamImport(json: string): ImportResult<ExamExport> {
  try {
    const data = JSON.parse(json)

    // Validate structure
    if (data.type !== "exam") {
      return { success: false, error: "El archivo no es un examen válido" }
    }

    if (!data.version || !data.exam || !data.exam.title) {
      return { success: false, error: "Formato de archivo inválido" }
    }

    if (!data.exam.questions || !Array.isArray(data.exam.questions)) {
      return { success: false, error: "El examen no tiene preguntas" }
    }

    return { success: true, data: data as ExamExport }
  } catch {
    return { success: false, error: "Error al parsear el archivo JSON" }
  }
}

/**
 * Read a file and return its contents as string
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Error al leer el archivo"))
    reader.readAsText(file)
  })
}
