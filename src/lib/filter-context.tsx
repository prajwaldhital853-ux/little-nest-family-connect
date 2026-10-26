import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type MessageTab = "all" | "new" | "read";

interface FilterContextValue {
  messageTab: MessageTab;
  setMessageTab: (tab: MessageTab) => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [messageTab, setMessageTab] = useState<MessageTab>("new");
  const value = useMemo<FilterContextValue>(
    () => ({ messageTab, setMessageTab }),
    [messageTab],
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be inside FilterProvider");
  return ctx;
}
