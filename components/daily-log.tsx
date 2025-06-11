"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Save, CheckCircle2, Circle, Calendar, Award } from "lucide-react"

// Datos de ejemplo
const todayHabits = [
  {
    id: 1,
    name: "Beber agua",
    type: "numeric" as const,
    target: 8,
    unit: "vasos",
    currentValue: 5,
    completed: false,
    streak: 12,
  },
  {
    id: 2,
    name: "Ejercicio",
    type: "boolean" as const,
    completed: true,
    streak: 7,
  },
  {
    id: 3,
    name: "Leer",
    type: "numeric" as const,
    target: 30,
    unit: "minutos",
    currentValue: 25,
    completed: false,
    streak: 5,
  },
  {
    id: 4,
    name: "Meditar",
    type: "boolean" as const,
    completed: false,
    streak: 3,
  },
  {
    id: 5,
    name: "Caminar",
    type: "numeric" as const,
    target: 10000,
    unit: "pasos",
    currentValue: 7500,
    completed: false,
    streak: 8,
  },
]

export default function DailyLog() {
  const [habits, setHabits] = useState(todayHabits)
  const [notes, setNotes] = useState("")

  const updateHabitValue = (id: number, value: number | boolean) => {
    setHabits(
      habits.map((habit) => {
        if (habit.id === id) {
          if (habit.type === "boolean") {
            return { ...habit, completed: value as boolean }
          } else {
            const completed = (value as number) >= habit.target
            return { ...habit, currentValue: value as number, completed }
          }
        }
        return habit
      }),
    )
  }

  const completedHabits = habits.filter((h) => h.completed).length
  const totalHabits = habits.length
  const completionRate = Math.round((completedHabits / totalHabits) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-center">
            <Calendar className="w-8 h-8 mr-3 text-blue-600" />
            Registro Diario
          </h1>
          <p className="text-slate-600">
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Progress Summary */}
        <Card className="bg-white/70 backdrop-blur border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Progreso del Día</h3>
                <p className="text-slate-600">
                  {completedHabits} de {totalHabits} hábitos completados
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-800">{completionRate}%</div>
                <Badge variant={completionRate >= 80 ? "default" : "secondary"} className="mt-1">
                  {completionRate >= 80 ? "¡Excelente!" : completionRate >= 50 ? "Bien" : "Puedes mejorar"}
                </Badge>
              </div>
            </div>
            <Progress value={completionRate} className="h-3" />
          </CardContent>
        </Card>

        {/* Habits List */}
        <div className="space-y-4">
          {habits.map((habit) => (
            <Card key={habit.id} className="bg-white/70 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {habit.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-400" />
                      )}
                      <div>
                        <h3 className="font-semibold text-slate-800">{habit.name}</h3>
                        <Badge variant="outline" className="text-xs mt-1">
                          <Award className="w-3 h-3 mr-1" />
                          {habit.streak} días
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {habit.type === "boolean" ? (
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`habit-${habit.id}`} className="text-slate-700">
                      ¿Completaste este hábito hoy?
                    </Label>
                    <Switch
                      id={`habit-${habit.id}`}
                      checked={habit.completed}
                      onCheckedChange={(checked) => updateHabitValue(habit.id, checked)}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <Label htmlFor={`habit-${habit.id}`} className="text-slate-700">
                          Progreso actual
                        </Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Input
                            id={`habit-${habit.id}`}
                            type="number"
                            value={habit.currentValue}
                            onChange={(e) => updateHabitValue(habit.id, Number(e.target.value))}
                            className="bg-white/70 w-24"
                            min="0"
                          />
                          <span className="text-sm text-slate-600">
                            / {habit.target} {habit.unit}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
                          <span>Progreso</span>
                          <span>{Math.round((habit.currentValue / habit.target) * 100)}%</span>
                        </div>
                        <Progress value={(habit.currentValue / habit.target) * 100} className="h-2" />
                      </div>
                    </div>

                    {habit.completed && (
                      <div className="flex items-center space-x-2 text-green-600 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>¡Meta alcanzada!</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Notes Section */}
        <Card className="bg-white/70 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-slate-800">Notas del Día</CardTitle>
            <CardDescription>Reflexiona sobre tu día y agrega cualquier observación</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="¿Cómo te sentiste hoy? ¿Qué te ayudó o dificultó completar tus hábitos?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white/70 min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-center">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
            <Save className="w-5 h-5 mr-2" />
            Guardar Registro del Día
          </Button>
        </div>

        {/* Motivational Message */}
        {completionRate >= 80 && (
          <Card className="bg-gradient-to-r from-green-100 to-blue-100 border-green-300">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <Award className="w-6 h-6" />
                <span className="font-semibold text-lg">¡Excelente trabajo hoy!</span>
              </div>
              <p className="text-green-600 mt-2">
                Has completado {completedHabits} de {totalHabits} hábitos. ¡Sigue así!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
