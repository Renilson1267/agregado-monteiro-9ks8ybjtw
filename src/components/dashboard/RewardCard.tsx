import { Card, CardContent } from '@/components/ui/card'

export function RewardCard() {
  return (
    <Card className="bg-card border-none shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-card to-muted/10 pointer-events-none" />
      <CardContent className="p-5 flex flex-col justify-center h-full relative z-10">
        <p className="text-sm text-muted-foreground mb-1">Reward Rate</p>
        <h3 className="text-3xl font-bold text-foreground/80">14.74%</h3>
      </CardContent>
    </Card>
  )
}
