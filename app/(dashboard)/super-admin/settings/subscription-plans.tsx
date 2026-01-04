'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Check, Edit, Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { getSubscriptionPlans, updateSubscriptionPlan, initializeDefaultPlans } from '@/app/actions/subscription-plan'
import { SubscriptionPlan } from '@prisma/client'
import { Switch } from '@/components/ui/switch'
import { formatNumber } from '@/lib/utils'

interface PlanData {
  id: string
  planType: SubscriptionPlan
  name: string
  displayName: string
  price: number
  description: string | null
  maxStudents: number
  maxTeachers: number
  features: string[]
  isActive: boolean
  isPopular: boolean
}

export function SubscriptionPlans() {
  const [plans, setPlans] = useState<PlanData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<PlanData | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    price: 0,
    description: '',
    maxStudents: 0,
    maxTeachers: 0,
    features: [''],
    isActive: true,
    isPopular: false,
  })

  useEffect(() => {
    loadPlans()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadPlans = async () => {
    try {
      setIsLoading(true)
      const data = await getSubscriptionPlans()
      // Convert Decimal price to number
      const convertedData = data.map(plan => ({
        ...plan,
        price: Number(plan.price)
      }))
      setPlans(convertedData as PlanData[])
    } catch (error) {
      console.error('Error loading plans:', error)
      // If no plans exist, initialize defaults
      if ((error as Error).message.includes('No plans found') || plans.length === 0) {
        toast.info('Tarif rejalar yaratilmoqda...')
        try {
          await initializeDefaultPlans()
          const data = await getSubscriptionPlans()
          // Convert Decimal price to number
          const convertedData = data.map(plan => ({
            ...plan,
            price: Number(plan.price)
          }))
          setPlans(convertedData as PlanData[])
          toast.success('Tarif rejalar yaratildi')
        } catch (initError) {
          console.error('Error initializing plans:', initError)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (plan: PlanData) => {
    setEditingPlan(plan)
    setFormData({
      displayName: plan.displayName,
      price: Number(plan.price),
      description: plan.description || '',
      maxStudents: plan.maxStudents,
      maxTeachers: plan.maxTeachers,
      features: plan.features,
      isActive: plan.isActive,
      isPopular: plan.isPopular,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingPlan) return

    try {
      setIsSaving(true)

      await updateSubscriptionPlan(editingPlan.planType, {
        displayName: formData.displayName,
        price: formData.price,
        description: formData.description,
        maxStudents: formData.maxStudents,
        maxTeachers: formData.maxTeachers,
        features: formData.features.filter(f => f.trim() !== ''),
        isActive: formData.isActive,
        isPopular: formData.isPopular,
      })

      toast.success('Tarif reja yangilandi va barcha maktablarga amal qildi!')
      setIsDialogOpen(false)
      await loadPlans()
    } catch (error) {
      console.error('Error saving plan:', error)
      toast.error('Xatolik yuz berdi')
    } finally {
      setIsSaving(false)
    }
  }

  const addFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, ''],
    })
  }

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    })
  }

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData({
      ...formData,
      features: newFeatures,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const getPlanColor = (planType: SubscriptionPlan) => {
    switch (planType) {
      case 'BASIC': return 'border-blue-500'
      case 'STANDARD': return 'border-purple-500'
      case 'PREMIUM': return 'border-amber-500'
    }
  }

  const getPlanBadgeColor = (planType: SubscriptionPlan) => {
    switch (planType) {
      case 'BASIC': return 'bg-blue-500/10 text-blue-500'
      case 'STANDARD': return 'bg-purple-500/10 text-purple-500'
      case 'PREMIUM': return 'bg-amber-500/10 text-amber-500'
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative border-2 rounded-lg p-6 ${getPlanColor(plan.planType)} ${
              plan.isPopular ? 'shadow-lg' : ''
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Mashhur
                </span>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(plan.planType)}`}>
                  {plan.planType}
                </span>
                {!plan.isActive && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-500">
                    Faol emas
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-2xl font-bold">{plan.displayName}</h3>
                <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{formatNumber(Number(plan.price))}</span>
                  <span className="text-muted-foreground">so'm/oy</span>
                </div>
              </div>

              <div className="space-y-2 py-4">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Max o'quvchilar: <span className="font-semibold text-foreground">{plan.maxStudents}</span></div>
                  <div>Max o'qituvchilar: <span className="font-semibold text-foreground">{plan.maxTeachers}</span></div>
                </div>
              </div>

              <Button
                onClick={() => handleEdit(plan)}
                className="w-full"
                variant="outline"
              >
                <Edit className="mr-2 h-4 w-4" />
                Tahrirlash
              </Button>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Tarif rejalar topilmadi</p>
          <Button onClick={async () => {
            try {
              await initializeDefaultPlans()
              await loadPlans()
              toast.success('Tarif rejalar yaratildi')
            } catch (error) {
              toast.error('Xatolik yuz berdi')
            }
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Standart rejalarni yaratish
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tarif Rejani Tahrirlash</DialogTitle>
            <DialogDescription>
              O'zgarishlar barcha maktablarga avtomatik amal qiladi
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Ko'rsatiladigan Nom</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Narx (so'm/oy)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Tavsif</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxStudents">Max O'quvchilar</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  value={formData.maxStudents}
                  onChange={(e) => setFormData({ ...formData, maxStudents: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTeachers">Max O'qituvchilar</Label>
                <Input
                  id="maxTeachers"
                  type="number"
                  value={formData.maxTeachers}
                  onChange={(e) => setFormData({ ...formData, maxTeachers: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Xususiyatlar</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFeature}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Qo'shish
                </Button>
              </div>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="Xususiyat nomi"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(index)}
                      disabled={formData.features.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Faol</Label>
                <p className="text-xs text-muted-foreground">Reja faolmi?</p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="isPopular">Mashhur</Label>
                <p className="text-xs text-muted-foreground">Mashhur deb belgilash?</p>
              </div>
              <Switch
                id="isPopular"
                checked={formData.isPopular}
                onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Bekor qilish
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                'Saqlash va Barcha Maktablarga Amal Qilish'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
