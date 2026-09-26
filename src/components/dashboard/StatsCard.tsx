import { ArrowUpRight, Calendar, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function StatsCard() {
  return (
    <Card className="bg-card border-none shadow-lg h-full flex flex-col justify-between relative overflow-hidden">
      <CardContent className="p-6 flex flex-col h-full justify-between gap-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Spent this month
            </p>
            <h3 className="text-4xl font-bold text-foreground tracking-tight">
              $5,950<span className="text-muted-foreground text-2xl">.64</span>
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground -mt-2 -mr-2"
          >
            <Calendar className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-border/40 pb-3">
            <span className="text-xs text-muted-foreground uppercase">
              24h Change
            </span>
            <span className="text-sm font-medium text-primary flex items-center gap-1">
              + 2.34%
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-border/40 pb-3">
            <span className="text-xs text-muted-foreground uppercase">
              Volume (24h)
            </span>
            <span className="text-sm font-medium text-foreground">$84.42B</span>
          </div>
          <div className="flex justify-between items-center border-b border-border/40 pb-3">
            <span className="text-xs text-muted-foreground uppercase">
              Market Cap
            </span>
            <span className="text-sm font-medium text-foreground">
              $804.42B
            </span>
          </div>
          <div className="flex justify-between items-center pb-1">
            <span className="text-xs text-muted-foreground uppercase">
              Avg. Monthly Growing
            </span>
            <span className="text-sm font-medium text-foreground">
              $804.42B
            </span>
          </div>
        </div>

        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold mt-auto">
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </Button>
      </CardContent>
    </Card>
  )
}
