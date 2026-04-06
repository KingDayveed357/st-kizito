import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card-custom"
import { Badge } from "@/components/ui/badge-custom"
import type { ActivityLog } from "@/lib/mock-data"
import { mockActivityLog } from "@/lib/mock-data"

export function RecentActivity() {
  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Latest actions in your parish</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivityLog.map((log) => (
            <div key={log.id} className="flex items-start justify-between border-b border-border pb-4 last:border-0">
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">{log.action}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {log.user} {log.details && `• ${log.details}`}
                </p>
              </div>
              <span className="text-xs text-muted-foreground ml-4 flex-shrink-0">
                {formatTime(log.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
