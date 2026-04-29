import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-3 h-3 w-1/2" />
            <Skeleton className="mt-5 h-10 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}

