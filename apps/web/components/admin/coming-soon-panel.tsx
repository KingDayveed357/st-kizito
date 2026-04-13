import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card-custom"

interface ComingSoonPanelProps {
  title: string
  description: string
}

export function ComingSoonPanel({ title, description }: ComingSoonPanelProps) {
  return (
    <Card className="border-dashed border-outline/40">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-foreground/75">{description}</p>
        <p className="text-sm font-medium text-tertiary">Coming soon. We&apos;re actively working on this feature.</p>
      </CardContent>
    </Card>
  )
}
