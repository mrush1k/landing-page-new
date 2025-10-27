"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, CalendarIcon, DollarSign, FileText, Clock, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChartContainer, ChartConfig } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

interface InvoiceSummary {
  paid: { count: number; total: number }
  unpaid: { count: number; total: number }
  overdue: { count: number; total: number }
  taxCollected: number
  period: string
}

interface CashflowData {
  month: string
  income: number
  year: number
}

interface OutstandingBalances {
  overdue: { count: number; total: number }
  pending: { count: number; total: number }
  total: number
}

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [summaryData, setSummaryData] = useState<InvoiceSummary | null>(null)
  const [cashflowData, setCashflowData] = useState<CashflowData[]>([])
  const [outstandingBalances, setOutstandingBalances] = useState<OutstandingBalances | null>(null)
  const [loading, setLoading] = useState(false)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

  // Memoize API calls to prevent unnecessary re-fetches
  const fetchSummaryData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.append('from', dateFrom)
      if (dateTo) params.append('to', dateTo)
      
      const response = await fetch(`/api/reports/summary?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSummaryData(data)
      }
    } catch (error) {
      console.error('Failed to fetch summary data:', error)
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  const fetchCashflowData = useCallback(async (year: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/cashflow?year=${year}`)
      if (response.ok) {
        const data = await response.json()
        setCashflowData(data.monthlyData || [])
        setOutstandingBalances(data.outstandingBalances || null)
      }
    } catch (error) {
      console.error('Failed to fetch cashflow data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCashflowData(selectedYear)
  }, [selectedYear, fetchCashflowData])

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount)
  }, [])

  const setPresetDateRange = useCallback((preset: string) => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()

    switch (preset) {
      case 'thisMonth':
        setDateFrom(format(new Date(currentYear, currentMonth, 1), 'yyyy-MM-dd'))
        setDateTo(format(today, 'yyyy-MM-dd'))
        break
      case 'lastMonth':
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
        setDateFrom(format(new Date(lastMonthYear, lastMonth, 1), 'yyyy-MM-dd'))
        setDateTo(format(new Date(currentYear, currentMonth, 0), 'yyyy-MM-dd'))
        break
      case 'thisYear':
        setDateFrom(format(new Date(currentYear, 0, 1), 'yyyy-MM-dd'))
        setDateTo(format(today, 'yyyy-MM-dd'))
        break
      case 'lastYear':
        setDateFrom(format(new Date(currentYear - 1, 0, 1), 'yyyy-MM-dd'))
        setDateTo(format(new Date(currentYear - 1, 11, 31), 'yyyy-MM-dd'))
        break
    }
  }, [])

  const chartData = useMemo(() => cashflowData.map(item => ({
    name: item.month,
    income: item.income
  })), [cashflowData])

  const chartConfig: ChartConfig = useMemo(() => ({
    income: {
      label: "Income",
      color: "hsl(var(--primary))",
    },
  }), [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Track your business performance with detailed analytics and insights.
        </p>
      </div>

      <Tabs defaultValue="cashflow" className="space-y-6">
        <TabsList>
          <TabsTrigger value="cashflow">Cashflow Analysis</TabsTrigger>
          <TabsTrigger value="summary">Invoice Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="cashflow" className="space-y-6">
          <div className="flex items-center gap-4">
            <div>
              <Label>Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {outstandingBalances && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(outstandingBalances.overdue.total)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {outstandingBalances.overdue.count} invoice{outstandingBalances.overdue.count !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(outstandingBalances.pending.total)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {outstandingBalances.pending.count} invoice{outstandingBalances.pending.count !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(outstandingBalances.total)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total unpaid amount
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">YTD Income</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(
                        cashflowData.reduce((sum, month) => sum + month.income, 0)
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Year to date
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Income Trend - {selectedYear}</CardTitle>
                <CardDescription>
                  Track your monthly income performance throughout the year
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(Number(value)), "Income"]}
                      labelStyle={{ color: 'black' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #ccc',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar 
                      dataKey="income" 
                      fill="var(--color-income)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filter Reports</CardTitle>
              <CardDescription>
                Select a date range to view invoice summary data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="date-from">From Date</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-to">To Date</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
                <Button onClick={fetchSummaryData} disabled={loading}>
                  {loading ? 'Loading...' : 'Generate Report'}
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setPresetDateRange('thisMonth')}>
                  This Month
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPresetDateRange('lastMonth')}>
                  Last Month
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPresetDateRange('thisYear')}>
                  This Year
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPresetDateRange('lastYear')}>
                  Last Year
                </Button>
              </div>
            </CardContent>
          </Card>

          {summaryData && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(summaryData.paid.total)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {summaryData.paid.count} invoice{summaryData.paid.count !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unpaid Invoices</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(summaryData.unpaid.total)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {summaryData.unpaid.count} invoice{summaryData.unpaid.count !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(summaryData.overdue.total)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {summaryData.overdue.count} invoice{summaryData.overdue.count !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tax Collected</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(summaryData.taxCollected)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {summaryData.period}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}