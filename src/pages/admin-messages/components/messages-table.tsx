import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/base/badge";
import { type ContactMessage } from "@/lib/data-provider";
import { formatMessageDateShort } from "../lib";

const statusBadge: Record<
  "new" | "read",
  { color: "blue" | "gray"; label: string }
> = {
  new: { color: "blue", label: "new" },
  read: { color: "gray", label: "read" },
};

export function MessagesTable({
  messages,
  onSelect,
}: {
  messages: ContactMessage[];
  onSelect: (message: ContactMessage) => void;
}) {
  return (
    <div className="rounded-lg border border-solid">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>From</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.map((message) => {
            const badge = statusBadge[message.status as "new" | "read"];
            const emphasis =
              message.status === "new" ? "font-medium" : "font-normal";
            return (
              <TableRow
                key={message.id}
                onClick={() => onSelect(message)}
                className="cursor-pointer hover:bg-accent/50"
              >
                <TableCell className={`text-foreground ${emphasis}`}>
                  {message.name}
                </TableCell>
                <TableCell className={`text-foreground ${emphasis}`}>
                  {message.subject}
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {formatMessageDateShort(message.created_at)}
                </TableCell>
                <TableCell>
                  {badge && <Badge color={badge.color}>{badge.label}</Badge>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
