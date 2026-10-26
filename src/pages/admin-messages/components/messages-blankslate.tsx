import { IconMail } from "@tabler/icons-react";
import { Card } from "@/components/ui/card";

export function MessagesBlankslate() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none space-y-3 opacity-60"
      >
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-10">
        <Card className="pointer-events-auto flex max-w-sm flex-col items-center gap-4 !shadow-lg px-8 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <IconMail className="size-6 text-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">
              No messages yet
            </p>
            <p className="text-sm text-muted-foreground text-pretty">
              Messages sent through your contact page will appear here.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
