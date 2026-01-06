# API Endpoints - EvalHub Professor Frontend

## Configuración Base

- **Base URL:** `http://localhost:3001/api` (configurable con `NEXT_PUBLIC_API_URL`)
- **Autenticación:** Bearer Token en header `Authorization`
- **Modo Mock:** Controlado por `NEXT_PUBLIC_USE_MOCK=true` en `.env`

## Arquitectura

El frontend Next.js actúa como middleware/proxy entre el cliente y el backend NestJS:

```
Cliente (Browser) → Next.js API Routes (/app/api/*) → Backend NestJS (localhost:3001/api)
```

Cada ruta en `/app/api/` tiene soporte para modo mock (datos locales) y modo real (llamadas al backend).

## Rutas API Implementadas (Next.js → NestJS)

| Next.js Route | Métodos | Backend Endpoint |
|---------------|---------|------------------|
| `/api/students` | GET, POST | `/students` |
| `/api/students/[id]` | GET, PUT, DELETE | `/students/{id}` |
| `/api/groups` | GET, POST | `/groups` |
| `/api/groups/[id]` | GET, PUT, DELETE | `/groups/{id}` |
| `/api/exams` | GET | `/exams` |
| `/api/exams/[id]` | GET, PUT, DELETE | `/exams/{id}` |
| `/api/exams/create` | POST | `/exams/create` |
| `/api/exams/assign` | POST | `/exams/assign` |
| `/api/questions` | GET, POST | `/questions` |
| `/api/questions/[id]` | GET, PUT, DELETE | `/questions/{id}` |
| `/api/topics` | GET, POST | `/topics` |
| `/api/topics/[id]` | GET, PUT, DELETE | `/topics/{id}` |
| `/api/subjects` | GET, POST | `/subjects` |
| `/api/subjects/[id]` | GET, PUT, DELETE | `/subjects/{id}` |
| `/api/levels` | GET, POST | `/levels` |
| `/api/levels/[id]` | GET, PUT, DELETE | `/levels/{id}` |
| `/api/assignments` | GET | `/assignments` |
| `/api/assignments/[id]` | GET | `/assignments/{id}` |
| `/api/assignments/[id]/grading` | GET | `/assignments/{id}/grading` |
| `/api/assignments/token/[token]` | GET | `/assignments/token/{token}` |
| `/api/exam/start` | POST | `/assignments/start` |
| `/api/exam/answer` | POST | `/assignments/answer` |
| `/api/exam/submit` | POST | `/assignments/submit` |
| `/api/exam/event` | GET, POST | `/exam/events` |
| `/api/grades` | GET | `/grades` |
| `/api/grades/answer/[id]` | PUT | `/grades/answer/{id}` |
| `/api/grades/submit` | POST | `/grades/submit` |
| `/api/config/exam-defaults` | GET | `/config/exam-defaults` |

---

## 🔐 Autenticación

### POST `/auth/login`
Iniciar sesión de profesor.

**Payload:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Respuesta:**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "full_name": "string",
    "email": "string",
    "created_at": "string (ISO)"
  }
}
```

---

### POST `/auth/register`
Registrar nuevo profesor.

**Payload:**
```json
{
  "email": "string",
  "password": "string",
  "fullName": "string"
}
```

**Respuesta:**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "full_name": "string",
    "email": "string",
    "created_at": "string (ISO)"
  }
}
```

---

### GET `/auth/me`
Obtener información del profesor autenticado.

**Respuesta:**
```json
{
  "id": "string",
  "full_name": "string",
  "email": "string",
  "created_at": "string (ISO)"
}
```

---

### POST `/auth/logout`
Cerrar sesión.

**Respuesta:**
```json
{
  "success": true
}
```

---

## 👨‍🎓 Estudiantes

### GET `/students`
Obtener lista de estudiantes del profesor.

**Respuesta:**
```json
[
  {
    "id": "string",
    "teacher_id": "string",
    "group_id": "string | null",
    "full_name": "string",
    "email": "string",
    "year": "number | null",
    "career": "string | null",
    "created_at": "string (ISO)"
  }
]
```

---

### GET `/students/{id}`
Obtener un estudiante por ID.

