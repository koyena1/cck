import { MapPin, Search, Navigation } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ServiceAreas() {
  const activePins = ["400001", "400002", "400003", "400004", "400005"]

  return (
    <div className="p-6 lg:p-10 space-y-6 bg-[#f8fafc] min-h-screen">
      <div>
        <h1 className="text-3xl font-bold font-orbitron tracking-tight uppercase text-[#0f172a]">Service Radius Mapping</h1>
        <p className="text-muted-foreground mt-1 font-poppins">Manage the 5-10km radius for job assignments.</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white flex flex-row items-center justify-between border-b">
          <CardTitle className="font-orbitron text-sm uppercase">PIN Code Coverage</CardTitle>
          <div className="flex gap-2">
            <Input placeholder="Enter PIN code..." className="w-48 h-9 text-xs" />
            <Button size="sm" className="bg-[#0f172a] text-[#facc15]">Add Area</Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-slate-100 rounded-lg aspect-video w-full flex items-center justify-center border-2 border-dashed border-slate-300 mb-6">
             <div className="text-center">
                <Navigation className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-pulse" />
                <p className="text-xs font-poppins text-slate-500 uppercase font-bold tracking-widest">Map View Coming Soon</p>
             </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold font-poppins uppercase text-slate-500">Currently Active PINs (10km Radius)</h3>
            <div className="flex flex-wrap gap-2">
              {activePins.map((pin) => (
                <Badge key={pin} className="bg-white border-slate-200 text-[#0f172a] hover:bg-[#facc15] px-4 py-2 text-sm font-orbitron cursor-pointer transition-colors shadow-sm">
                  <MapPin className="w-3 h-3 mr-2 text-[#facc15]" />
                  {pin}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}