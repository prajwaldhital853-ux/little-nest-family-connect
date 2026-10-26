import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPage } from "@/components/admin-page";
import { useDataProvider, type ContactMessage } from "@/lib/data-provider";
import { useFilters, type MessageTab } from "@/lib/filter-context";
import { MessagesTable } from "./components/messages-table";
import { MessageDetailPanel } from "./components/message-detail-panel";
import { MessagesBlankslate } from "./components/messages-blankslate";

export default function AdminMessages() {
  const { messageTab, setMessageTab } = useFilters();
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const { useMessages, useUpdateMessageStatus } = useDataProvider();
  const { data: messages } = useMessages({ tab: messageTab });
  const { mutate: updateStatus } = useUpdateMessageStatus();

  const openPanel = (message: ContactMessage) => {
    setSelected(message);
    setPanelOpen(true);
    if (message.status === "new") {
      updateStatus({ id: message.id, status: "read" });
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <AdminPage
      title="Messages"
      description="Messages sent through your contact form."
    >
      <Tabs
        value={messageTab}
        onValueChange={(v) => setMessageTab(v as MessageTab)}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-6">
        {isEmpty ? (
          <MessagesBlankslate />
        ) : (
          <MessagesTable messages={messages} onSelect={openPanel} />
        )}
      </div>

      <MessageDetailPanel
        message={selected}
        open={panelOpen}
        onOpenChange={setPanelOpen}
      />
    </AdminPage>
  );
}