**Respuesta:**
```json
{
  "id": "string",
  "teacher_id": "string",
  "group_id": "string | null",
  "full_name": "string",
  "email": "string",
  "year": "number | null",
  "career": "string | null",
  "created_at": "string (ISO)"
}
```

---

### POST `/students`
Crear nuevo estudiante.

**Payload:**
```json
{
  "teacher_id": "string",
  "group_id": "string | null",
  "full_name": "string",
  "email": "string",
  "year": "number | null",
  "career": "string | null"
}
```

**Respuesta:**
```json
{
  "id": "string",
  "teacher_id": "string",
  "group_id": "string | null",
  "full_name": "string",
  "email": "string",
  "year": "number | null",
  "career": "string | null",
  "created_at": "string (ISO)"
}
```

---

### PUT `/students/{id}`
Actualizar estudiante.

**Payload:**
```json
{
  "group_id": "string | null",
  "full_name": "string",
  "email": "string",
  "year": "number | null",
  "career": "string | null"
}
```

**Respuesta:**
```json
{
  "id": "string",
  "teacher_id": "string",
  "group_id": "string | null",
  "full_name": "string",
  "email": "string",
  "year": "number | null",
  "career": "string | null",
  "created_at": "string (ISO)"
}
```

---

### DELETE `/students/{id}`
Eliminar estudiante.

**Respuesta:**
```json
{
  "success": true
}
```

---

## 👥 Grupos de Estudiantes

### GET `/groups`
Obtener lista de grupos del profesor.

**Respuesta:**
```json
[
  {
    "id": "string",
    "teacher_id": "string",
    "name": "string",
    "year": "number",
    "career": "string",
    "created_at": "string (ISO)"
  }
]
```

---

### GET `/groups/{id}`
Obtener un grupo por ID.

**Respuesta:**
```json
{
  "id": "string",
  "teacher_id": "string",
  "name": "string",
  "year": "number",
  "career": "string",
  "created_at": "string (ISO)"
}
```

---

### POST `/groups`
Crear nuevo grupo.

**Payload:**
```json
{
  "name": "string",
  "year": "number",
  "career": "string"
}
```

**Respuesta:**
```json
{
  "id": "string",
  "teacher_id": "string",
  "name": "string",
  "year": "number",
  "career": "string",
  "created_at": "string (ISO)"
}
```

---

### PUT `/groups/{id}`
Actualizar grupo.

**Payload:**
```json
{
  "name": "string",
  "year": "number",
  "career": "string"
}
```

**Respuesta:**
```json
{
  "id": "string",
  "teacher_id": "string",
  "name": "string",
  "year": "number",
  "career": "string",
  "created_at": "string (ISO)"
}
```

---

### DELETE `/groups/{id}`
Eliminar grupo.

**Respuesta:**
```json
{
  "success": true
}
```

---

## 📝 Exámenes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/exams` | Listar exámenes del profesor |
| GET | `/exams/:id` | Obtener examen con detalles y preguntas |
| POST | `/exams/create` | Crear nuevo examen |
| PUT | `/exams/:id` | Actualizar examen |
| DELETE | `/exams/:id` | Eliminar examen |
| POST | `/exams/assign` | Asignar examen a estudiantes |

### GET `/exams`
Obtener lista de exámenes del profesor.

**Respuesta:**
```json
[
  {
    "id": "string",
    "teacherId": "string",
    "subjectId": "string | null",
    "title": "string",
    "description": "string | null",
    "durationMinutes": "number | null",
    "createdAt": "string (ISO)",
    "updatedAt": "string (ISO)"
  }
]
```

---

### GET `/exams/{id}`
Obtener un examen con detalles.

**Respuesta:**
```json
{
  "id": "string",
  "teacherId": "string",
  "subjectId": "string | null",
  "title": "string",
  "description": "string | null",
  "durationMinutes": "number | null",
  "createdAt": "string (ISO)",
  "updatedAt": "string (ISO)",
  "config": {
    "shuffleQuestions": "boolean",
    "shuffleOptions": "boolean",
    "showResultsImmediately": "boolean",
    "allowReview": "boolean",
    "penaltyPerWrongAnswer": "number | null",
    "passingPercentage": "number"
  },
  "questions": [
    {
      "id": "string",
      "examId": "string",
      "questionId": "string",
      "questionOrder": "number",
      "weight": "number",
      "bankQuestion": "BankQuestion"
    }
  ]
}
```

