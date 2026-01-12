import { 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  MoreVertical,
  ArrowUpRight,
  MapPin
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

export default function AdminDashboard() {
  // Mock data representing your current business state
  const stats = [
    { title: "Total Leads", value: "128", icon: TrendingUp, trend: "+12%", color: "text-blue-500" },
    { title: "Active Dealers", value: "42", icon: Users, trend: "Within 5-10km", color: "text-purple-500" },
    { title: "Pending Verification", value: "14", icon: Clock, trend: "Requires Call", color: "text-orange-500" },
    { title: "Completed Jobs", value: "89", icon: CheckCircle2, trend: "This Month", color: "text-green-500" },
  ]

  const recentLeads = [
    { id: "L-001", customer: "John Doe", location: "Mumbai (400001)", status: "Pending Call", date: "2 mins ago" },
    { id: "L-002", customer: "Sarah Smith", location: "Delhi (110001)", status: "Floated", date: "15 mins ago" },
    { id: "L-003", customer: "TechCorp Inc", location: "Bangalore (560001)", status: "Verified", date: "1 hour ago" },
  ]

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold font-orbitron tracking-tight">Executive Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time status of your service aggregation platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-primary/10 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium font-poppins text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-orbitron">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 font-poppins">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Recent Leads Table Component */}
        <Card className="md:col-span-4 border-primary/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-orbitron">Recent Leads</CardTitle>
                <CardDescription>Latest customer requests needing manual verification </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="font-poppins">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold font-poppins">{lead.customer}</p>
                      <p className="text-xs text-muted-foreground">{lead.location} • {lead.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={lead.status === "Pending Call" ? "destructive" : "secondary"}>
                      {lead.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Pricing Control Placeholder */}
        <Card className="md:col-span-3 border-primary/10">
          <CardHeader>
            <CardTitle className="font-orbitron">Quick Actions</CardTitle>
            <CardDescription>Frequently used management tools</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start gap-3 font-poppins h-12">
              <TrendingUp className="w-4 h-4" />
              Update Product Prices
            </Button>
            <Button variant="outline" className="justify-start gap-3 font-poppins h-12">
              <Users className="w-4 h-4" />
              Onboard New Dealer
            </Button>
            <Button variant="outline" className="justify-start gap-3 font-poppins h-12 text-destructive hover:text-destructive">
              <Clock className="w-4 h-4" />
              View Urgent Callbacks
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}