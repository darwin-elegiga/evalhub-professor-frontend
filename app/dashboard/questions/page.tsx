"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useHeaderActions } from "@/lib/header-actions-context";
import { apiClient } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";
import type {
  BankQuestion,
  Subject,
  QuestionType,
  QuestionDifficulty,
} from "@/lib/types";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { downloadQuestions } from "@/lib/export-import";
import { ImportDialog } from "@/components/import-dialog";
import type { QuestionBankExport, ExamExport } from "@/lib/export-import";

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Opción Múltiple",
  numeric: "Numérica",
  graph_click: "Click en Gráfico",
  image_hotspot: "Zona en Imagen",
  open_text: "Respuesta Abierta",
};

const DIFFICULTY_LABELS: Record<QuestionDifficulty, string> = {
  easy: "Fácil",
  medium: "Medio",
  hard: "Difícil",
};

const DIFFICULTY_COLORS: Record<QuestionDifficulty, string> = {
  easy: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  hard: "bg-red-100 text-red-800",
};

const SUBJECT_COLORS: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  orange: "bg-orange-100 text-orange-800",
  purple: "bg-purple-100 text-purple-800",
  red: "bg-red-100 text-red-800",
  pink: "bg-pink-100 text-pink-800",
  cyan: "bg-cyan-100 text-cyan-800",
  yellow: "bg-yellow-100 text-yellow-800",
  indigo: "bg-indigo-100 text-indigo-800",
  teal: "bg-teal-100 text-teal-800",
};