---

### POST `/exams/create`
Crear nuevo examen.

**Payload:**
```json
{
  "title": "Examen Parcial 1",
  "description": "Examen sobre los temas 1-3",
  "subjectId": "uuid-asignatura",
  "durationMinutes": 60,
  "config": {
    "shuffleQuestions": false,
    "shuffleOptions": true,
    "showResultsImmediately": true,
    "allowReview": true,
    "penaltyPerWrongAnswer": null,
    "passingPercentage": 60
  },
  "questions": [
    {
      "questionId": "uuid-pregunta-1",
      "weight": 1,
      "questionOrder": 1
    },
    {
      "questionId": "uuid-pregunta-2",
      "weight": 2,
      "questionOrder": 2
    }
  ]
}
```

**Respuesta:**
```json
{
  "exam": {
    "id": "string",
    "teacherId": "string",
    "subjectId": "string | null",
    "title": "string",
    "description": "string | null",
    "durationMinutes": "number | null",
    "createdAt": "string (ISO)",
    "updatedAt": "string (ISO)"
  },
  "questions": [
    {
      "id": "string",
      "examId": "string",
      "questionId": "string",
      "questionOrder": "number",
      "weight": "number"
    }
  ]
}
```

---

### PUT `/exams/{id}`
Actualizar examen existente.

**Payload:**
```json
{
  "title": "Examen Parcial 1 - Actualizado",
  "description": "Descripción actualizada",
  "subjectId": "uuid-asignatura",
  "durationMinutes": 90,
  "config": {
    "shuffleQuestions": true,
    "shuffleOptions": true,
    "showResultsImmediately": false,
    "allowReview": true,
    "penaltyPerWrongAnswer": 0.25,
    "passingPercentage": 70
  },
  "questions": [
    {
      "questionId": "uuid-pregunta-1",
      "weight": 2,
      "questionOrder": 1
    }
  ]
}
```

**Respuesta:**
```json
{
  "id": "string",
  "teacherId": "string",
  "subjectId": "string | null",
  "title": "string",
  "description": "string | null",
  "durationMinutes": "number | null",
  "createdAt": "string (ISO)",
  "updatedAt": "string (ISO)"
}
```

---

### DELETE `/exams/{id}`
Eliminar examen.

**Respuesta:**
```json
{
  "success": true
}
```

---

### POST `/exams/assign`
Asignar examen a estudiantes.

**Payload:**
```json
{
  "examId": "uuid-examen",
  "studentIds": ["uuid-estudiante-1", "uuid-estudiante-2"]
}
```

**Respuesta:**
```json
{
  "assignments": [
    {
      "studentId": "string",
      "magicToken": "string",
      "magicLink": "string"
    }
  ]
}
```

---

## ⚙️ Configuración

### GET `/config/exam-defaults`
Obtener configuración por defecto para exámenes.

**Respuesta:**
```json
{
  "shuffle_questions": "boolean",
  "shuffle_options": "boolean",
  "show_results_immediately": "boolean",
  "penalty_enabled": "boolean",
  "penalty_value": "number (0-1, ej: 0.25 = 25%)",
  "passing_percentage": "number (0-100)"
}
```

---

## 📚 Banco de Preguntas

### GET `/questions`
Obtener lista de preguntas del banco.

**Query Params (opcionales):**
- `topic_id`: Filtrar por tema
- `type`: Filtrar por tipo (multiple_choice, numeric, graph_click, image_hotspot, open_text)
- `difficulty`: Filtrar por dificultad (easy, medium, hard)

**Respuesta:**
```json
[
  {
    "id": "string",
    "teacher_id": "string",
    "subject_id": "string | null",
    "topic_id": "string | null",
    "title": "string",
    "content": "string (HTML)",
    "question_type": "multiple_choice | numeric | graph_click | image_hotspot | open_text",
    "type_config": "object (depende del tipo)",
    "difficulty": "easy | medium | hard",
    "estimated_time_minutes": "number | null",
    "tags": ["string"],
    "weight": "number (1-10)",
    "created_at": "string (ISO)",
    "updated_at": "string (ISO)",
    "times_used": "number (opcional)",
    "average_score": "number (opcional)"
  }
]
```

