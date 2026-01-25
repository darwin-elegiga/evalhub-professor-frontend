"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";
import type {
  Subject,
  QuestionTopic,
  QuestionType,
  QuestionDifficulty,
  MultipleChoiceConfig,
  NumericConfig,
  GraphClickConfig,
} from "@/lib/types";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  GripVertical,
  MousePointer,
  Eye,
} from "lucide-react";
import { GraphEditor, type GraphConfig } from "@/components/graph-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TiptapEditor } from "@/components/tiptap-editor";
import Link from "next/link";
import { toast } from "sonner";

const QUESTION_TYPES: {
  value: QuestionType;
  label: string;
  description: string;
}[] = [
  {
    value: "multiple_choice",
    label: "Opción Múltiple",
    description: "El estudiante selecciona una o más opciones correctas",
  },
  {
    value: "numeric",
    label: "Numérica",
    description: "El estudiante ingresa un valor numérico con tolerancia",
  },
  {
    value: "graph_click",
    label: "Gráfico",
    description: "Incluye un gráfico (orientativo o interactivo)",
  },
  {
    value: "open_text",
    label: "Respuesta Abierta",
    description: "El estudiante escribe una respuesta de texto libre",
  },
];

const DIFFICULTY_OPTIONS: { value: QuestionDifficulty; label: string }[] = [
  { value: "easy", label: "Fácil" },
  { value: "medium", label: "Medio" },
  { value: "hard", label: "Difícil" },
];

// Validation schema
const questionSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  content: z.string().min(1, "El enunciado es requerido"),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  question_type: z.enum([
    "multiple_choice",
    "numeric",
    "graph_click",
    "image_hotspot",
    "open_text",
  ]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  estimated_time_minutes: z.number().min(1).max(120).optional(),
  weight: z.number().min(1).max(10), // Peso relativo de la pregunta en el examen
  tags: z.array(z.string()),
});

type QuestionFormData = z.infer<typeof questionSchema>;

interface MultipleChoiceOption {
  id: string;
  text: string;
  is_correct: boolean;
}

