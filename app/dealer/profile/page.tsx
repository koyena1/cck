import { 
  UserCircle, 
  ShieldCheck, 
  Users, 
  Wrench, 
  Trophy,
  Save,
  CheckCircle2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

export default function DealerProfile() {
  return (
    <div className="p-6 lg:p-10 space-y-6 bg-[#f8fafc] min-h-screen">
      <div>
        <h1 className="text-3xl font-bold font-orbitron tracking-tight uppercase text-[#0f172a]">Dealer Profile</h1>
        <p className="text-muted-foreground mt-1 font-poppins">Manage your technical infrastructure and view performance ratings.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Left: Infrastructure Management */}
        <div className="md:col-span-8 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="bg-white border-b">
              <div className="flex items-center gap-2">
                <Users className="text-[#0f172a] w-5 h-5" />
                <CardTitle className="font-orbitron text-sm uppercase">Technical Team</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold font-poppins uppercase text-slate-500">Certified Technicians</label>
                  <Input type="number" defaultValue="4" className="border-slate-200" />
                  <p className="text-[10px] text-muted-foreground italic">Affects job assignment priority</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold font-poppins uppercase text-slate-500">Service Vehicles</label>
                  <Input type="number" defaultValue="2" className="border-slate-200" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="bg-white border-b">
              <div className="flex items-center gap-2">
                <Wrench className="text-[#0f172a] w-5 h-5" />
                <CardTitle className="font-orbitron text-sm uppercase">Inventory & Equipment</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {["Long Ladders", "Drilling Kits", "Safety Gear", "Testing Monitors", "Cable Crimpers", "Signal Testers"].map((item) => (
                  <div key={item} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-[#facc15] transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium font-poppins text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Performance Scorecard */}
        <div className="md:col-span-4 space-y-6">
          <Card className="bg-[#0f172a] text-white border-none shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2 text-[#facc15]">
                <Trophy className="w-5 h-5" />
                <CardTitle className="font-orbitron uppercase text-sm">Rated Performance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center pb-4 border-b border-slate-700">
                <p className="text-5xl font-bold font-orbitron text-[#facc15]">85%</p>
                <p className="text-xs text-slate-400 font-poppins uppercase mt-2 tracking-widest">Excellent Score</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                    <span>Infrastructure Strength</span>
                    <span className="text-[#facc15]">90%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="bg-[#facc15] h-full w-[90%]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                    <span>Installation Quality</span>
                    <span className="text-[#facc15]">82%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="bg-[#facc15] h-full w-[82%]" />
                  </div>
                </div>
              </div>

              <Button className="w-full bg-[#facc15] hover:bg-white text-[#0f172a] font-bold font-orbitron transition-all">
                <Save className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}