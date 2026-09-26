import { Card, CardContent } from '@/components/ui/card'
import { Bitcoin, TrendingUp } from 'lucide-react'

export function CryptoCard() {
  return (
    <Card className="bg-card border-none shadow-lg">
      <CardContent className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
            <Bitcoin className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">Bitcoin</h4>
            <span className="text-xs text-muted-foreground font-medium">
              BTC
            </span>
          </div>
        </div>
        <div className="text-right">
          <h4 className="font-bold text-xl text-foreground">$52,291</h4>
          <div className="flex items-center justify-end gap-1 text-primary text-xs font-medium">
            <span>+0.25%</span>
            <TrendingUp className="w-3 h-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
