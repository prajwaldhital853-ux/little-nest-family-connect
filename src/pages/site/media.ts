import heroPortrait from "@/assets/doctor/hero-portrait.jpg";
import consultation from "@/assets/doctor/consultation.jpg";
import clinic from "@/assets/doctor/clinic.jpg";
import checkup from "@/assets/doctor/checkup.jpg";
import teleconsult from "@/assets/doctor/teleconsult.jpg";
import lab from "@/assets/doctor/lab.jpg";
import healthCamp from "@/assets/doctor/health-camp.jpg";
import family from "@/assets/doctor/family.jpg";

export interface SitePhoto {
  src: string;
  alt: string;
  page?: string;
}

export interface SiteVideo {
  src: string;
  poster: string;
  page?: string;
}

export const home = {
  heroPortrait: { src: heroPortrait, alt: "Dr. Aashish Karki in his white coat, arms crossed, in his clinic" },
  consultation: { src: consultation, alt: "Dr. Karki listening to a patient across his desk" },
  clinic: { src: clinic, alt: "The warm, bright waiting room of Karki Clinic in Baneshwor" },
  checkup: { src: checkup, alt: "A blood pressure check for an elderly patient" },
  teleconsult: { src: teleconsult, alt: "A video consultation in progress on a laptop" },
  lab: { src: lab, alt: "The on-site laboratory with a microscope and sample tubes" },
  healthCamp: { src: healthCamp, alt: "Dr. Karki checking a villager at a free mountain health camp" },
  family: { src: family, alt: "A young family smiling during a consultation" },
} satisfies Record<string, SitePhoto>;
