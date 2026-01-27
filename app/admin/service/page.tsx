"use client";
import { 
  Wrench, 
  Phone, 
  Calendar, 
  MapPin,
  Clock
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

export default function ServicePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Service Support</h1>
        <p className="text-slate-600 mt-1">Manage service calls, AMC, and site visit requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-2 border-red-100 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600">
              Paid Service Calls
            </CardTitle>
            <Phone className="w-5 h-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-red-600">0</div>
            <p className="text-xs text-slate-500 mt-2 font-semibold">Pending resolution</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600">
              AMC Calls
            </CardTitle>
            <Wrench className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-blue-600">0</div>
            <p className="text-xs text-slate-500 mt-2 font-semibold">Active maintenance</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600">
              Site Visit Requests
            </CardTitle>
            <MapPin className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-purple-600">0</div>
            <p className="text-xs text-slate-500 mt-2 font-semibold">Scheduled visits</p>
          </CardContent>
        </Card>
      </div>

      {/* Service Requests List */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-black text-slate-900">Recent Service Requests</CardTitle>
              <CardDescription>All service calls and maintenance requests</CardDescription>
            </div>
            <Button className="font-bold">
              <Phone className="w-4 h-4 mr-2" />
              New Service Call
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-12 text-slate-400">
            <Wrench className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-semibold">No service requests yet</p>
            <p className="text-sm mt-2">Service requests will appear here once customers start requesting support</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-2">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-bold">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-center py-6 text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm font-semibold">No visits scheduled</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-bold">Urgent Callbacks</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-center py-6 text-slate-400">
              <Phone className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm font-semibold">No pending callbacks</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-bold">AMC Renewals</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-center py-6 text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm font-semibold">No renewals due</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
