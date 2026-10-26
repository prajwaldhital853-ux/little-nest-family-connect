import { createContext, useContext, type ReactNode } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/auth-provider";

export type InquiryType =
  | "General Question"
  | "Press / Media"
  | "Collaboration"
  | "Other";

export type MessageStatus = "new" | "read" | "archived";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  inquiry_type: InquiryType;
  message: string;
  status: MessageStatus;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
}

export interface CreateContactMessageInput {
  name: string;
  email: string;
  subject: string;
  inquiry_type: InquiryType;
  message: string;
}

export interface MessageFilters {
  tab: "all" | "new" | "read";
}

export interface UpdateMessageStatusInput {
  id: string;
  status: "read" | "archived";
}

interface ReadResult<T> {
  data: T;
  isLoading: boolean;
}

interface MutationResult<TInput> {
  mutate: (input: TInput) => void;
  isPending: boolean;
}

export interface AppDataProvider {
  useProfile(): ReadResult<Profile>;
  useCreateContactMessage(): MutationResult<CreateContactMessageInput>;
  useMessages(filters: MessageFilters): ReadResult<ContactMessage[]>;
  useUpdateMessageStatus(): MutationResult<UpdateMessageStatusInput>;
}

export const DataProviderContext = createContext<AppDataProvider | null>(null);

export function useDataProvider(): AppDataProvider {
  const ctx = useContext(DataProviderContext);
  if (!ctx) throw new Error("useDataProvider must be inside a DataProvider");
  return ctx;
}

const MESSAGE_COLUMNS =
  "id, name, email, subject, inquiry_type, message, status, created_at";

export function SupabaseDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const provider: AppDataProvider = {
    useProfile: () => {
      const { data, isLoading } = useQuery({
        queryKey: ["profile", userId],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, full_name")
            .eq("id", userId!)
            .single();
          if (error) throw error;
          return data as unknown as Profile;
        },
        enabled: !!userId,
      });
      return {
        data: data ?? { id: userId ?? "", full_name: "" },
        isLoading,
      };
    },

    useCreateContactMessage: () => {
      const mutation = useMutation({
        mutationFn: async (input: CreateContactMessageInput) => {
          const { error } = await supabase.from("contact_messages").insert({
            name: input.name,
            email: input.email,
            subject: input.subject,
            inquiry_type: input.inquiry_type,
            message: input.message,
            status: "new",
          });
          if (error) throw error;
          return null;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["messages"] });
        },
        onError: () => {
          toast.error("Couldn't send your message — please try again.");
        },
      });
      return { mutate: mutation.mutate, isPending: mutation.isPending };
    },

    useMessages: (filters) => {
      const { data, isLoading } = useQuery({
        queryKey: ["messages", userId, filters.tab],
        queryFn: async () => {
          let query = supabase
            .from("contact_messages")
            .select(MESSAGE_COLUMNS)
            .eq("owner_id", userId!);

          if (filters.tab === "all") {
            query = query.in("status", ["new", "read"]);
          } else if (filters.tab === "new") {
            query = query.eq("status", "new");
          } else {
            query = query.eq("status", "read");
          }

          const { data, error } = await query.order("created_at", {
            ascending: false,
          });
          if (error) throw error;
          return (data ?? []) as unknown as ContactMessage[];
        },
        enabled: !!userId,
      });
      return { data: data ?? [], isLoading };
    },

    useUpdateMessageStatus: () => {
      const mutation = useMutation({
        mutationFn: async (input: UpdateMessageStatusInput) => {
          const { data, error } = await supabase
            .from("contact_messages")
            .update({ status: input.status })
            .eq("id", input.id)
            .eq("owner_id", userId!)
            .select(MESSAGE_COLUMNS)
            .single();
          if (error) throw error;
          return data as unknown as ContactMessage;
        },
        onMutate: async (input) => {
          await queryClient.cancelQueries({ queryKey: ["messages", userId] });
          const snapshots = queryClient.getQueriesData<ContactMessage[]>({
            queryKey: ["messages", userId],
          });
          for (const [key] of snapshots) {
            queryClient.setQueryData<ContactMessage[]>(key, (current) =>
              (current ?? [])
                .filter((m) =>
                  input.status === "archived" ? m.id !== input.id : true,
                )
                .map((m) =>
                  m.id === input.id ? { ...m, status: input.status } : m,
                ),
            );
          }
          return { snapshots };
        },
        onError: (_err, _input, context) => {
          for (const [key, list] of context?.snapshots ?? []) {
            queryClient.setQueryData(key, list);
          }
          toast.error("Couldn't update the message — try again.");
        },
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey: ["messages", userId] });
        },
      });
      return { mutate: mutation.mutate, isPending: mutation.isPending };
    },
  };

  return (
    <DataProviderContext.Provider value={provider}>
      {children}
    </DataProviderContext.Provider>
  );
}