---

### GET `/questions/{id}`
Obtener una pregunta por ID.

**Respuesta:**
```json
{
  "id": "string",
  "teacher_id": "string",
  "subject_id": "string | null",
  "topic_id": "string | null",
  "title": "string",
  "content": "string (HTML)",
  "question_type": "multiple_choice | numeric | graph_click | image_hotspot | open_text",
  "type_config": "object",
  "difficulty": "easy | medium | hard",
  "estimated_time_minutes": "number | null",
  "tags": ["string"],
  "weight": "number",
  "created_at": "string (ISO)",
  "updated_at": "string (ISO)"
}
```

---

### POST `/questions`
Crear nueva pregunta en el banco.

**Payload:**
```json
{
  "teacher_id": "string",
  "subject_id": "string | null",
  "topic_id": "string | null",
  "title": "string",
  "content": "string (HTML)",
  "question_type": "multiple_choice | numeric | graph_click | image_hotspot | open_text",
  "type_config": "object (ver tipos abajo)",
  "difficulty": "easy | medium | hard",
  "estimated_time_minutes": "number | null",
  "tags": ["string"],
  "weight": "number (1-10)"
}
```

**type_config para `multiple_choice`:**
```json
{
  "options": [
    {
      "id": "string",
      "text": "string (HTML)",
      "is_correct": "boolean",
      "order": "number"
    }
  ],
  "allow_multiple": "boolean",
  "shuffle_options": "boolean"
}
```

**type_config para `numeric`:**
```json
{
  "correct_value": "number",
  "tolerance": "number",
  "tolerance_type": "percentage | absolute",
  "unit": "string | null",
  "show_unit_input": "boolean"
}
```

**type_config para `graph_click`:**
```json
{
  "graph_type": "cartesian | polar | custom_image",
  "image_url": "string | null",
  "correct_point": { "x": "number", "y": "number" },
  "tolerance_radius": "number",
  "x_range": ["number", "number"],
  "y_range": ["number", "number"],
  "grid_visible": "boolean",
  "axis_labels": { "x": "string", "y": "string" }
}
```

**type_config para `image_hotspot`:**
```json
{
  "image_url": "string",
  "hotspots": [
    {
      "id": "string",
      "type": "circle | rectangle | polygon",
      "coordinates": ["number"],
      "is_correct": "boolean",
      "label": "string | null"
    }
  ],
  "allow_multiple_selections": "boolean"
}
```

**type_config para `open_text`:**
```json
{
  "max_length": "number | null",
  "placeholder": "string | null",
  "allow_latex": "boolean",
  "keywords": ["string"]
}
```

**Respuesta:**
```json
{
  "id": "string",
  "teacher_id": "string",
  "...": "resto de campos de BankQuestion"
}
```

---

### PUT `/questions/{id}`
Actualizar pregunta.

**Payload:** Campos a actualizar (parcial)

**Respuesta:**
```json
{
  "id": "string",
  "...": "campos actualizados de BankQuestion"
}
```

---

### DELETE `/questions/{id}`
Eliminar pregunta del banco.

**Respuesta:**
```json
{
  "success": true
}
```

---

## 🏷️ Temas (Topics)

### GET `/topics`
Obtener lista de temas del profesor.

**Respuesta:**
```json
[
  {
    "id": "string",
    "teacher_id": "string",
    "subject_id": "string",
    "name": "string",
    "description": "string | null",
    "color": "string",
    "created_at": "string (ISO)"
  }
]
```

---

### GET `/topics/{id}`
Obtener un tema por ID.

**Respuesta:**
```json
{
  "id": "string",
  "teacher_id": "string",
  "subject_id": "string",
  "name": "string",
  "description": "string | null",
  "color": "string",
  "created_at": "string (ISO)"
}
```

---

### POST `/topics`
Crear nuevo tema.

**Payload:**
```json
{
  "subject_id": "string",
  "name": "string",
  "description": "string | null",
  "color": "string"
}
```

