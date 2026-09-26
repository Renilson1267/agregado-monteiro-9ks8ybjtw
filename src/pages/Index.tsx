import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ActiveCreditChart } from '@/components/dashboard/ActiveCreditChart'
import { CreditScoreCard } from '@/components/dashboard/CreditScoreCard'
import { CryptoCard } from '@/components/dashboard/CryptoCard'
import { RewardCard } from '@/components/dashboard/RewardCard'
import { PaymentHistoryTable } from '@/components/dashboard/PaymentHistoryTable'
import introJs from 'intro.js'
import 'intro.js/introjs.css'

const Index = () => {
  const [date, setDate] = useState<Date | undefined>(new Date())

  useEffect(() => {
    // Check if onboarding has been completed
    const hasSeenOnboarding = localStorage.getItem('onboarding-completed')

    if (!hasSeenOnboarding) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        introJs()
          .setOptions({
            steps: [
              {
                element: '#sidebar',
                intro:
                  'Use this sidebar to navigate between different sections like Reports, Cryptocurrency, and Exchange.',
                title: 'Navigation',
                position: 'right',
              },
              {
                element: '#theme-toggle',
                intro:
                  'Toggle between Dark and Light mode here to customize your viewing experience.',
                title: 'Theme Toggle',
                position: 'right',
              },
              {
                element: '#dashboard-header',
                intro:
                  'Here you can see your welcome message, select a date range for your data, and add new coins.',
                title: 'Welcome & Actions',
                position: 'bottom',
              },
              {
                element: '#stats-card-section',
                intro:
                  'View your total spending for the month and key market statistics at a glance.',
                title: 'Monthly Stats',
                position: 'right',
              },
              {
                element: '#active-credit-chart-section',
                intro:
                  'Monitor your active credit usage trends throughout the day with this interactive chart.',
                title: 'Active Credit',
                position: 'left',
              },
              {
                element: '#credit-and-assets-section',
                intro:
                  'Check your current credit score, crypto asset values, and reward rates in this section.',
                title: 'Credit & Assets',
                position: 'left',
              },
              {
                element: '#payment-history-section',
                intro:
                  'Review your recent transaction history, including prices, dates, and status.',
                title: 'Payment History',
                position: 'top',
              },
            ],
            showProgress: true,
            showBullets: false,
            exitOnOverlayClick: false,
            overlayOpacity: 0.6,
            doneLabel: 'Done',
            nextLabel: 'Next',
            prevLabel: 'Back',
          })
          .oncomplete(() => {
            localStorage.setItem('onboarding-completed', 'true')
          })
          .onexit(() => {
            localStorage.setItem('onboarding-completed', 'true')
          })
          .start()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div
        id="dashboard-header"
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Welcome back, Ilona
          </h1>
          <p className="text-muted-foreground">
            Here's take a look at your performance and analytics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="bg-card border-border text-foreground hover:bg-accent hover:text-accent-foreground h-10"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'MMMM yyyy') : 'Select Date'} - May 2024
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button className="bg-card border border-border text-foreground hover:bg-accent hover:text-accent-foreground h-10">
            <Plus className="mr-2 h-4 w-4" />
            Add new coin
          </Button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Stats */}
        <div
          id="stats-card-section"
          className="lg:col-span-3 h-[400px] lg:h-auto"
        >
          <StatsCard />
        </div>

        {/* Middle Column: Chart */}
        <div
          id="active-credit-chart-section"
          className="lg:col-span-6 h-[400px]"
        >
          <ActiveCreditChart />
        </div>

        {/* Right Column: Credit Score & Small Cards */}
        <div
          id="credit-and-assets-section"
          className="lg:col-span-3 flex flex-col gap-6"
        >
          <div className="flex-1">
            <CreditScoreCard />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            <CryptoCard />
            <RewardCard />
          </div>
        </div>
      </div>

      {/* Bottom Section: Payment History */}
      <div id="payment-history-section">
        <PaymentHistoryTable />
      </div>
    </div>
  )
}

export default Index
