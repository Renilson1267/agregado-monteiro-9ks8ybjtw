import { Card, CardContent } from '@/components/ui/card'
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from 'recharts'
import { ChartConfig, ChartContainer } from '@/components/ui/chart'

const chartData = [
  { browser: 'safari', visitors: 80, fill: 'var(--color-safari)' },
]

const chartConfig = {
  visitors: {
    label: 'Score',
  },
  safari: {
    label: 'Safari',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

export function CreditScoreCard() {
  return (
    <Card className="bg-card border-none shadow-lg flex flex-col">
      <CardContent className="flex-1 pb-0 pt-6 px-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Your credit score</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Last Check on 21 Apr
            </p>
            <h3 className="text-5xl font-bold text-foreground">660</h3>
            <p className="text-sm text-muted-foreground max-w-[100px]">
              Your credit score is average
            </p>
          </div>
          <div className="h-[160px] w-[160px] relative">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <RadialBarChart
                data={chartData}
                startAngle={90}
                endAngle={-180} // Adjusted for partial circle
                innerRadius={60}
                outerRadius={85}
              >
                <PolarGrid
                  gridType="circle"
                  radialLines={false}
                  stroke="none"
                  className="first:fill-muted/20 last:fill-background"
                  polarRadius={[66, 54]}
                />
                <RadialBar
                  dataKey="visitors"
                  background
                  cornerRadius={10}
                  className="stroke-transparent stroke-2"
                />
                <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {chartData[0].visitors}%
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 20}
                              className="fill-primary text-xs font-medium"
                            >
                              + 2.34%
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </PolarRadiusAxis>
              </RadialBarChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