**Respuesta:**
```json
{
  "id": "string",
  "teacher_id": "string",
  "subject_id": "string",
  "name": "string",
  "description": "string | null",
  "color": "string",
  "created_at": "string (ISO)"
}
```

---

### PUT `/topics/{id}`
Actualizar tema.

**Payload:**
```json
{
  "name": "string",
  "description": "string | null",
  "color": "string"
}
```

**Respuesta:**
```json
{
  "id": "string",
  "teacher_id": "string",
  "subject_id": "string",
  "name": "string",
  "description": "string | null",
  "color": "string",
  "created_at": "string (ISO)"
}
```

---

### DELETE `/topics/{id}`
Eliminar tema.

**Respuesta:**
```json
{
  "success": true
}
```

---

## 📖 Asignaturas (Subjects)

### GET `/subjects`
Obtener lista de asignaturas del profesor.

**Respuesta:**
```json
[
  {
    "id": "string",
    "teacher_id": "string",
    "name": "string",
    "description": "string | null",
    "color": "string",
    "created_at": "string (ISO)"
  }
]
```

---

### GET `/subjects/{id}`
Obtener una asignatura por ID.

**Respuesta:**
```json
{
  "id": "string",
  "teacher_id": "string",
  "name": "string",
  "description": "string | null",
  "color": "string",
  "created_at": "string (ISO)"
}
```

---

### POST `/subjects`
Crear nueva asignatura.

**Payload:**
```json
{
  "name": "string",
  "description": "string | null",
  "color": "string"
}
```

**Respuesta:**
```json
{
  "id": "string",
  "teacher_id": "string",
  "name": "string",
  "description": "string | null",
  "color": "string",
  "created_at": "string (ISO)"
}
```

---

### PUT `/subjects/{id}`
Actualizar asignatura.

**Payload:**
```json
{
  "name": "string",
  "description": "string | null",
  "color": "string"
}
```

**Respuesta:**
```json
{
  "id": "string",
  "teacher_id": "string",
  "name": "string",
  "description": "string | null",
  "color": "string",
  "created_at": "string (ISO)"
}
```

---

### DELETE `/subjects/{id}`
Eliminar asignatura.

**Respuesta:**
```json
{
  "success": true
}
```

---

## 📊 Niveles (Levels)

### GET `/levels`
Obtener lista de niveles del profesor.

**Respuesta:**
```json
[
  {
    "id": "string",
    "teacher_id": "string",
    "name": "string",
    "description": "string | null",
    "created_at": "string (ISO)"
  }
]
```

---

### GET `/levels/{id}`
Obtener un nivel por ID.

**Respuesta:**
```json
{
  "id": "string",
  "teacher_id": "string",
  "name": "string",
  "description": "string | null",
  "created_at": "string (ISO)"
}
```

---

### POST `/levels`
Crear nuevo nivel.

**Payload:**
```json
{
  "name": "string",
  "description": "string | null"
}
```

**Respuesta:**
```json
{
  "id": "string",
  "teacher_id": "string",
  "name": "string",
  "description": "string | null",
  "created_at": "string (ISO)"
}
```

---

### PUT `/levels/{id}`
Actualizar nivel.

**Payload:**
```json
{
  "name": "string",
  "description": "string | null"
}
```

**Respuesta:**
```json
{
  "id": "string",
  "teacher_id": "string",
  "name": "string",
  "description": "string | null",
  "created_at": "string (ISO)"
}
```

---

### DELETE `/levels/{id}`
Eliminar nivel.

**Respuesta:**
```json
{
  "success": true
}
```

---

## 📋 Asignaciones (Assignments)

### GET `/assignments`
Obtener lista de asignaciones de exámenes.

**Respuesta:**
```json
[
  {
    "id": "string",
    "exam_assignment_id": "string",
    "exam_id": "string",
    "student_id": "string",
    "magic_token": "string",
    "assigned_at": "string (ISO)",
    "started_at": "string (ISO) | null",
    "submitted_at": "string (ISO) | null",
    "status": "pending | in_progress | submitted | graded"
  }
]
```

---

### GET `/assignments/{id}`
Obtener una asignación por ID.

