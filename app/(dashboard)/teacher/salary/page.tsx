import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { currentMonth, currentYear, monthNames } from '@/lib/validations/salary'
import { formatNumber } from '@/lib/utils'
import Link from 'next/link'
import {
  TrendingUp, TrendingDown, Award, Calendar, CheckCircle2,
  Clock, ChevronLeft, ChevronRight, BarChart3, Wallet,
  ArrowUpRight, Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const revalidate = 0
export const dynamic = 'force-dynamic'

// ─── helpers ──────────────────────────────────────────────────────────────────

const UZ_MONTHS = [
  'Yanvar','Fevral','Mart','Aprel','May','Iyun',
  'Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr',
]

function prevMonth(m: number, y: number) {
  return m === 1 ? { m: 12, y: y - 1 } : { m: m - 1, y }
}
function nextMonth(m: number, y: number) {
  return m === 12 ? { m: 1, y: y + 1 } : { m: m + 1, y }
}
function fmtDate(d: Date | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtTime(d: Date) {
  return new Date(d).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}

const TYPE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  FULL_SALARY: { label: 'Oylik maosh',    color: 'bg-blue-100 text-blue-700 border-blue-200',   icon: <Wallet className="w-3 h-3" /> },
  ADVANCE:     { label: 'Avans',          color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <ArrowUpRight className="w-3 h-3" /> },
  BONUS:       { label: 'Mukofot',        color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <Award className="w-3 h-3" /> },
  DEDUCTION:   { label: 'Ushlab qolish',  color: 'bg-red-100 text-red-700 border-red-200',       icon: <TrendingDown className="w-3 h-3" /> },
}
const STATUS_META: Record<string, { label: string; color: string }> = {
  PAID:           { label: "To'langan",  color: 'bg-green-100 text-green-700 border-green-200' },
  PENDING:        { label: 'Kutilmoqda', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  PARTIALLY_PAID: { label: 'Qisman',     color: 'bg-orange-100 text-orange-700 border-orange-200' },
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function TeacherSalaryPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'TEACHER') redirect('/unauthorized')

  const tenantId = session.user.tenantId!
  const selectedMonth = searchParams.month ? parseInt(searchParams.month) : currentMonth
  const selectedYear  = searchParams.year  ? parseInt(searchParams.year)  : currentYear

  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      monthlySalary: true,
      user: { select: { fullName: true } },
    },
  })
  if (!teacher) redirect('/unauthorized')

  const salaryPayments = await db.salaryPayment.findMany({
    where: { tenantId, teacherId: teacher.id, month: selectedMonth, year: selectedYear },
    select: {
      id: true, type: true, status: true, amount: true, paidAmount: true,
      remainingAmount: true, baseSalary: true, bonusAmount: true, deductionAmount: true,
      month: true, year: true, paymentDate: true, createdAt: true, description: true, notes: true,
      paidBy: { select: { fullName: true } },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })

  // ── calculations (unchanged) ────────────────────────────────────────────────
  const monthlySalary    = teacher.monthlySalary ? Number(teacher.monthlySalary) : 0
  const fullSalaryPayment = salaryPayments.find(p => p.type === 'FULL_SALARY')

  const totalBasePaid = salaryPayments.reduce((sum, p) => {
    if (p.type === 'ADVANCE') return sum + Number(p.paidAmount)
    if (p.type === 'FULL_SALARY') return sum + Number(p.baseSalary || p.paidAmount)
    return sum
  }, 0)

  const totalPaid   = salaryPayments.reduce((sum, p) => sum + Number(p.paidAmount), 0)
  const totalAmount = salaryPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  const remaining = fullSalaryPayment && Number(fullSalaryPayment.baseSalary || 0) >= monthlySalary
    ? 0
    : monthlySalary > 0
      ? Math.max(0, monthlySalary - totalBasePaid)
      : Math.max(0, totalAmount - totalPaid)

  const referenceAmount = monthlySalary > 0 ? monthlySalary : totalAmount
  const percentage = referenceAmount > 0
    ? Math.min(Math.round((totalBasePaid / referenceAmount) * 100), 100)
    : 0

  const totalAdvances  = salaryPayments.filter(p => p.type === 'ADVANCE').reduce((s, p) => s + Number(p.paidAmount), 0)
  const totalBonuses   = salaryPayments.reduce((s, p) =>
    p.type === 'BONUS' ? s + Number(p.paidAmount)
    : p.type === 'FULL_SALARY' && p.bonusAmount ? s + Number(p.bonusAmount) : s, 0)
  const totalDeductions = salaryPayments.reduce((s, p) =>
    p.type === 'DEDUCTION' ? s + Number(p.paidAmount)
    : p.type === 'FULL_SALARY' && p.deductionAmount ? s + Number(p.deductionAmount) : s, 0)

  // month nav
  const prev = prevMonth(selectedMonth, selectedYear)
  const next = nextMonth(selectedMonth, selectedYear)
  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-2 py-6">

      {/* ══ Page header ════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mening Maoshim</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{teacher.user.fullName}</p>
        </div>
        <Link
          href="/teacher/salary/overview"
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border border-border hover:bg-muted transition-colors"
        >
          <BarChart3 className="w-4 h-4 text-primary" />
          Yillik panorama
        </Link>
      </div>

      {/* ══ Month navigation ═══════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between bg-white dark:bg-card rounded-2xl border border-border px-4 py-3 shadow-sm">
        <Link
          href={`/teacher/salary?month=${prev.m}&year=${prev.y}`}
          className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>

        <div className="text-center">
          <p className="text-lg font-bold">
            {UZ_MONTHS[selectedMonth - 1]} {selectedYear}
          </p>
          {isCurrentMonth && (
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-0.5">
              Joriy oy
            </span>
          )}
        </div>

        <Link
          href={`/teacher/salary?month=${next.m}&year=${next.y}`}
          className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      {/* ══ Main salary card ════════════════════════════════════════════════════ */}
      {monthlySalary > 0 && (
        <div className="bg-white dark:bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* top accent bar */}
          <div className={cn(
            'h-1.5 w-full',
            percentage === 100 ? 'bg-gradient-to-r from-emerald-400 to-green-500'
            : percentage > 0    ? 'bg-gradient-to-r from-amber-400 to-orange-400'
            :                     'bg-gradient-to-r from-slate-300 to-slate-400',
          )} />

          <div className="p-6 space-y-5">
            {/* title + percentage */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Oylik to'lov holati
                </p>
                <p className="text-base font-semibold mt-0.5">
                  {UZ_MONTHS[selectedMonth - 1]} {selectedYear}
                </p>
              </div>
              <div className={cn(
                'flex items-center justify-center w-16 h-16 rounded-full text-xl font-extrabold border-4',
                percentage === 100
                  ? 'border-emerald-400 text-emerald-600 bg-emerald-50'
                  : percentage > 0
                    ? 'border-amber-400 text-amber-600 bg-amber-50'
                    : 'border-slate-300 text-slate-500 bg-slate-50',
              )}>
                {percentage}%
              </div>
            </div>

            {/* progress bar */}
            <Progress
              value={percentage}
              className={cn(
                'h-2.5 rounded-full',
                percentage === 100 ? '[&>div]:bg-emerald-500'
                : percentage > 0   ? '[&>div]:bg-amber-500'
                :                    '[&>div]:bg-slate-400',
              )}
            />

            {/* 3 amount cards */}
            <div className="grid grid-cols-3 gap-3">
              {/* Paid */}
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 p-3.5">
                <p className="text-[11px] font-medium text-emerald-600 mb-1">To'langan</p>
                <p className="text-lg font-extrabold text-emerald-700 leading-tight">
                  {formatNumber(totalPaid)}
                </p>
                <p className="text-[10px] text-emerald-600/60 mt-0.5">so'm</p>
              </div>

              {/* Remaining */}
              <div className={cn(
                'rounded-xl border p-3.5',
                remaining > 0
                  ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200/60'
                  : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200/60',
              )}>
                <p className={cn(
                  'text-[11px] font-medium mb-1',
                  remaining > 0 ? 'text-amber-600' : 'text-slate-500',
                )}>
                  Qolgan
                </p>
                <p className={cn(
                  'text-lg font-extrabold leading-tight',
                  remaining > 0 ? 'text-amber-700' : 'text-slate-500',
                )}>
                  {formatNumber(remaining)}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">so'm</p>
              </div>

              {/* Total */}
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200/60 p-3.5">
                <p className="text-[11px] font-medium text-blue-600 mb-1">Jami oylik</p>
                <p className="text-lg font-extrabold text-blue-700 leading-tight">
                  {formatNumber(referenceAmount)}
                </p>
                <p className="text-[10px] text-blue-600/60 mt-0.5">so'm</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Advances · Bonuses · Deductions ════════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-3">
        {/* Avanslar */}
        <div className="bg-white dark:bg-card rounded-2xl border border-border shadow-sm p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Avanslar</p>
            <span className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5 text-purple-600" />
            </span>
          </div>
          <p className="text-xl font-bold text-purple-600">{formatNumber(totalAdvances)}</p>
          <p className="text-[11px] text-muted-foreground">so'm · Oldindan olgan</p>
        </div>

        {/* Mukofotlar */}
        <div className="bg-white dark:bg-card rounded-2xl border border-border shadow-sm p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mukofot</p>
            <span className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
            </span>
          </div>
          <p className="text-xl font-bold text-emerald-600">+{formatNumber(totalBonuses)}</p>
          <p className="text-[11px] text-muted-foreground">so'm · Qo'shimcha</p>
        </div>

        {/* Ushlab qolish */}
        <div className="bg-white dark:bg-card rounded-2xl border border-border shadow-sm p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ushlab qolish</p>
            <span className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            </span>
          </div>
          <p className="text-xl font-bold text-red-500">-{formatNumber(totalDeductions)}</p>
          <p className="text-[11px] text-muted-foreground">so'm · Ayirilgan</p>
        </div>
      </div>

      {/* ══ Payment history ═════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div>
            <h2 className="text-sm font-semibold">To'lovlar tarixi</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {UZ_MONTHS[selectedMonth - 1]} {selectedYear} · {salaryPayments.length} ta yozuv
            </p>
          </div>
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* list */}
        {salaryPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Wallet className="w-6 h-6 opacity-40" />
            </div>
            <p className="text-sm font-medium">Bu oy uchun to'lovlar yo'q</p>
            <p className="text-xs opacity-60">Administratorga murojaat qiling</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {salaryPayments.map((payment) => {
              const paid   = Number(payment.paidAmount || 0)
              const amount = Number(payment.amount)
              const pct    = amount > 0 ? Math.round((paid / amount) * 100) : 0
              const tm     = TYPE_META[payment.type]   || { label: payment.type, color: 'bg-gray-100 text-gray-600 border-gray-200', icon: <Minus className="w-3 h-3" /> }
              const sm     = STATUS_META[payment.status] || { label: payment.status, color: 'bg-gray-100 text-gray-600 border-gray-200' }

              return (
                <div key={payment.id} className="px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">

                    {/* left: badges + amounts */}
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* badges row */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={cn(
                          'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border',
                          tm.color,
                        )}>
                          {tm.icon}{tm.label}
                        </span>
                        <span className={cn(
                          'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border',
                          sm.color,
                        )}>
                          {payment.status === 'PAID'
                            ? <CheckCircle2 className="w-3 h-3" />
                            : <Clock className="w-3 h-3" />}
                          {sm.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted/60 border border-border/40">
                          <Calendar className="w-3 h-3" />
                          {UZ_MONTHS[(payment.month ?? 1) - 1]} {payment.year}
                        </span>
                      </div>

                      {/* amounts */}
                      <div className="flex flex-wrap items-center gap-4">
                        <div>
                          <p className="text-[10px] text-muted-foreground">To'landi</p>
                          <p className="text-base font-bold text-emerald-600">{formatNumber(paid)} <span className="text-xs font-normal">so'm</span></p>
                        </div>
                        <div className="h-8 w-px bg-border/60" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Jami</p>
                          <p className="text-base font-semibold text-foreground">{formatNumber(amount)} <span className="text-xs font-normal text-muted-foreground">so'm</span></p>
                        </div>

                        {/* FULL_SALARY bonus/deduction inline */}
                        {payment.type === 'FULL_SALARY' && Number(payment.bonusAmount) > 0 && (
                          <>
                            <div className="h-8 w-px bg-border/60" />
                            <div>
                              <p className="text-[10px] text-emerald-600">Bonus</p>
                              <p className="text-sm font-bold text-emerald-600">+{formatNumber(Number(payment.bonusAmount))} <span className="text-xs font-normal">so'm</span></p>
                            </div>
                          </>
                        )}
                        {payment.type === 'FULL_SALARY' && Number(payment.deductionAmount) > 0 && (
                          <>
                            <div className="h-8 w-px bg-border/60" />
                            <div>
                              <p className="text-[10px] text-red-500">Ushlab qolish</p>
                              <p className="text-sm font-bold text-red-500">-{formatNumber(Number(payment.deductionAmount))} <span className="text-xs font-normal">so'm</span></p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* partial progress */}
                      {pct < 100 && pct > 0 && (
                        <div className="space-y-1 max-w-xs">
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>To'lov holati</span><span>{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-1.5 [&>div]:bg-amber-400" />
                        </div>
                      )}

                      {/* description */}
                      {payment.description && (
                        <p className="text-xs text-muted-foreground italic">{payment.description}</p>
                      )}

                      {/* paid by */}
                      {payment.paidBy && (
                        <p className="text-xs text-muted-foreground">
                          To'lagan: <span className="font-medium text-foreground">{payment.paidBy.fullName}</span>
                        </p>
                      )}
                    </div>

                    {/* right: date */}
                    <div className="text-right shrink-0">
                      {payment.paymentDate && (
                        <p className="text-xs font-semibold text-foreground">
                          {fmtDate(payment.paymentDate)}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {fmtTime(payment.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