export default function QuestionBankPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { setActions, clearActions } = useHeaderActions();
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  // Delete confirmation
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Header actions
  const openImportDialog = useCallback(() => setImportDialogOpen(true), []);

  useEffect(() => {
    setActions([
      {
        label: "Nueva Pregunta",
        onClick: () => (window.location.href = "/dashboard/questions/create"),
      },
    ]);
    return () => clearActions();
  }, [setActions, clearActions]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const params = new URLSearchParams();
      if (subjectFilter !== "all") params.append("subjectId", subjectFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (difficultyFilter !== "all")
        params.append("difficulty", difficultyFilter);

      const queryString = params.toString();
      const questionsEndpoint = queryString
        ? `${API_CONFIG.ENDPOINTS.QUESTIONS}?${queryString}`
        : API_CONFIG.ENDPOINTS.QUESTIONS;

      const [questionsData, subjectsData] = await Promise.all([
        apiClient.get<BankQuestion[]>(questionsEndpoint),
        apiClient.get<Subject[]>(API_CONFIG.ENDPOINTS.SUBJECTS),
      ]);
      setQuestions(questionsData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  // Reload when filters change (for API filtering)
  useEffect(() => {
    if (user && !loadingData) {
      loadData();
    }
  }, [subjectFilter, typeFilter, difficultyFilter]);

  const getSubjectById = (id: string | null) => {
    if (!id) return null;
    return subjects.find((s) => s.id === id);
  };

  const handleExportAll = () => {
    if (questions.length === 0) return;
    downloadQuestions(questions, []);
  };

  const handleExportFiltered = () => {
    if (filteredQuestions.length === 0) return;
    downloadQuestions(
      filteredQuestions,
      [],
      `preguntas-filtradas-${new Date().toISOString().split("T")[0]}`
    );
  };

  const handleImport = async (data: QuestionBankExport | ExamExport) => {
    if (data.type !== "question_bank") return;

    const importData = data as QuestionBankExport;
    console.log("Importing questions:", importData.questions.length);

    // In real implementation, this would call the API to save the questions
    // For now, we'll just show a success message
    alert(
      `Se importaron ${importData.questions.length} preguntas correctamente`
    );

    // Reload data
    loadData();
  };

  const handleDuplicate = async (question: BankQuestion) => {
    try {
      const duplicatePayload = {
        title: `${question.title} (copia)`,
        content: question.content,
        questionType: question.questionType,
        typeConfig: question.typeConfig,
        difficulty: question.difficulty,
        estimatedTimeMinutes: question.estimatedTimeMinutes,
        tags: question.tags,
        weight: question.weight,
        subjectId: question.subjectId,
        topicId: null,
      };
      const newQuestion = await apiClient.post<BankQuestion>(
        API_CONFIG.ENDPOINTS.QUESTIONS,
        duplicatePayload
      );
      setQuestions((prev) => [...prev, newQuestion]);
    } catch (error) {
      console.error("Error duplicating question:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteQuestionId) return;
    setIsDeleting(true);

    try {
      await apiClient.delete(
        API_CONFIG.ENDPOINTS.QUESTION_BY_ID(deleteQuestionId)
      );
      setQuestions((prev) => prev.filter((q) => q.id !== deleteQuestionId));
      setDeleteQuestionId(null);
    } catch (error) {
      console.error("Error deleting question:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Client-side filtering (for mock data or additional search)
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

    // If using API, filters are already applied server-side
    return matchesSearch;
  });

  if (loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando preguntas...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            {questions.length} preguntas en tu banco
          </p>
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 min-w-max">
              <Button variant="outline" size="sm" onClick={openImportDialog}>
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={questions.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportAll}>
                    Exportar todas ({questions.length})
                  </DropdownMenuItem>
                  {filteredQuestions.length !== questions.length && (
                    <DropdownMenuItem onClick={handleExportFiltered}>
                      Exportar filtradas ({filteredQuestions.length})
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4 sm:pt-6">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título o tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-2 min-w-max pb-1">
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="w-[160px] sm:w-[180px]">
                      <SelectValue placeholder="Asignatura" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las asignaturas</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px] sm:w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={difficultyFilter}
                    onValueChange={setDifficultyFilter}
                  >
                    <SelectTrigger className="w-[120px] sm:w-[180px]">
                      <SelectValue placeholder="Dificultad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredQuestions.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="flex h-64 flex-col items-center justify-center">
              <p className="mb-4 text-muted-foreground">
                {questions.length === 0
                  ? "No tienes preguntas en tu banco"
                  : "No se encontraron preguntas con esos filtros"}
              </p>
              {questions.length === 0 && (
                <Button asChild>
                  <Link href="/dashboard/questions/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear tu primera pregunta
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredQuestions.map((question) => {
              const subject = getSubjectById(question.subjectId);

              return (
                <Card
                  key={question.id}
                  className="border-gray-200 shadow-sm transition-shadow hover:shadow-md cursor-pointer"
                  onClick={() =>
                    router.push(`/dashboard/questions/${question.id}`)
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {question.title}
                        </CardTitle>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {subject && (
                            <Badge
                              variant="secondary"
                              className={
                                SUBJECT_COLORS[subject.color] ||
                                "bg-gray-100 text-gray-800"
                              }
                            >
                              {subject.name}
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {QUESTION_TYPE_LABELS[question.questionType]}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={DIFFICULTY_COLORS[question.difficulty]}
                          >
                            {DIFFICULTY_LABELS[question.difficulty]}
                          </Badge>
                          <Badge variant="secondary" title="Peso relativo">
                            ×{question.weight}
                          </Badge>
                          {question.estimatedTimeMinutes && (
                            <Badge variant="secondary">
                              ~{question.estimatedTimeMinutes} min
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/questions/${question.id}/edit`}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(question)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setDeleteQuestionId(question.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="prose prose-sm max-w-none line-clamp-2 text-muted-foreground"
                      dangerouslySetInnerHTML={{
                        __html:
                          question.content
                            .replace(/<[^>]*>/g, " ")
                            .slice(0, 200) + "...",
                      }}
                    />
                    <div className="mt-3 flex flex-wrap gap-1">
                      {question.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    {(question.timesUsed !== undefined ||
                      question.averageScore !== undefined) && (
                      <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                        {question.timesUsed !== undefined && (
                          <span>Usado {question.timesUsed} veces</span>
                        )}
                        {question.averageScore !== undefined &&
                          question.averageScore !== null && (
                            <span>
                              Promedio:{" "}
                              {(question.averageScore * 100).toFixed(0)}%
                            </span>
                          )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Import Dialog */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        type="questions"
        onImport={handleImport}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteQuestionId}
        onOpenChange={(open) => !open && setDeleteQuestionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pregunta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La pregunta será eliminada
              permanentemente del banco de preguntas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