**Respuesta:**
```json
{
  "id": "string",
  "exam_assignment_id": "string",
  "exam_id": "string",
  "student_id": "string",
  "magic_token": "string",
  "assigned_at": "string (ISO)",
  "started_at": "string (ISO) | null",
  "submitted_at": "string (ISO) | null",
  "status": "pending | in_progress | submitted | graded"
}
```

---

### GET `/assignments/{id}/grading`
Obtener datos completos para calificar una asignación.

**Respuesta:**
```json
{
  "assignment": {
    "id": "string",
    "exam_assignment_id": "string",
    "exam_id": "string",
    "student_id": "string",
    "magic_token": "string",
    "assigned_at": "string (ISO)",
    "started_at": "string (ISO) | null",
    "submitted_at": "string (ISO) | null",
    "status": "pending | in_progress | submitted | graded"
  },
  "student": {
    "id": "string",
    "full_name": "string",
    "email": "string",
    "...": "otros campos de Student"
  },
  "exam": {
    "id": "string",
    "title": "string",
    "...": "otros campos de Exam"
  },
  "questions": ["BankQuestion[]"],
  "answers": [
    {
      "id": "string",
      "assignment_id": "string",
      "question_id": "string",
      "selected_option_id": "string | null",
      "answer_text": "string | null",
      "answer_latex": "string | null",
      "score": "2 | 3 | 4 | 5",
      "feedback": "string | null",
      "created_at": "string (ISO)"
    }
  ],
  "events": [
    {
      "id": "string",
      "assignment_id": "string",
      "event_type": "string",
      "severity": "info | warning | critical",
      "timestamp": "string (ISO)",
      "details": "object"
    }
  ],
  "existingGrade": {
    "id": "string",
    "assignment_id": "string",
    "average_score": "number",
    "final_grade": "2 | 3 | 4 | 5",
    "rounding_method": "floor | ceil",
    "graded_at": "string (ISO)",
    "graded_by": "string | null"
  } | null
}
```

---

### GET `/assignments/token/{token}`
Obtener examen por magic token (usado por estudiantes).

**Respuesta:**
```json
{
  "assignment": {
    "id": "string",
    "status": "pending | in_progress | submitted | graded",
    "started_at": "string (ISO) | null",
    "submitted_at": "string (ISO) | null"
  },
  "exam": {
    "id": "string",
    "title": "string",
    "description": "string | null",
    "duration_minutes": "number | null",
    "config": "ExamConfig"
  },
  "student": {
    "id": "string",
    "full_name": "string"
  },
  "questions": ["BankQuestion[] (con opciones mezcladas si aplica)"],
  "answers": ["StudentAnswer[] (respuestas existentes)"]
}
```

---

### POST `/assignments/start`
Iniciar un examen.

**Payload:**
```json
{
  "assignment_id": "string"
}
```

**Respuesta:**
```json
{
  "success": true,
  "assignment": {
    "id": "string",
    "status": "in_progress",
    "started_at": "string (ISO)",
    "...": "otros campos"
  }
}
```

---

### POST `/assignments/answer`
Guardar respuesta de una pregunta.

**Payload:**
```json
{
  "assignment_id": "string",
  "question_id": "string",
  "selected_option_id": "string | null",
  "answer_text": "string | null"
}
```

**Respuesta:**
```json
{
  "answer": {
    "id": "string",
    "assignment_id": "string",
    "question_id": "string",
    "selected_option_id": "string | null",
    "answer_text": "string | null",
    "answer_latex": "string | null",
    "score": "2 | 3 | 4 | 5",
    "feedback": "string | null",
    "created_at": "string (ISO)"
  }
}
```

---

### POST `/assignments/submit`
Enviar examen completado.

**Payload:**
```json
{
  "assignment_id": "string"
}
```

**Respuesta:**
```json
{
  "success": true,
  "assignment": {
    "id": "string",
    "status": "submitted",
    "submitted_at": "string (ISO)",
    "...": "otros campos"
  }
}
```

---

## ✅ Calificaciones (Grades)

### GET `/grades`
Obtener lista de calificaciones.

**Respuesta:**
```json
[
  {
    "id": "string",
    "assignment_id": "string",
    "average_score": "number",
    "final_grade": "2 | 3 | 4 | 5",
    "rounding_method": "floor | ceil",
    "graded_at": "string (ISO)",
    "graded_by": "string | null"
  }
]
```

