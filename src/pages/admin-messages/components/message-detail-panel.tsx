import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/base/badge";
import { useDataProvider, type ContactMessage } from "@/lib/data-provider";
import { formatMessageDateLong } from "../lib";

export function MessageDetailPanel({
  message,
  open,
  onOpenChange,
}: {
  message: ContactMessage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { useUpdateMessageStatus } = useDataProvider();
  const { mutate, isPending } = useUpdateMessageStatus();

  const archive = () => {
    if (!message) return;
    mutate({ id: message.id, status: "archived" });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto sm:max-w-md"
      >
        {message && (
          <>
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="text-lg font-semibold">
                {message.name}
              </SheetTitle>
              <a
                href={`mailto:${message.email}`}
                className="block text-sm text-muted-foreground hover:text-foreground"
              >
                {message.email}
              </a>
            </SheetHeader>

            <Separator className="my-6" />

            <div className="space-y-2">
              <Badge color="gray">{message.inquiry_type}</Badge>
              <p className="text-sm font-medium text-foreground">
                {message.subject}
              </p>
              <p className="text-sm text-muted-foreground tabular-nums">
                {formatMessageDateLong(message.created_at)}
              </p>
            </div>

            <Separator className="my-6" />

            <blockquote className="border-l-2 border-border bg-muted/50 px-4 py-3 text-sm text-foreground text-pretty">
              {message.message}
            </blockquote>

            <Separator className="my-6" />

            <Button
              variant="ghost"
              className="w-full rounded-md hover:text-destructive"
              onClick={archive}
              disabled={isPending}
            >
              Archive
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
