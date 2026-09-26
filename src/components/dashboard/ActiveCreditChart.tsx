import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

const data = [
  { time: '2:00pm', btc: 4000, eth: 2400 },
  { time: '3:00pm', btc: 6000, eth: 2400 },
  { time: '4:00pm', btc: 6000, eth: 2400 },
  { time: '5:00pm', btc: 10000, eth: 4500 },
  { time: '6:00pm', btc: 8420, eth: 2980 },
  { time: '7:00pm', btc: 12000, eth: 5000 },
  { time: '8:00pm', btc: 12000, eth: 5000 },
  { time: '9:00pm', btc: 12000, eth: 5000 },
]

const chartConfig = {
  btc: {
    label: 'Bitcoin',
    color: 'hsl(var(--chart-1))',
  },
  eth: {
    label: 'Ethereum',
    color: 'hsl(var(--chart-2))',
  },
}

export function ActiveCreditChart() {
  return (
    <Card className="bg-card border-none shadow-lg h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium text-foreground">
          Active credit
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <Calendar className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 min-h-[300px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <AreaChart
            data={data}
            margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorBtc" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-btc)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-btc)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="colorEth" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-eth)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-eth)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="hsl(var(--border))"
              strokeDasharray="3 3"
              strokeOpacity={0.4}
            />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover border border-border p-3 rounded-lg shadow-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-[hsl(var(--chart-1))]" />
                        <span className="text-xs text-muted-foreground">
                          1 BTC
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          ${payload[0].value?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[hsl(var(--chart-2))]" />
                        <span className="text-xs text-muted-foreground">
                          1 ETH
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          ${payload[1].value?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              type="monotone"
              dataKey="btc"
              stroke="var(--color-btc)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorBtc)"
            />
            <Area
              type="monotone"
              dataKey="eth"
              stroke="var(--color-eth)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorEth)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