---

### PUT `/grades/answer/{answerId}`
Calificar una respuesta individual.

**Payload:**
```json
{
  "score": "2 | 3 | 4 | 5",
  "feedback": "string | null"
}
```

**Respuesta:**
```json
{
  "answer": {
    "id": "string",
    "assignment_id": "string",
    "question_id": "string",
    "selected_option_id": "string | null",
    "answer_text": "string | null",
    "answer_latex": "string | null",
    "score": "2 | 3 | 4 | 5",
    "feedback": "string | null",
    "created_at": "string (ISO)"
  }
}
```

---

### POST `/grades/submit`
Enviar calificación final de un examen.

**Payload:**
```json
{
  "assignment_id": "string",
  "average_score": "number",
  "final_grade": "2 | 3 | 4 | 5",
  "rounding_method": "floor | ceil",
  "graded_by": "string"
}
```

**Respuesta:**
```json
{
  "grade": {
    "id": "string",
    "assignment_id": "string",
    "average_score": "number",
    "final_grade": "2 | 3 | 4 | 5",
    "rounding_method": "floor | ceil",
    "graded_at": "string (ISO)",
    "graded_by": "string"
  }
}
```

---

## 🔍 Monitoreo de Exámenes

### GET `/exam/events?assignment_id={id}`
Obtener eventos de monitoreo de una asignación.

**Query Params:**
- `assignment_id` (requerido): ID de la asignación

**Respuesta:**
```json
[
  {
    "id": "string",
    "assignment_id": "string",
    "event_type": "tab_hidden | tab_visible | window_blur | ...",
    "severity": "info | warning | critical",
    "timestamp": "string (ISO)",
    "details": {
      "duration_seconds": "number (opcional)",
      "message": "string (opcional)"
    }
  }
]
```

---

### POST `/exam/events`
Registrar evento de monitoreo durante un examen.

**Payload:**
```json
{
  "assignment_id": "string",
  "event_type": "tab_hidden | tab_visible | window_blur | window_focus | copy | paste | cut | right_click | fullscreen_exit | devtools_open | screenshot_attempt | print_attempt | keyboard_shortcut | idle_timeout | rapid_answers | browser_resize | connection_lost | connection_restored | exam_started | exam_submitted",
  "severity": "info | warning | critical",
  "timestamp": "string (ISO)",
  "details": {
    "duration_seconds": "number (opcional)",
    "pasted_length": "number (opcional)",
    "shortcut_keys": "string (opcional)",
    "idle_duration_seconds": "number (opcional)",
    "question_index": "number (opcional)",
    "answer_time_seconds": "number (opcional)",
    "window_dimensions": {
      "width": "number",
      "height": "number"
    },
    "message": "string (opcional)"
  }
}
```

**Respuesta:**
```json
{
  "success": true,
  "event": {
    "id": "string",
    "assignment_id": "string",
    "event_type": "string",
    "severity": "string",
    "timestamp": "string (ISO)",
    "details": "object"
  }
}
```

---

## 📊 Resumen de Endpoints

| Categoría | Cantidad | Métodos |
|-----------|----------|---------|
| Autenticación | 4 | POST(3), GET(1) |
| Estudiantes | 5 | GET(2), POST(1), PUT(1), DELETE(1) |
| Grupos | 5 | GET(2), POST(1), PUT(1), DELETE(1) |
| Exámenes | 6 | GET(2), POST(2), PUT(1), DELETE(1) |
| Configuración | 1 | GET(1) |
| Preguntas | 5 | GET(2), POST(1), PUT(1), DELETE(1) |
| Temas | 5 | GET(2), POST(1), PUT(1), DELETE(1) |
| Asignaturas | 5 | GET(2), POST(1), PUT(1), DELETE(1) |
| Niveles | 5 | GET(2), POST(1), PUT(1), DELETE(1) |
| Asignaciones | 7 | GET(4), POST(3) |
| Calificaciones | 3 | GET(1), PUT(1), POST(1) |
| Monitoreo | 2 | GET(1), POST(1) |
| **TOTAL** | **53** | |
