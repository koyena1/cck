"use client";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  FileText
} from "lucide-react"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Accounts & Finance</h1>
        <p className="text-slate-600 mt-1">Financial overview, transactions, and payment tracking</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600">
              Total Revenue
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-green-600">₹0</div>
            <p className="text-xs text-slate-500 mt-2 font-semibold">This month</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600">
              Pending Payments
            </CardTitle>
            <CreditCard className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-blue-600">₹0</div>
            <p className="text-xs text-slate-500 mt-2 font-semibold">To collect</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600">
              Purchase Cost
            </CardTitle>
            <TrendingDown className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-orange-600">₹0</div>
            <p className="text-xs text-slate-500 mt-2 font-semibold">This month</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600">
              Net Profit
            </CardTitle>
            <DollarSign className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-purple-600">₹0</div>
            <p className="text-xs text-slate-500 mt-2 font-semibold">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="font-black text-slate-900">Recent Sales</CardTitle>
            <CardDescription>Latest customer payments received</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-semibold">No sales transactions yet</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="font-black text-slate-900">Recent Purchases</CardTitle>
            <CardDescription>Latest vendor payments made</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-semibold">No purchase transactions yet</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-2">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="font-black text-slate-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="h-16 font-bold">
              <FileText className="w-5 h-5 mr-2" />
              Generate Invoice
            </Button>
            <Button variant="outline" className="h-16 font-bold">
              <CreditCard className="w-5 h-5 mr-2" />
              Record Payment
            </Button>
            <Button variant="outline" className="h-16 font-bold">
              <TrendingUp className="w-5 h-5 mr-2" />
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
