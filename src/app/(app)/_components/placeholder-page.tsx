import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Coming soon</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>{title} is not built yet</CardTitle>
          <CardDescription>
            This section already has a real route and a place in the sidebar, so we can layer the
            feature in without changing the app structure later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The first completed vertical slice is wallets. Once you are happy with that flow, we can
            apply the same pattern here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
