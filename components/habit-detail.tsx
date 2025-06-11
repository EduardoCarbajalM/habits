"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis } from "recharts"
import { ArrowLeft, Calendar, TrendingUp, Award, Edit3, Save, CheckCircle2, Target } from "lucide-react"

// Datos de ejemplo
const habitData = {
  id: 1,
  name: "Beber Agua",
  type: "numeric" as const,
  target: 8,
  unit: "vasos",
  streak: 12,
  bestStreak: 25,
  totalDays: 45,
  description: "Mantenerme hidratado bebiendo suficiente agua durante el día",
}

const progressData = [
  { date: "2024-01-01", value: 6 },
  { date: "2024-01-02", value: 8 },
  { date: "2024-01-03", value: 7 },
  { date: "2024-01-04", value: 8 },
  { date: "2024-01-05", value: 5 },
  { date: "2024-01-06", value: 8 },
  { date: "2024-01-07", value: 9 },
]

const dailyRecords = [
  { date: "2024-01-07", value: 5, target: 8, completed: false, notes: "Día ocupado, olvidé beber suficiente" },
  { date: "2024-01-06", value: 8, target: 8, completed: true, notes: "¡Perfecto! Me sentí muy bien" },
  { date: "2024-01-05", value: 8, target: 8, completed: true, notes: "" },
  { date: "2024-01-04", value: 7, target: 8, completed: false, notes: "Casi lo logro" },
  { date: "2024-01-03", value: 8, target: 8, completed: true, notes: "Excelente día" },
]

export default function HabitDetail() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [todayProgress, setTodayProgress] = useState(5)
  const [todayNotes, setTodayNotes] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  const completionRate = Math.round((dailyRecords.filter((r) => r.completed).length / dailyRecords.length) * 100)
  const todayRecord = dailyRecords.find((r) => r.date === selectedDate)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                {habitData.name}
                <Button variant="ghost" size="icon" className="ml-2">
                  <Edit3 className="w-4 h-4" />
                </Button>
              </h1>
              <p className="text-slate-600">{habitData.description}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/70 backdrop-blur border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Racha Actual</CardTitle>
              <Award className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{habitData.streak}</div>
              <p className="text-xs text-slate-600">días consecutivos</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Mejor Racha</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{habitData.bestStreak}</div>
              <p className="text-xs text-slate-600">récord personal</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Tasa de Éxito</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{completionRate}%</div>
              <Progress value={completionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Días Totales</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{habitData.totalDays}</div>
              <p className="text-xs text-slate-600">días registrados</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Registro de Hoy */}
          <Card className="bg-white/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-slate-800">Registro de Hoy</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString("es-ES", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="progress">Progreso Actual</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="progress"
                    type="number"
                    value={todayProgress}
                    onChange={(e) => setTodayProgress(Number(e.target.value))}
                    className="bg-white/70"
                    min="0"
                    max={habitData.target * 2}
                  />
                  <span className="text-sm text-slate-600">
                    / {habitData.target} {habitData.unit}
                  </span>
                </div>
                <Progress value={(todayProgress / habitData.target) * 100} className="h-3" />
                <p className="text-sm text-slate-600">
                  {todayProgress >= habitData.target ? (
                    <span className="text-green-600 flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      ¡Meta completada!
                    </span>
                  ) : (
                    `Faltan ${habitData.target - todayProgress} ${habitData.unit}`
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas del día (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="¿Cómo te fue hoy? Agrega tus observaciones..."
                  value={todayNotes}
                  onChange={(e) => setTodayNotes(e.target.value)}
                  className="bg-white/70 min-h-[80px]"
                />
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Save className="w-4 h-4 mr-2" />
                Guardar Progreso
              </Button>
            </CardContent>
          </Card>

          {/* Gráfico de Progreso */}
          <Card className="lg:col-span-2 bg-white/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-slate-800">Progreso Histórico</CardTitle>
              <CardDescription>Últimos 7 días de seguimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: {
                    label: "Progreso",
                    color: "hsl(var(--chart-1))",
                  },
                  target: {
                    label: "Meta",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <LineChart data={progressData}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
                    }
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={() => habitData.target}
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Historial de Registros */}
        <Card className="bg-white/70 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-slate-800">Historial de Registros</CardTitle>
            <CardDescription>Revisa y edita tus registros anteriores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailyRecords.map((record, index) => (
                <div
                  key={record.date}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/50 border border-slate-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {record.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                      )}
                      <div>
                        <p className="font-medium text-slate-800">
                          {new Date(record.date).toLocaleDateString("es-ES", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-slate-600">
                          {record.value}/{record.target} {habitData.unit}
                          {record.notes && ` • ${record.notes}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={(record.value / record.target) * 100} className="w-20 h-2" />
                    <Button variant="ghost" size="icon">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
