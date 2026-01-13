import { 
  ClipboardList, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight,
  ExternalLink,
  Wrench,
  Search
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

export default function DealerDashboard() {
  // --- EXISTING LOGIC & DATA PRESERVED ---
  const stats = [
    { title: "New Assignments", value: "05", icon: ClipboardList, trend: "Awaiting Action", color: "text-[#facc15]" },
    { title: "My Service Radius", value: "10km", icon: MapPin, trend: "Verified PINs", color: "text-[#facc15]" },
    { title: "Scheduled Visits", value: "08", icon: Clock, trend: "This Week", color: "text-[#facc15]" },
    { title: "Completed Installs", value: "24", icon: CheckCircle2, trend: "Lifetime", color: "text-[#facc15]" },
  ]

  const assignedJobs = [
    { id: "J-901", customer: "John Doe", pincode: "400001", status: "New Assignment", deadline: "Expiring in 2h" },
    { id: "J-904", customer: "Sarah Smith", pincode: "110001", status: "Scheduled", deadline: "Jan 15, 10:00 AM" },
    { id: "J-905", customer: "TechCorp Inc", pincode: "560001", status: "In Progress", deadline: "Today" },
  ]

  return (
    <div className="min-h-screen pb-10">
      {/* Header Banner - Mimicking Hero Section in Image */}
      <div className="bg-[#0f172a] text-white p-8 lg:p-12 relative overflow-hidden border-b-8 border-[#facc15]">
        <div className="relative z-10">
          <p className="text-[#facc15] font-poppins font-semibold text-sm mb-2 uppercase tracking-widest">Dealer Portal</p>
          <h1 className="text-4xl font-bold font-orbitron tracking-tight uppercase max-w-2xl">
            The Ultimate Choice for <span className="text-[#facc15]">Security Service.</span>
          </h1>
          <p className="text-slate-400 mt-4 max-w-xl font-poppins text-sm leading-relaxed">
            Manage your assigned CCTV installations and service requests with our precision tracking system.
          </p>
        </div>
        {/* Background abstract decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 flex items-center justify-center">
            <Wrench size={200} className="rotate-12" />
        </div>
      </div>

      <div className="p-6 lg:p-10 -mt-8 relative z-20">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-none bg-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold font-poppins text-slate-500 uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                <div className="p-2 bg-[#0f172a] rounded-md">
                   <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-orbitron text-[#0f172a]">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 font-poppins font-medium">{stat.trend}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-7">
          {/* Active Assignments Table */}
          <Card className="md:col-span-4 border-none bg-white shadow-lg overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-orbitron uppercase text-[#0f172a] text-lg">Active Assignments</CardTitle>
                  <CardDescription className="font-poppins">Jobs based on your 5-10km service radius</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="font-poppins text-xs border-[#0f172a] text-[#0f172a] hover:bg-[#0f172a] hover:text-white transition-all">
                   View History
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {assignedJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between group p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded bg-[#facc15]/10 flex items-center justify-center border border-[#facc15]/20">
                        <Wrench className="w-5 h-5 text-[#0f172a]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold font-poppins text-[#0f172a]">{job.customer}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight">ID: {job.id}</span> 
                            <span className="flex items-center gap-1 font-semibold text-[#0f172a]"><MapPin size={12} /> {job.pincode}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={
                        job.status === "New Assignment" 
                        ? "bg-red-600 text-white border-none px-3" 
                        : "bg-[#0f172a] text-white border-none px-3"
                      }>
                        {job.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="hover:bg-[#facc15] hover:text-[#0f172a]">
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Panel */}
          <Card className="md:col-span-3 border-none bg-[#0f172a] text-white shadow-lg">
            <CardHeader>
              <CardTitle className="font-orbitron uppercase text-[#facc15]">Field Actions</CardTitle>
              <CardDescription className="font-poppins text-slate-400">Update status of active site works</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Button variant="default" className="bg-[#facc15] hover:bg-white text-[#0f172a] font-bold justify-start gap-3 font-poppins h-14 w-full transition-all border-none">
                <CheckCircle2 className="w-5 h-5" />
                Mark Installation as Complete
              </Button>
              <Button variant="outline" className="justify-start gap-3 font-poppins h-14 w-full border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-white">
                <Clock className="w-5 h-5 text-[#facc15]" />
                Reschedule Site Visit
              </Button>
              <Button variant="outline" className="justify-start gap-3 font-poppins h-14 w-full border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-white">
                <ExternalLink className="w-5 h-5 text-[#facc15]" />
                Contact Platform Admin
              </Button>

              <div className="mt-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <h4 className="text-xs font-bold uppercase text-[#facc15] mb-2 font-poppins">Dealer Profile Score</h4>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-[#facc15] w-[85%]"></div>
                </div>
                <p className="text-[10px] mt-2 text-slate-400 font-poppins uppercase">Excellent Performance Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}