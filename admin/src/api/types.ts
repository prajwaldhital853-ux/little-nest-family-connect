export type PublishStatus = "draft" | "published";

export interface StaffUser {
  id: number;
  email: string;
  full_name: string;
  job_title: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined?: string;
  last_login?: string | null;
}

export interface SignedInReply {
  otp_required: false;
  access: string;
  expires_in: number;
  user: StaffUser;
}

export interface CodeReply {
  otp_required: true;
  email: string;
  expires_in: number;
}

export interface TrustedDevice {
  id: number;
  label: string;
  created_at: string;
  last_seen_at: string | null;
}

export interface PageCopy {
  id: number;
  key: string;
  label: string;
  data: Record<string, unknown>;
  published: boolean;
  updated_at: string;
  updated_by_email: string;
}

export interface SiteImage {
  id: number;
  url: string;
  label: string;
  alt: string;
  bytes: number;
  created_at: string;
}

export interface AuditEntry {
  id: number;
  created_at: string;
  actor_label: string;
  action: string;
  target_type: string;
  target_id: string | number | null;
  target_label: string;
  detail: Record<string, unknown> | null;
}

export interface AuditFacets {
  actions: { action: string; total: number }[];
  actors: { actor_label: string; total: number }[];
}

export interface VitalRow {
  samples: number;
  p75: number;
  rating: "good" | "needs work" | "poor";
}

export interface AnalyticsSummary {
  range: { days: number; from: string; to: string };
  totals: {
    pageviews: number;
    visitors: number;
    sessions: number;
    enquiries: number;
    average_seconds: number;
    since: string | null;
  };
  series: { day: string; pageviews: number; visitors: number; enquiries: number }[];
  top_pages: { path: string; views: number }[];
  devices: { kind: string; views: number }[];
  browsers: { browser: string; total: number }[];
  referrers: { referrer_host: string; total: number }[];
  campaigns: { utm_source: string; utm_medium: string; total: number }[];
  vitals: Record<string, VitalRow>;
}

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
export type AppointmentKind = "in_person" | "video" | "follow_up";

export interface Appointment {
  id: number;
  reference: string;
  status: AppointmentStatus;
  status_display: string;
  next_statuses: AppointmentStatus[];
  kind: AppointmentKind;
  kind_display: string;
  scheduled_at: string | null;
  patient_name: string;
  patient_email: string;
  phone: string;
  concerns: string;
  aim: string;
  message: string;
  assigned_to: number | null;
  assigned_to_name: string;
  admin_note: string;
  created_at: string;
  updated_at: string;
}

export interface CmsRow extends Record<string, unknown> {
  id: number;
  status: PublishStatus;
  status_display: string;
  published_at: string | null;
  order: number;
  updated_at: string;
}

export interface PublicationRow extends CmsRow {
  title: string;
  authors: string;
  venue: string;
  year: number | null;
  tag: string;
  link: string;
  kind: string;
  kind_display: string;
}

export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
