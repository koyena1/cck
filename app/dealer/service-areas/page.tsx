import { MapPin, Search, Navigation } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ServiceAreas() {
  const activePins = ["400001", "400002", "400003", "400004", "400005"]

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-10 space-y-4 sm:space-y-6 bg-[#f8fafc] dark:bg-slate-900 min-h-screen">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-orbitron tracking-tight uppercase text-[#0f172a] dark:text-slate-100">Service Radius Mapping</h1>
        <p className="text-muted-foreground mt-1 font-poppins dark:text-slate-400 text-sm sm:text-base">Manage the 5-10km radius for job assignments.</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <CardHeader className="bg-white dark:bg-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b dark:border-slate-700 gap-3 sm:gap-0 p-4 sm:p-6">
          <CardTitle className="font-orbitron text-xs sm:text-sm uppercase dark:text-slate-100">PIN Code Coverage</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Input placeholder="Enter PIN code..." className="w-full sm:w-48 h-9 text-xs" />
            <Button size="sm" className="bg-[#0f172a] text-[#facc15] text-xs w-full sm:w-auto">Add Area</Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="bg-slate-100 dark:bg-slate-900 rounded-lg aspect-video w-full flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 mb-4 sm:mb-6">
             <div className="text-center">
                <Navigation className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2 animate-pulse" />
                <p className="text-[10px] sm:text-xs font-poppins text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest">Map View Coming Soon</p>
             </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-[10px] sm:text-xs font-bold font-poppins uppercase text-slate-500 dark:text-slate-400">Currently Active PINs (10km Radius)</h3>
            <div className="flex flex-wrap gap-2">
              {activePins.map((pin) => (
                <Badge key={pin} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-[#0f172a] dark:text-slate-100 hover:bg-[#facc15] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-orbitron cursor-pointer transition-colors shadow-sm">
                  <MapPin className="w-3 h-3 mr-1 sm:mr-2 text-[#facc15] dark:text-[#facc15]" />
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