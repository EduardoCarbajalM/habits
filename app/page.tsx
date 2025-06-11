"use client"

import { useState } from "react"
import { Calendar, Plus, Target, TrendingUp, Award, CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, BarChart, Bar } from "recharts"

// Datos de ejemplo
const habits = [
  {
    id: 1,
    name: "Beber agua",
    type: "numeric",
    streak: 12,
    target: 8,
    unit: "vasos",
    todayProgress: 5,
    completed: false,
  },
  {
    id: 2,
    name: "Ejercicio",
    type: "boolean",
    streak: 7,
    completed: true,
  },
  {
    id: 3,
    name: "Leer",
    type: "numeric",
    streak: 5,
    target: 30,
    unit: "minutos",
    todayProgress: 25,
    completed: false,
  },
  {
    id: 4,
    name: "Meditar",
    type: "boolean",
    streak: 3,
    completed: false,
  },
]

const weeklyData = [
  { day: "Lun", completed: 3 },
  { day: "Mar", completed: 4 },
  { day: "Mié", completed: 2 },
  { day: "Jue", completed: 4 },
  { day: "Vie", completed: 3 },
  { day: "Sáb", completed: 4 },
  { day: "Dom", completed: 3 },
]

const monthlyData = [
  { week: "S1", progress: 85 },
  { week: "S2", progress: 92 },
  { week: "S3", progress: 78 },
  { week: "S4", progress: 88 },
]

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date())

  const totalHabits = habits.length
  const completedToday = habits.filter((h) => h.completed).length
  const completionRate = Math.round((completedToday / totalHabits) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Dashboard de Hábitos</h1>
            <p className="text-slate-600 mt-1">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Hábito
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/70 backdrop-blur border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Hábitos Totales</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{totalHabits}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Completados Hoy</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">
                {completedToday}/{totalHabits}
              </div>
              <Progress value={completionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Mejor Racha</CardTitle>
              <Award className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{Math.max(...habits.map((h) => h.streak))} días</div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Progreso Semanal</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{completionRate}%</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hábitos de Hoy */}
          <div className="lg:col-span-2">
            <Card className="bg-white/70 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-slate-800">Hábitos de Hoy</CardTitle>
                <CardDescription>Progreso de tus hábitos para hoy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/50 border border-slate-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {habit.completed ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : (
                          <Circle className="w-6 h-6 text-slate-400" />
                        )}
                        <div>
                          <h3 className="font-medium text-slate-800">{habit.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              🔥 {habit.streak} días
                            </Badge>
                            {habit.type === "numeric" && (
                              <span className="text-sm text-slate-600">
                                {habit.todayProgress}/{habit.target} {habit.unit}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {habit.type === "numeric" && (
                      <div className="w-24">
                        <Progress value={(habit.todayProgress / habit.target) * 100} className="h-2" />
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Calendario Mini */}
          <Card className="bg-white/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Calendario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                {["D", "L", "M", "X", "J", "V", "S"].map((day) => (
                  <div key={day} className="p-2 font-medium text-slate-600">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - 6
                  const isToday = day === new Date().getDate()
                  const hasProgress = Math.random() > 0.3

                  return (
                    <div
                      key={i}
                      className={`
                        aspect-square flex items-center justify-center text-xs rounded
                        ${day <= 0 ? "text-slate-300" : "text-slate-700"}
                        ${isToday ? "bg-blue-600 text-white font-bold" : ""}
                        ${hasProgress && day > 0 && !isToday ? "bg-green-100 text-green-800" : ""}
                        ${!hasProgress && day > 0 && !isToday ? "hover:bg-slate-100" : ""}
                      `}
                    >
                      {day > 0 ? day : ""}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-slate-800">Progreso Semanal</CardTitle>
              <CardDescription>Hábitos completados por día</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  completed: {
                    label: "Completados",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[200px]"
              >
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="completed" fill="#3b82f6" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-slate-800">Tendencia Mensual</CardTitle>
              <CardDescription>Porcentaje de progreso por semana</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  progress: {
                    label: "Progreso %",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[200px]"
              >
                <LineChart data={monthlyData}>
                  <XAxis dataKey="week" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="progress"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
