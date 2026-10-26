import { useMemo, useState, type ReactNode } from "react";
import {
  DataProviderContext,
  type AppDataProvider,
  type ContactMessage,
} from "@/lib/data-provider";

const day = 86_400_000;
const ago = (days: number, hours = 0) =>
  new Date(Date.now() - days * day - hours * 3_600_000).toISOString();

const SEED_MESSAGES: ContactMessage[] = [
  { id: "m1", name: "Priya Raman", email: "priya.raman@example.com", subject: "Tour for our 8-month-old", inquiry_type: "General Question", message: "Hi! We're moving to Southeast Portland in March and would love to tour the Nest. Are Tuesday mornings possible? Our daughter will be about ten months by then.", status: "new", created_at: ago(0, 2) },
  { id: "m2", name: "Marcus Bell", email: "marcus.bell@example.com", subject: "Waitlist for the Burrow", inquiry_type: "General Question", message: "Our son turns 18 months in June. How long is the waitlist for the Burrow right now, and do siblings get priority?", status: "new", created_at: ago(0, 6) },
  { id: "m3", name: "Elena Ortiz", email: "elena@portlandfamilies.org", subject: "Feature in Portland Families", inquiry_type: "Press / Media", message: "I'm writing a piece on outdoor play in local preschools and would love to include your mud kitchen. Could I visit and take a few photos next week?", status: "new", created_at: ago(1, 3) },
  { id: "m4", name: "Hannah Lee", email: "hannah.lee@example.com", subject: "Part-time options in the Grove?", inquiry_type: "General Question", message: "Do you offer three-day weeks for preschoolers? Our daughter is four and goes to her grandparents on Mondays and Fridays.", status: "new", created_at: ago(1, 9) },
  { id: "m5", name: "Sam Whitaker", email: "sam@greenleafmusic.com", subject: "Music sessions for little ones", inquiry_type: "Collaboration", message: "I run toddler music classes around Portland and would love to offer a weekly sing-along in the Burrow. Happy to do a free trial session first.", status: "read", created_at: ago(2, 4) },
  { id: "m6", name: "Olivia Chen", email: "olivia.chen@example.com", subject: "Food allergies", inquiry_type: "General Question", message: "Our son has a peanut allergy. Could you tell me how snacks and lunches are handled, and whether the kitchen is nut-free?", status: "read", created_at: ago(3, 1) },
  { id: "m7", name: "Daniel Kim", email: "daniel.kim@example.com", subject: "Thank you, Ms. Rosa!", inquiry_type: "Other", message: "Just wanted to say thank you to Rosa and the Nest team. Our son's first month has gone so much better than we hoped. He waves goodbye now!", status: "read", created_at: ago(4, 5) },
  { id: "m8", name: "Aisha Johnson", email: "aisha.j@example.com", subject: "Tuition help", inquiry_type: "General Question", message: "Do you accept Employment Related Day Care subsidies, or offer any sliding-scale tuition for the Grove?", status: "new", created_at: ago(5, 2) },
  { id: "m9", name: "Tom Becker", email: "tom@seportlandnews.com", subject: "Open house listing", inquiry_type: "Press / Media", message: "We'd like to list your spring open house in our community calendar. Can you confirm the date, time and whether RSVPs are needed?", status: "read", created_at: ago(6, 7) },
  { id: "m10", name: "Grace Murphy", email: "grace.murphy@example.com", subject: "Starting mid-year", inquiry_type: "General Question", message: "Is it possible to join the Grove in January? We're hoping our son can have a few months before kindergarten.", status: "read", created_at: ago(8, 3) },
  { id: "m11", name: "Leo Fernandes", email: "leo@rootedgardens.co", subject: "Garden beds for the kids", inquiry_type: "Collaboration", message: "We build raised garden beds for schools and would love to donate two for your outdoor space this spring. Let me know if you're interested!", status: "new", created_at: ago(9, 6) },
  { id: "m12", name: "Maya Patel", email: "maya.patel@example.com", subject: "Nap routine question", inquiry_type: "General Question", message: "Our toddler still takes two naps. How does the Burrow handle different nap schedules during the day?", status: "read", created_at: ago(11, 2) },
  { id: "m13", name: "Chris Nguyen", email: "chris.nguyen@example.com", subject: "Late pickup", inquiry_type: "Other", message: "What happens if we're running late for the 6:00 pm pickup? My shift sometimes runs over by fifteen minutes.", status: "read", created_at: ago(13, 4) },
  { id: "m14", name: "Rachel Adams", email: "rachel.adams@example.com", subject: "Teacher qualifications", inquiry_type: "General Question", message: "Could you share a little about your teachers' training and how long most of them have been with Hazel House?", status: "new", created_at: ago(15, 1) },
];

export function SeedDataProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ContactMessage[]>(SEED_MESSAGES);

  const provider = useMemo<AppDataProvider>(
    () => ({
      useProfile: () => ({
        data: { id: "demo", full_name: "Joanna Hale" },
        isLoading: false,
      }),
      useCreateContactMessage: () => ({
        mutate: (input) =>
          setMessages((list) => [
            { ...input, id: `m${Date.now()}`, status: "new", created_at: new Date().toISOString() },
            ...list,
          ]),
        isPending: false,
      }),
      useMessages: ({ tab }) => ({
        data: messages.filter((m) =>
          tab === "all" ? m.status !== "archived" : m.status === tab,
        ),
        isLoading: false,
      }),
      useUpdateMessageStatus: () => ({
        mutate: ({ id, status }) =>
          setMessages((list) =>
            list.map((m) => (m.id === id ? { ...m, status } : m)),
          ),
        isPending: false,
      }),
    }),
    [messages],
  );

  return (
    <DataProviderContext.Provider value={provider}>
      {children}
    </DataProviderContext.Provider>
  );
}
