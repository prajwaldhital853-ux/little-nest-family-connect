import {
  Activity,
  AlarmClock,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Brain,
  Building2,
  Check,
  ClipboardList,
  Eye,
  Footprints,
  GraduationCap,
  HandHeart,
  HeartHandshake,
  HeartPulse,
  Home,
  Lightbulb,
  Mail,
  MapPin,
  Microscope,
  MousePointerClick,
  Phone,
  Pill,
  Presentation,
  Shield,
  Stethoscope,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* Lucide's own icon type: the allowlist can only ever hand back one of these. */
export type CopyIcon = LucideIcon;

/* The panel offers these names; nothing else can be reached, so no arbitrary component is ever mounted. */
export const icons: Record<string, CopyIcon> = {
  activity: Activity,
  "alarm-clock": AlarmClock,
  "arrow-right": ArrowRight,
  "arrow-up-right": ArrowUpRight,
  "book-open": BookOpen,
  brain: Brain,
  "building-2": Building2,
  check: Check,
  "clipboard-list": ClipboardList,
  eye: Eye,
  footprints: Footprints,
  "graduation-cap": GraduationCap,
  "hand-heart": HandHeart,
  "heart-handshake": HeartHandshake,
  "heart-pulse": HeartPulse,
  home: Home,
  lightbulb: Lightbulb,
  mail: Mail,
  "map-pin": MapPin,
  microscope: Microscope,
  "mouse-pointer-click": MousePointerClick,
  phone: Phone,
  pill: Pill,
  presentation: Presentation,
  shield: Shield,
  stethoscope: Stethoscope,
  "trending-up": TrendingUp,
  users: Users,
  video: Video,
};

export function iconOf( name: string | undefined, fallback: CopyIcon ): CopyIcon {
  return ( name && icons[ name ] ) || fallback;
}
