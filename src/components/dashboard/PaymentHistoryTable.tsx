import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const transactions = [
  {
    name: 'Achain',
    change: '-8.43%',
    date: '12 Jun, 2024',
    price: '$ 14,92.33',
    status: 'Successfully',
    icon: 'https://img.usecurling.com/i?q=achain&color=white&shape=fill',
  },
  {
    name: 'Cardano',
    change: '+ 2.34%',
    date: '16 May, 2024',
    price: '$ 2,432.90',
    status: 'Successfully',
    icon: 'https://img.usecurling.com/i?q=cardano&color=blue&shape=fill',
  },
  {
    name: 'Digibyte',
    change: '+16.84',
    date: '21 Feb, 2024',
    price: '$ 202.43',
    status: 'Successfully',
    icon: 'https://img.usecurling.com/i?q=digibyte&color=blue&shape=fill',
  },
  {
    name: 'Ethereum',
    change: '-34.34%',
    date: '19 Des, 2023',
    price: '$ 902.10',
    status: 'Successfully',
    icon: 'https://img.usecurling.com/i?q=ethereum&color=white&shape=fill',
  },
]

export function PaymentHistoryTable() {
  return (
    <Card className="bg-card border-none shadow-lg mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-foreground">
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="text-xs font-medium text-muted-foreground uppercase w-[30%]">
                Name
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase w-[25%]">
                Date
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase w-[25%]">
                Price
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase text-right w-[20%]">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx, index) => (
              <TableRow
                key={index}
                className="hover:bg-muted/20 border-border/40 transition-colors cursor-pointer group"
              >
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted/30 p-1.5 flex items-center justify-center">
                      <img
                        src={tx.icon}
                        alt={tx.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <span>{tx.name}</span>
                      <span
                        className={cn(
                          'text-xs font-medium',
                          tx.change.startsWith('+')
                            ? 'text-primary'
                            : 'text-destructive',
                        )}
                      >
                        {tx.change}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {tx.date}
                </TableCell>
                <TableCell className="text-foreground font-medium">
                  {tx.price}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary/80 shadow-[0_0_8px_rgba(0,230,118,0.6)]" />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {tx.status}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
