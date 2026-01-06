// ============================================
// EXAM MONITORING EVENTS
// ============================================

export type ExamEventType =
  | "tab_hidden"           // Estudiante salió de la pestaña (visibilitychange)
  | "tab_visible"          // Estudiante volvió a la pestaña
  | "window_blur"          // Ventana perdió el foco
  | "window_focus"         // Ventana recuperó el foco
  | "copy"                 // Estudiante copió texto
  | "paste"                // Estudiante pegó texto (potencial de fuente externa)
  | "cut"                  // Estudiante cortó texto
  | "right_click"          // Click derecho (intento de menú contextual)
  | "fullscreen_exit"      // Salió de pantalla completa
  | "devtools_open"        // Intento de abrir DevTools detectado
  | "screenshot_attempt"   // Intento de captura de pantalla (limitado)
  | "print_attempt"        // Intento de imprimir
  | "keyboard_shortcut"    // Atajo de teclado sospechoso (Ctrl+C fuera de input, etc.)
  | "idle_timeout"         // Inactividad prolongada
  | "rapid_answers"        // Respuestas muy rápidas (sospechoso)
  | "browser_resize"       // Cambio de tamaño de ventana significativo
  | "connection_lost"      // Pérdida de conexión
  | "connection_restored"  // Conexión restaurada
  | "exam_started"         // Inicio del examen
  | "exam_submitted"       // Envío del examen

export type ExamEventSeverity = "info" | "warning" | "critical"

export interface ExamEvent {
  id: string
  assignment_id: string
  event_type: ExamEventType
  severity: ExamEventSeverity
  timestamp: string
  details: {
    // Datos específicos del evento
    duration_seconds?: number      // Para tab_hidden: cuánto tiempo estuvo fuera
    pasted_length?: number         // Para paste: longitud del texto pegado
    shortcut_keys?: string         // Para keyboard_shortcut: teclas presionadas
    idle_duration_seconds?: number // Para idle_timeout: duración de inactividad
    question_index?: number        // Pregunta actual al momento del evento
    answer_time_seconds?: number   // Para rapid_answers: tiempo por respuesta
    window_dimensions?: {          // Para browser_resize
      width: number
      height: number
    }
    message?: string               // Descripción adicional
  }
}