export default function CreateQuestionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<QuestionTopic[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Question type specific state
  const [mcOptions, setMcOptions] = useState<MultipleChoiceOption[]>([
    { id: crypto.randomUUID(), text: "", is_correct: false },
  ]);
  const [mcAllowMultiple, setMcAllowMultiple] = useState(false);
  const [mcShuffleOptions, setMcShuffleOptions] = useState(true);

  // Numeric config state
  const [numericValue, setNumericValue] = useState<number>(0);
  const [numericValueStr, setNumericValueStr] = useState<string>("0");
  const [numericTolerance, setNumericTolerance] = useState<number>(5);
  const [numericToleranceStr, setNumericToleranceStr] = useState<string>("5");
  const [numericToleranceType, setNumericToleranceType] = useState<
    "percentage" | "absolute"
  >("percentage");
  const [numericUnit, setNumericUnit] = useState<string>("");

  // Graph config state
  const [graphConfig, setGraphConfig] = useState<GraphConfig>({
    xRange: [-10, 10],
    yRange: [-10, 10],
    xLabel: "x",
    yLabel: "y",
    showGrid: true,
    gridStep: 1,
    lines: [],
    functions: [],
    toleranceRadius: 0.5,
    isInteractive: false,
  });

  // Tags state
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Time input state (to allow free typing)
  const [timeInputStr, setTimeInputStr] = useState("5");

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      title: "",
      content: "",
      subjectId: "",
      topicId: "",
      question_type: "multiple_choice",
      difficulty: "medium",
      estimated_time_minutes: 5,
      weight: 1,
      tags: [],
    },
  });

  const questionType = watch("question_type");
  const selectedSubjectId = watch("subjectId");

  // Filter topics by selected subject
  const filteredTopics = selectedSubjectId
    ? topics.filter((t) => t.subjectId === selectedSubjectId)
    : [];

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      try {
        const [subjectsData, topicsData] = await Promise.all([
          apiClient.get<Subject[]>(API_CONFIG.ENDPOINTS.SUBJECTS),
          apiClient.get<QuestionTopic[]>(API_CONFIG.ENDPOINTS.TOPICS),
        ]);
        setSubjects(subjectsData);
        setTopics(topicsData);
      } catch (apiError) {
        console.warn(
          "Error loading from API, using mock data as fallback:",
          apiError
        );
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const addMcOption = () => {
    setMcOptions([
      ...mcOptions,
      { id: crypto.randomUUID(), text: "", is_correct: false },
    ]);
  };

  const removeMcOption = (id: string) => {
    if (mcOptions.length > 1) {
      setMcOptions(mcOptions.filter((opt) => opt.id !== id));
    }
  };

  const updateMcOption = (
    id: string,
    updates: Partial<MultipleChoiceOption>
  ) => {
    setMcOptions(
      mcOptions.map((opt) => (opt.id === id ? { ...opt, ...updates } : opt))
    );
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag];
      setTags(newTags);
      setValue("tags", newTags);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    setValue("tags", newTags);
  };

  const onSubmit = async (data: QuestionFormData) => {
    setIsSubmitting(true);

    try {
      // Build type config based on question type
      let typeConfig:
        | MultipleChoiceConfig
        | NumericConfig
        | GraphClickConfig
        | object = {};

      if (data.question_type === "multiple_choice") {
        const hasCorrect = mcOptions.some((opt) => opt.is_correct);
        if (!hasCorrect) {
          toast.error("Debe haber al menos una opción correcta");
          setIsSubmitting(false);
          return;
        }

        typeConfig = {
          options: mcOptions.map((opt, idx) => ({
            id: opt.id,
            text: opt.text,
            isCorrect: opt.is_correct,
            order: idx + 1,
          })),
          allowMultiple: mcAllowMultiple,
          shuffleOptions: mcShuffleOptions,
        };
      } else if (data.question_type === "numeric") {
        typeConfig = {
          correctValue: numericValue,
          tolerance: numericTolerance,
          toleranceType: numericToleranceType,
          unit: numericUnit || null,
          showUnitInput: false,
        };
      } else if (data.question_type === "graph_click") {
        // Validate graph config if interactive
        if (graphConfig.isInteractive) {
          const hasValidAnswer =
            (graphConfig.answerType === "point" && graphConfig.correctPoint) ||
            (graphConfig.answerType === "function" &&
              graphConfig.correctFunctionId) ||
            (graphConfig.answerType === "area" && graphConfig.correctArea) ||
            (!graphConfig.answerType && graphConfig.correctPoint);

          if (!hasValidAnswer) {
            toast.error(
              "Debes definir la respuesta correcta para preguntas interactivas"
            );
            setIsSubmitting(false);
            return;
          }
        }

        typeConfig = {
          graphType: "cartesian",
          imageUrl: null,
          correctPoint: graphConfig.correctPoint || { x: 0, y: 0 },
          toleranceRadius: graphConfig.toleranceRadius,
          xRange: graphConfig.xRange,
          yRange: graphConfig.yRange,
          xLabel: graphConfig.xLabel,
          yLabel: graphConfig.yLabel,
          title: graphConfig.title,
          showGrid: graphConfig.showGrid,
          gridStep: graphConfig.gridStep,
          lines: graphConfig.lines,
          functions: graphConfig.functions,
          isInteractive: graphConfig.isInteractive,
          answerType: graphConfig.answerType,
          correctFunctionId: graphConfig.correctFunctionId,
          correctArea: graphConfig.correctArea,
        };
      }

      // Build payload with camelCase for backend
      const questionData = {
        title: data.title,
        content: data.content,
        subjectId: data.subjectId || null,
        topicId: data.topicId || null,
        questionType: data.question_type,
        difficulty: data.difficulty,
        estimatedTimeMinutes: data.estimated_time_minutes,
        weight: data.weight,
        tags,
        typeConfig,
      };
      await apiClient.post(API_CONFIG.ENDPOINTS.QUESTIONS, questionData);
      toast.success("Pregunta creada exitosamente");
      router.push("/dashboard/questions");
    } catch (error) {
      console.error("Error creating question:", error);
      toast.error("Error al crear la pregunta");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Cargando...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-gray-100">
      <div className="container mx-auto p-4 sm:p-6 pb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/dashboard/questions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Volver al Banco</span>
            <span className="sm:hidden">Volver</span>
          </Link>
        </Button>

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Crear Nueva Pregunta
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Agrega una pregunta a tu banco de preguntas
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Información Básica</CardTitle>
              <CardDescription className="text-sm">
                Título y metadatos de la pregunta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="space-y-2">
                <Label htmlFor="title">Título (para identificación)</Label>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="title"
                      placeholder="Ej: Cálculo de altura máxima en tiro vertical"
                    />
                  )}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Asignatura</Label>
                  <Controller
                    name="subjectId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Clear topic when subject changes
                          setValue("topicId", "");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una asignatura" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Controller
                    name="topicId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={
                          !selectedSubjectId || filteredTopics.length === 0
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !selectedSubjectId
                                ? "Primero selecciona una asignatura"
                                : filteredTopics.length === 0
                                ? "No hay temas para esta asignatura"
                                : "Selecciona un tema"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredTopics.map((topic) => (
                            <SelectItem key={topic.id} value={topic.id}>
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: topic.color }}
                                />
                                {topic.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Dificultad</Label>
                  <Controller
                    name="difficulty"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIFFICULTY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">
                    Peso: <span className="font-bold">{watch("weight")}</span>
                  </Label>
                  <Controller
                    name="weight"
                    control={control}
                    render={({ field }) => (
                      <Slider
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                        min={1}
                        max={10}
                        step={1}
                        className="py-2"
                      />
                    )}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 (bajo)</span>
                    <span>10 (alto)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Tiempo estimado (min)</Label>
                  <Controller
                    name="estimated_time_minutes"
                    control={control}
                    render={({ field }) => (
                      <Input
                        value={timeInputStr}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setTimeInputStr("");
                            field.onChange(undefined);
                          } else if (/^\d*$/.test(val)) {
                            setTimeInputStr(val);
                            const num = parseInt(val, 10);
                            if (!isNaN(num) && num >= 1 && num <= 120) {
                              field.onChange(num);
                            }
                          }
                        }}
                        onBlur={() => {
                          const num = parseInt(timeInputStr, 10);
                          if (timeInputStr === "" || isNaN(num) || num < 1) {
                            setTimeInputStr("5");
                            field.onChange(5);
                          } else if (num > 120) {
                            setTimeInputStr("120");
                            field.onChange(120);
                          }
                        }}
                        placeholder="5"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Agregar tag..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addTag} className="w-full sm:w-auto">
                    Agregar
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Question Content */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Enunciado de la Pregunta</CardTitle>
              <CardDescription className="text-sm">
                Usa el editor para escribir el enunciado. Puedes incluir
                ecuaciones LaTeX con $...$
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <TiptapEditor
                    content={field.value}
                    onChange={field.onChange}
                    placeholder="Escribe el enunciado de la pregunta..."
                    minHeight="200px"
                  />
                )}
              />
              {errors.content && (
                <p className="text-sm text-red-500 mt-2">
                  {errors.content.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Question Type */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Tipo de Pregunta</CardTitle>
              <CardDescription className="text-sm">
                Selecciona cómo responderán los estudiantes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <Controller
                name="question_type"
                control={control}
                render={({ field }) => (
                  <Tabs value={field.value} onValueChange={field.onChange}>
                    <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-hide">
                      <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-4">
                        {QUESTION_TYPES.map((type) => (
                          <TabsTrigger key={type.value} value={type.value} className="whitespace-nowrap">
                            {type.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>

                    {/* Multiple Choice Config */}
                    <TabsContent
                      value="multiple_choice"
                      className="space-y-4 mt-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="allowMultiple"
                            checked={mcAllowMultiple}
                            onCheckedChange={(checked) =>
                              setMcAllowMultiple(checked as boolean)
                            }
                          />
                          <Label htmlFor="allowMultiple" className="text-sm">
                            Permitir múltiples respuestas
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="shuffleOptions"
                            checked={mcShuffleOptions}
                            onCheckedChange={(checked) =>
                              setMcShuffleOptions(checked as boolean)
                            }
                          />
                          <Label htmlFor="shuffleOptions" className="text-sm">
                            Mezclar opciones
                          </Label>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Opciones de respuesta</Label>
                        {mcOptions.map((option, index) => (
                          <div
                            key={option.id}
                            className="flex items-start gap-2 rounded-md border p-2 sm:p-3"
                          >
                            <GripVertical className="hidden sm:block h-5 w-5 text-muted-foreground mt-2 cursor-grab shrink-0" />
                            <Checkbox
                              checked={option.is_correct}
                              onCheckedChange={(checked) =>
                                updateMcOption(option.id, {
                                  is_correct: checked as boolean,
                                })
                              }
                              className="mt-2 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <TiptapEditor
                                content={option.text}
                                onChange={(text) =>
                                  updateMcOption(option.id, { text })
                                }
                                placeholder={`Opción ${index + 1}`}
                                minHeight="60px"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeMcOption(option.id)}
                              disabled={mcOptions.length === 1}
                              className="shrink-0"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addMcOption}
                          className="w-full sm:w-auto"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar Opción
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Numeric Config */}
                    <TabsContent value="numeric" className="space-y-4 mt-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Valor correcto</Label>
                          <Input
                            value={numericValueStr}
                            onChange={(e) => {
                              const val = e.target.value;
                              // Allow empty, negative sign, decimal point, or valid numbers
                              if (
                                val === "" ||
                                val === "-" ||
                                val === "." ||
                                val === "-."
                              ) {
                                setNumericValueStr(val);
                                setNumericValue(0);
                              } else if (/^-?\d*\.?\d*$/.test(val)) {
                                setNumericValueStr(val);
                                const num = parseFloat(val);
                                if (!isNaN(num)) {
                                  setNumericValue(num);
                                }
                              }
                            }}
                            onBlur={() => {
                              // Clean up on blur
                              if (
                                numericValueStr === "" ||
                                numericValueStr === "-" ||
                                numericValueStr === "." ||
                                numericValueStr === "-."
                              ) {
                                setNumericValueStr("0");
                                setNumericValue(0);
                              }
                            }}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Unidad (opcional)</Label>
                          <Input
                            value={numericUnit}
                            onChange={(e) => setNumericUnit(e.target.value)}
                            placeholder="Ej: m/s, kg, J"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Tolerancia</Label>
                          <Input
                            value={numericToleranceStr}
                            onChange={(e) => {
                              const val = e.target.value;
                              // Allow empty, decimal point, or positive numbers
                              if (val === "" || val === ".") {
                                setNumericToleranceStr(val);
                                setNumericTolerance(0);
                              } else if (/^\d*\.?\d*$/.test(val)) {
                                setNumericToleranceStr(val);
                                const num = parseFloat(val);
                                if (!isNaN(num)) {
                                  setNumericTolerance(num);
                                }
                              }
                            }}
                            onBlur={() => {
                              // Clean up on blur
                              if (
                                numericToleranceStr === "" ||
                                numericToleranceStr === "."
                              ) {
                                setNumericToleranceStr("0");
                                setNumericTolerance(0);
                              }
                            }}
                            placeholder="5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo de tolerancia</Label>
                          <Select
                            value={numericToleranceType}
                            onValueChange={(v) =>
                              setNumericToleranceType(
                                v as "percentage" | "absolute"
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">
                                Porcentaje (%)
                              </SelectItem>
                              <SelectItem value="absolute">
                                Valor absoluto
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-sm text-blue-700">
                          <strong>Rango aceptado:</strong>{" "}
                          {numericToleranceType === "percentage"
                            ? `${(
                                numericValue *
                                (1 - numericTolerance / 100)
                              ).toFixed(2)} a ${(
                                numericValue *
                                (1 + numericTolerance / 100)
                              ).toFixed(2)}`
                            : `${numericValue - numericTolerance} a ${
                                numericValue + numericTolerance
                              }`}
                          {numericUnit && ` ${numericUnit}`}
                        </p>
                      </div>
                    </TabsContent>

                    {/* Graph Click Config */}
                    <TabsContent value="graph_click" className="space-y-4 mt-4">
                      {/* Mode Selector - Minimal */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-gray-600">Modo:</Label>
                          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                            <button
                              type="button"
                              onClick={() =>
                                setGraphConfig({
                                  ...graphConfig,
                                  isInteractive: false,
                                })
                              }
                              className={`px-2 sm:px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 sm:gap-2 ${
                                !graphConfig.isInteractive
                                  ? "bg-white text-gray-900 shadow-sm"
                                  : "text-gray-500 hover:text-gray-700"
                              }`}
                            >
                              <Eye className="h-4 w-4" />
                              Visual
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setGraphConfig({
                                  ...graphConfig,
                                  isInteractive: true,
                                })
                              }
                              className={`px-2 sm:px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 sm:gap-2 ${
                                graphConfig.isInteractive
                                  ? "bg-white text-gray-900 shadow-sm"
                                  : "text-gray-500 hover:text-gray-700"
                              }`}
                            >
                              <MousePointer className="h-4 w-4" />
                              Interactivo
                            </button>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {graphConfig.isInteractive
                            ? "El estudiante marca un punto como respuesta"
                            : "El gráfico es solo de referencia"}
                        </span>
                      </div>

                      {/* Graph Editor */}
                      <GraphEditor
                        config={graphConfig}
                        onChange={setGraphConfig}
                        mode="edit"
                      />

                      {/* Interactive mode info */}
                      {graphConfig.isInteractive && (
                        <div className="flex flex-col gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm sm:flex-row sm:items-center sm:gap-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-gray-400">
                              Punto correcto:
                            </span>
                            <span className="font-mono font-medium">
                              ({graphConfig.correctPoint?.x ?? 0},{" "}
                              {graphConfig.correctPoint?.y ?? 0})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-gray-400">Tolerancia:</span>
                            <span className="font-mono font-medium">
                              {graphConfig.toleranceRadius}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 sm:ml-auto">
                            Configura en la pestaña "Respuesta"
                          </span>
                        </div>
                      )}
                    </TabsContent>

                    {/* Open Text Config */}
                    <TabsContent value="open_text" className="mt-4">
                      <p className="text-muted-foreground">
                        Los estudiantes escribirán una respuesta libre. Deberás
                        calificar manualmente.
                      </p>
                    </TabsContent>
                  </Tabs>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Guardando..." : "Guardar Pregunta"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
