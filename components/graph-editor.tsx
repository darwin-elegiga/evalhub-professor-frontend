"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Trash2, Plus, Move, Target, Grid3X3, FunctionSquare } from "lucide-react"
import { cn } from "@/lib/utils"

export interface GraphPoint {
  x: number
  y: number
  label?: string
}

export interface GraphFunction {
  id: string
  expression: string // e.g., "x^2", "sin(x)", "2*x + 1"
  color: string
  label?: string
}

export interface GraphLine {
  id: string
  points: GraphPoint[]
  color: string
  label?: string
  type: "line" | "curve" | "scatter"
}

export interface GraphConfig {
  xRange: [number, number]
  yRange: [number, number]
  xLabel: string
  yLabel: string
  title?: string
  showGrid: boolean
  gridStep: number
  lines: GraphLine[]
  functions: GraphFunction[]
  correctPoint?: GraphPoint
  toleranceRadius: number
  isInteractive: boolean // If true, student can click to mark answer
}

interface GraphEditorProps {
  config: GraphConfig
  onChange: (config: GraphConfig) => void
  mode: "edit" | "preview" | "answer"
  onPointSelected?: (point: GraphPoint) => void
  selectedPoint?: GraphPoint | null
}

const COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
]

const DEFAULT_CONFIG: GraphConfig = {
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
}

