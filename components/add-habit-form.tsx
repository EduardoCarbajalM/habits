"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { X, Plus, Target } from "lucide-react"

interface AddHabitFormProps {
  onClose?: () => void
  onSave?: (habit: any) => void
}

export default function AddHabitForm({ onClose, onSave }: AddHabitFormProps) {
  const [habitType, setHabitType] = useState<"boolean" | "numeric">("boolean")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "boolean" as "boolean" | "numeric",
    target: "",
    unit: "",
    reminder: false,
    reminderTime: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave?.(formData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white/80 backdrop-blur border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-slate-800 flex items-center">
                  <Plus className="w-6 h-6 mr-2 text-blue-600" />
                  Nuevo Hábito
                </CardTitle>
                <CardDescription>Crea un nuevo hábito para comenzar tu seguimiento</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-green-600" />
                  Información Básica
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Hábito *</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Beber agua, Hacer ejercicio, Leer..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-white/70"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe tu hábito y por qué es importante para ti..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-white/70 min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Hábito *</Label>
                  <Select
                    value={habitType}
                    onValueChange={(value: "boolean" | "numeric") => {
                      setHabitType(value)
                      setFormData({ ...formData, type: value })
                    }}
                  >
                    <SelectTrigger className="bg-white/70">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boolean">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span>Sí/No (Booleano)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="numeric">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span>Numérico (Con meta)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-slate-600">
                    {habitType === "boolean"
                      ? "Perfecto para hábitos que se completan o no (ej: meditar, hacer ejercicio)"
                      : "Ideal para hábitos con cantidad específica (ej: beber 8 vasos de agua)"}
                  </p>
                </div>
              </div>

              {/* Configuración Numérica */}
              {habitType === "numeric" && (
                <div className="space-y-4 p-4 bg-green-50/50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-slate-800">Configuración Numérica</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="target">Meta Diaria *</Label>
                      <Input
                        id="target"
                        type="number"
                        placeholder="Ej: 8, 30, 10000"
                        value={formData.target}
                        onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                        className="bg-white/70"
                        min="1"
                        required={habitType === "numeric"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unit">Unidad *</Label>
                      <Input
                        id="unit"
                        placeholder="Ej: vasos, minutos, pasos"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="bg-white/70"
                        required={habitType === "numeric"}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Recordatorios */}
              <div className="space-y-4 p-4 bg-blue-50/50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-800">Recordatorios</h4>
                    <p className="text-sm text-slate-600">Recibe notificaciones para mantener tu hábito</p>
                  </div>
                  <Switch
                    checked={formData.reminder}
                    onCheckedChange={(checked) => setFormData({ ...formData, reminder: checked })}
                  />
                </div>

                {formData.reminder && (
                  <div className="space-y-2">
                    <Label htmlFor="reminderTime">Hora del Recordatorio</Label>
                    <Input
                      id="reminderTime"
                      type="time"
                      value={formData.reminderTime}
                      onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                      className="bg-white/70"
                    />
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Hábito
                </Button>
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