// Safe math expression evaluator
function evaluateExpression(expression: string, x: number): number | null {
  try {
    // Replace common math functions and constants
    let expr = expression
      .replace(/\^/g, "**") // Power
      .replace(/sin\(/g, "Math.sin(")
      .replace(/cos\(/g, "Math.cos(")
      .replace(/tan\(/g, "Math.tan(")
      .replace(/sqrt\(/g, "Math.sqrt(")
      .replace(/abs\(/g, "Math.abs(")
      .replace(/log\(/g, "Math.log(")
      .replace(/ln\(/g, "Math.log(")
      .replace(/log10\(/g, "Math.log10(")
      .replace(/exp\(/g, "Math.exp(")
      .replace(/pi/gi, "Math.PI")
      .replace(/e(?![xp])/gi, "Math.E") // e but not exp or ex
      .replace(/asin\(/g, "Math.asin(")
      .replace(/acos\(/g, "Math.acos(")
      .replace(/atan\(/g, "Math.atan(")
      .replace(/floor\(/g, "Math.floor(")
      .replace(/ceil\(/g, "Math.ceil(")
      .replace(/round\(/g, "Math.round(")

    // Replace x with the value
    expr = expr.replace(/x/g, `(${x})`)

    // Validate expression (only allow safe characters)
    if (!/^[\d\s+\-*/().Math,sincotagqrtbexplfuPIE]+$/.test(expr)) {
      return null
    }

    // Evaluate
    const result = Function(`"use strict"; return (${expr})`)()

    if (typeof result !== "number" || !isFinite(result)) {
      return null
    }

    return result
  } catch {
    return null
  }
}

export function GraphEditor({
  config = DEFAULT_CONFIG,
  onChange,
  mode = "edit",
  onPointSelected,
  selectedPoint,
}: GraphEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [activeLine, setActiveLine] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPointIndex, setDragPointIndex] = useState<number | null>(null)
  const [functionInput, setFunctionInput] = useState("")
  const [functionError, setFunctionError] = useState<string | null>(null)

  const width = 500
  const height = 400
  const padding = 40

  // Convert graph coordinates to SVG coordinates
  const toSvgX = useCallback(
    (x: number) => {
      const [xMin, xMax] = config.xRange
      return padding + ((x - xMin) / (xMax - xMin)) * (width - 2 * padding)
    },
    [config.xRange]
  )

  const toSvgY = useCallback(
    (y: number) => {
      const [yMin, yMax] = config.yRange
      return height - padding - ((y - yMin) / (yMax - yMin)) * (height - 2 * padding)
    },
    [config.yRange]
  )

  // Convert SVG coordinates to graph coordinates
  const toGraphX = useCallback(
    (svgX: number) => {
      const [xMin, xMax] = config.xRange
      return xMin + ((svgX - padding) / (width - 2 * padding)) * (xMax - xMin)
    },
    [config.xRange]
  )

  const toGraphY = useCallback(
    (svgY: number) => {
      const [yMin, yMax] = config.yRange
      return yMin + ((height - padding - svgY) / (height - 2 * padding)) * (yMax - yMin)
    },
    [config.yRange]
  )

  // Handle click on graph (for adding points or selecting answer)
  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return

      const rect = svgRef.current.getBoundingClientRect()
      const svgX = e.clientX - rect.left
      const svgY = e.clientY - rect.top

      const graphX = Math.round(toGraphX(svgX) * 10) / 10
      const graphY = Math.round(toGraphY(svgY) * 10) / 10

      // Check if click is within graph area
      if (
        svgX < padding ||
        svgX > width - padding ||
        svgY < padding ||
        svgY > height - padding
      ) {
        return
      }

      if (mode === "answer" && onPointSelected) {
        onPointSelected({ x: graphX, y: graphY })
      } else if (mode === "edit" && activeLine) {
        // Add point to active line
        const lineIndex = config.lines.findIndex((l) => l.id === activeLine)
        if (lineIndex >= 0) {
          const newLines = [...config.lines]
          newLines[lineIndex] = {
            ...newLines[lineIndex],
            points: [...newLines[lineIndex].points, { x: graphX, y: graphY }],
          }
          onChange({ ...config, lines: newLines })
        }
      }
    },
    [mode, activeLine, config, onChange, onPointSelected, toGraphX, toGraphY]
  )

  // Generate grid lines
  const renderGrid = () => {
    if (!config.showGrid) return null

    const [xMin, xMax] = config.xRange
    const [yMin, yMax] = config.yRange
    const step = config.gridStep

    const lines = []

    // Vertical grid lines
    for (let x = Math.ceil(xMin / step) * step; x <= xMax; x += step) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={toSvgX(x)}
          y1={padding}
          x2={toSvgX(x)}
          y2={height - padding}
          stroke={x === 0 ? "#000" : "#e5e7eb"}
          strokeWidth={x === 0 ? 1.5 : 0.5}
        />
      )
    }

    // Horizontal grid lines
    for (let y = Math.ceil(yMin / step) * step; y <= yMax; y += step) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={padding}
          y1={toSvgY(y)}
          x2={width - padding}
          y2={toSvgY(y)}
          stroke={y === 0 ? "#000" : "#e5e7eb"}
          strokeWidth={y === 0 ? 1.5 : 0.5}
        />
      )
    }

    return lines
  }

  // Render axis labels
  const renderAxisLabels = () => {
    const [xMin, xMax] = config.xRange
    const [yMin, yMax] = config.yRange
    const step = config.gridStep

    const labels = []

    // X axis labels
    for (let x = Math.ceil(xMin / step) * step; x <= xMax; x += step) {
      if (x !== 0) {
        labels.push(
          <text
            key={`xl-${x}`}
            x={toSvgX(x)}
            y={height - padding + 15}
            textAnchor="middle"
            fontSize={10}
            fill="#6b7280"
          >
            {x}
          </text>
        )
      }
    }

    // Y axis labels
    for (let y = Math.ceil(yMin / step) * step; y <= yMax; y += step) {
      if (y !== 0) {
        labels.push(
          <text
            key={`yl-${y}`}
            x={padding - 10}
            y={toSvgY(y) + 4}
            textAnchor="end"
            fontSize={10}
            fill="#6b7280"
          >
            {y}
          </text>
        )
      }
    }

    // Axis names
    labels.push(
      <text
        key="x-label"
        x={width - padding + 10}
        y={toSvgY(0) + 4}
        textAnchor="start"
        fontSize={12}
        fontWeight="bold"
        fill="#374151"
      >
        {config.xLabel}
      </text>
    )

    labels.push(
      <text
        key="y-label"
        x={toSvgX(0) + 10}
        y={padding - 10}
        textAnchor="start"
        fontSize={12}
        fontWeight="bold"
        fill="#374151"
      >
        {config.yLabel}
      </text>
    )

    return labels
  }

  // Render mathematical functions
  const renderFunctions = () => {
    const [xMin, xMax] = config.xRange
    const [yMin, yMax] = config.yRange
    const numPoints = 200 // Number of points to sample
    const step = (xMax - xMin) / numPoints

    return (config.functions || []).map((func) => {
      const pathSegments: string[] = []
      let currentPath: string[] = []

      for (let i = 0; i <= numPoints; i++) {
        const x = xMin + i * step
        const y = evaluateExpression(func.expression, x)

        if (y !== null && y >= yMin && y <= yMax) {
          const svgX = toSvgX(x)
          const svgY = toSvgY(y)

          if (currentPath.length === 0) {
            currentPath.push(`M ${svgX} ${svgY}`)
          } else {
            currentPath.push(`L ${svgX} ${svgY}`)
          }
        } else {
          // Break in the function (undefined or out of range)
          if (currentPath.length > 1) {
            pathSegments.push(currentPath.join(" "))
          }
          currentPath = []
        }
      }

      // Don't forget the last segment
      if (currentPath.length > 1) {
        pathSegments.push(currentPath.join(" "))
      }

      if (pathSegments.length === 0) return null

      return (
        <g key={func.id}>
          {pathSegments.map((pathData, idx) => (
            <path
              key={idx}
              d={pathData}
              fill="none"
              stroke={func.color}
              strokeWidth={2.5}
            />
          ))}
          {/* Function label */}
          {func.label && (
            <text
              x={width - padding - 10}
              y={padding + 20 + (config.functions || []).indexOf(func) * 20}
              textAnchor="end"
              fontSize={12}
              fill={func.color}
              fontWeight="bold"
            >
              {func.label}
            </text>
          )}
        </g>
      )
    })
  }

  // Render data lines
  const renderLines = () => {
    return config.lines.map((line) => {
      if (line.points.length === 0) return null

      if (line.type === "scatter") {
        return (
          <g key={line.id}>
            {line.points.map((point, idx) => (
              <circle
                key={idx}
                cx={toSvgX(point.x)}
                cy={toSvgY(point.y)}
                r={mode === "edit" && activeLine === line.id ? 6 : 4}
                fill={line.color}
                className={cn(
                  mode === "edit" && "cursor-pointer",
                  activeLine === line.id && "stroke-2 stroke-white"
                )}
              />
            ))}
          </g>
        )
      }

      const pathData = line.points
        .map((point, idx) => {
          const x = toSvgX(point.x)
          const y = toSvgY(point.y)
          return idx === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
        })
        .join(" ")

      return (
        <g key={line.id}>
          <path
            d={pathData}
            fill="none"
            stroke={line.color}
            strokeWidth={2}
            className={cn(activeLine === line.id && "stroke-[3]")}
          />
          {line.points.map((point, idx) => (
            <circle
              key={idx}
              cx={toSvgX(point.x)}
              cy={toSvgY(point.y)}
              r={mode === "edit" && activeLine === line.id ? 6 : 3}
              fill={line.color}
              className={cn(
                mode === "edit" && "cursor-pointer",
                activeLine === line.id && "stroke-2 stroke-white"
              )}
            />
          ))}
        </g>
      )
    })
  }

  // Render correct point (for edit mode)
  const renderCorrectPoint = () => {
    if (!config.correctPoint || mode === "answer") return null

    return (
      <g>
        <circle
          cx={toSvgX(config.correctPoint.x)}
          cy={toSvgY(config.correctPoint.y)}
          r={
            (config.toleranceRadius / (config.xRange[1] - config.xRange[0])) *
            (width - 2 * padding)
          }
          fill="rgba(34, 197, 94, 0.2)"
          stroke="#22c55e"
          strokeWidth={2}
          strokeDasharray="5,5"
        />
        <circle
          cx={toSvgX(config.correctPoint.x)}
          cy={toSvgY(config.correctPoint.y)}
          r={6}
          fill="#22c55e"
        />
        <text
          x={toSvgX(config.correctPoint.x)}
          y={toSvgY(config.correctPoint.y) - 12}
          textAnchor="middle"
          fontSize={10}
          fill="#22c55e"
          fontWeight="bold"
        >
          Respuesta correcta
        </text>
      </g>
    )
  }

  // Render selected point (for answer mode)
  const renderSelectedPoint = () => {
    if (!selectedPoint) return null

    return (
      <g>
        <circle
          cx={toSvgX(selectedPoint.x)}
          cy={toSvgY(selectedPoint.y)}
          r={8}
          fill="#3b82f6"
          stroke="white"
          strokeWidth={2}
        />
        <text
          x={toSvgX(selectedPoint.x)}
          y={toSvgY(selectedPoint.y) - 12}
          textAnchor="middle"
          fontSize={10}
          fill="#3b82f6"
          fontWeight="bold"
        >
          ({selectedPoint.x}, {selectedPoint.y})
        </text>
      </g>
    )
  }

  // Add new line
  const addLine = () => {
    const newLine: GraphLine = {
      id: `line-${Date.now()}`,
      points: [],
      color: COLORS[config.lines.length % COLORS.length],
      type: "line",
    }
    onChange({ ...config, lines: [...config.lines, newLine] })
    setActiveLine(newLine.id)
  }

  // Remove line
  const removeLine = (id: string) => {
    onChange({ ...config, lines: config.lines.filter((l) => l.id !== id) })
    if (activeLine === id) setActiveLine(null)
  }

  // Clear all points from a line
  const clearLine = (id: string) => {
    const newLines = config.lines.map((l) =>
      l.id === id ? { ...l, points: [] } : l
    )
    onChange({ ...config, lines: newLines })
  }

  // Set correct point
  const setCorrectPoint = () => {
    const point = { x: 0, y: 0 }
    onChange({ ...config, correctPoint: point })
  }

  // Add a mathematical function
  const addFunction = () => {
    if (!functionInput.trim()) {
      setFunctionError("Ingresa una expresión")
      return
    }

    // Test the expression
    const testResult = evaluateExpression(functionInput.trim(), 1)
    if (testResult === null) {
      setFunctionError("Expresión inválida. Ejemplos: x^2, sin(x), 2*x+1")
      return
    }

    const newFunc: GraphFunction = {
      id: `func-${Date.now()}`,
      expression: functionInput.trim(),
      color: COLORS[(config.functions?.length || 0) % COLORS.length],
      label: `y = ${functionInput.trim()}`,
    }

    onChange({
      ...config,
      functions: [...(config.functions || []), newFunc],
    })
    setFunctionInput("")
    setFunctionError(null)
  }

  // Remove a function
  const removeFunction = (id: string) => {
    onChange({
      ...config,
      functions: (config.functions || []).filter((f) => f.id !== id),
    })
  }

  return (
    <div className="space-y-4">
      {/* Graph SVG */}
      <div className="border rounded-lg bg-white p-2 overflow-hidden">
        {config.title && (
          <h3 className="text-center font-medium mb-2">{config.title}</h3>
        )}
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className={cn(
            "mx-auto",
            (mode === "answer" || (mode === "edit" && activeLine)) &&
              "cursor-crosshair"
          )}
          onClick={handleSvgClick}
        >
          {/* Background */}
          <rect
            x={padding}
            y={padding}
            width={width - 2 * padding}
            height={height - 2 * padding}
            fill="#fafafa"
          />

          {/* Grid */}
          {renderGrid()}

          {/* Axis labels */}
          {renderAxisLabels()}

          {/* Mathematical functions */}
          {renderFunctions()}

          {/* Data lines */}
          {renderLines()}

          {/* Correct point indicator */}
          {renderCorrectPoint()}

          {/* Selected point (answer mode) */}
          {renderSelectedPoint()}

          {/* Border */}
          <rect
            x={padding}
            y={padding}
            width={width - 2 * padding}
            height={height - 2 * padding}
            fill="none"
            stroke="#d1d5db"
            strokeWidth={1}
          />
        </svg>
      </div>

      {/* Edit controls */}
      {mode === "edit" && (
        <Tabs defaultValue="functions" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="functions">Funciones</TabsTrigger>
            <TabsTrigger value="axes">Ejes</TabsTrigger>
            <TabsTrigger value="lines">Puntos</TabsTrigger>
            <TabsTrigger value="answer">Respuesta</TabsTrigger>
          </TabsList>

          <TabsContent value="functions" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Funciones soportadas:</strong> sin, cos, tan, sqrt, abs, log, ln, exp, asin, acos, atan
              </p>
              <p className="text-sm text-blue-600 mt-1">
                <strong>Constantes:</strong> pi, e | <strong>Operadores:</strong> +, -, *, /, ^ (potencia)
              </p>
              <p className="text-xs text-blue-500 mt-1">
                Ejemplos: x^2, sin(x), 2*x+1, sqrt(x), x^3-3*x, cos(2*pi*x)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Agregar función y = f(x)</Label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm font-medium">y =</span>
                  <Input
                    value={functionInput}
                    onChange={(e) => {
                      setFunctionInput(e.target.value)
                      setFunctionError(null)
                    }}
                    placeholder="x^2, sin(x), 2*x+1..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addFunction()
                      }
                    }}
                  />
                </div>
                <Button onClick={addFunction} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar
                </Button>
              </div>
              {functionError && (
                <p className="text-sm text-red-500">{functionError}</p>
              )}
            </div>

            {/* List of functions */}
            <div className="space-y-2">
              {(config.functions || []).length > 0 ? (
                (config.functions || []).map((func) => (
                  <Card key={func.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: func.color }}
                          />
                          <FunctionSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">
                            y = {func.expression}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={func.color}
                            onChange={(e) => {
                              const newFunctions = (config.functions || []).map((f) =>
                                f.id === func.id
                                  ? { ...f, color: e.target.value }
                                  : f
                              )
                              onChange({ ...config, functions: newFunctions })
                            }}
                            className="w-8 h-6 border rounded cursor-pointer"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFunction(func.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay funciones. Agrega una para graficarla.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="axes" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rango X</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={config.xRange[0]}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        xRange: [Number(e.target.value), config.xRange[1]],
                      })
                    }
                    placeholder="Min"
                  />
                  <Input
                    type="number"
                    value={config.xRange[1]}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        xRange: [config.xRange[0], Number(e.target.value)],
                      })
                    }
                    placeholder="Max"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rango Y</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={config.yRange[0]}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        yRange: [Number(e.target.value), config.yRange[1]],
                      })
                    }
                    placeholder="Min"
                  />
                  <Input
                    type="number"
                    value={config.yRange[1]}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        yRange: [config.yRange[0], Number(e.target.value)],
                      })
                    }
                    placeholder="Max"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Etiqueta eje X</Label>
                <Input
                  value={config.xLabel}
                  onChange={(e) =>
                    onChange({ ...config, xLabel: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Etiqueta eje Y</Label>
                <Input
                  value={config.yLabel}
                  onChange={(e) =>
                    onChange({ ...config, yLabel: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Título del gráfico</Label>
                <Input
                  value={config.title || ""}
                  onChange={(e) =>
                    onChange({ ...config, title: e.target.value || undefined })
                  }
                  placeholder="Opcional"
                />
              </div>

              <div className="space-y-2">
                <Label>Paso de la cuadrícula</Label>
                <Input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={config.gridStep}
                  onChange={(e) =>
                    onChange({ ...config, gridStep: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={config.showGrid}
                onCheckedChange={(checked) =>
                  onChange({ ...config, showGrid: checked })
                }
              />
              <Label>Mostrar cuadrícula</Label>
            </div>
          </TabsContent>

          <TabsContent value="lines" className="space-y-4">
            <Button onClick={addLine} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Agregar línea/función
            </Button>

            <div className="space-y-2">
              {config.lines.map((line, idx) => (
                <Card
                  key={line.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    activeLine === line.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setActiveLine(line.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: line.color }}
                        />
                        <span className="text-sm font-medium">
                          Línea {idx + 1}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({line.points.length} puntos)
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            clearLine(line.id)
                          }}
                        >
                          <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeLine(line.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {activeLine === line.id && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Haz clic en el gráfico para agregar puntos
                        </p>
                        <div className="mt-2 flex gap-2">
                          <select
                            className="text-xs border rounded px-2 py-1"
                            value={line.type}
                            onChange={(e) => {
                              const newLines = config.lines.map((l) =>
                                l.id === line.id
                                  ? {
                                      ...l,
                                      type: e.target.value as
                                        | "line"
                                        | "curve"
                                        | "scatter",
                                    }
                                  : l
                              )
                              onChange({ ...config, lines: newLines })
                            }}
                          >
                            <option value="line">Línea</option>
                            <option value="scatter">Puntos</option>
                          </select>
                          <input
                            type="color"
                            value={line.color}
                            onChange={(e) => {
                              const newLines = config.lines.map((l) =>
                                l.id === line.id
                                  ? { ...l, color: e.target.value }
                                  : l
                              )
                              onChange({ ...config, lines: newLines })
                            }}
                            className="w-8 h-6 border rounded"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {config.lines.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay líneas. Agrega una para empezar a dibujar.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="answer" className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={config.isInteractive}
                onCheckedChange={(checked) =>
                  onChange({ ...config, isInteractive: checked })
                }
              />
              <Label>Pregunta interactiva (estudiante marca punto)</Label>
            </div>

            {config.isInteractive && (
              <>
                <div className="space-y-2">
                  <Label>Punto correcto</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">X</Label>
                      <Input
                        type="number"
                        step={0.1}
                        value={config.correctPoint?.x ?? 0}
                        onChange={(e) =>
                          onChange({
                            ...config,
                            correctPoint: {
                              x: Number(e.target.value),
                              y: config.correctPoint?.y ?? 0,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Y</Label>
                      <Input
                        type="number"
                        step={0.1}
                        value={config.correctPoint?.y ?? 0}
                        onChange={(e) =>
                          onChange({
                            ...config,
                            correctPoint: {
                              x: config.correctPoint?.x ?? 0,
                              y: Number(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Radio de tolerancia</Label>
                  <Input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={config.toleranceRadius}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        toleranceRadius: Number(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    El estudiante acertará si marca dentro de este radio del
                    punto correcto
                  </p>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Answer mode info */}
      {mode === "answer" && (
        <p className="text-sm text-center text-muted-foreground">
          Haz clic en el gráfico para marcar tu respuesta
        </p>
      )}
    </div>
  )
}

// Simple viewer for displaying graphs (read-only)
export function GraphViewer({
  config,
  selectedPoint,
  showCorrectAnswer,
}: {
  config: GraphConfig
  selectedPoint?: GraphPoint | null
  showCorrectAnswer?: boolean
}) {
  return (
    <GraphEditor
      config={config}
      onChange={() => {}}
      mode="preview"
      selectedPoint={selectedPoint}
    />
  )
}
