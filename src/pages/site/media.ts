import portraitAsset from "@/assets/doctor/ramesh-kandel-portrait.png.asset.json";
import cvAsset from "@/assets/doctor/ramesh-kandel-cv.pdf.asset.json";
import clinic from "@/assets/doctor/clinic.jpg";
import checkup from "@/assets/doctor/checkup.jpg";
import lab from "@/assets/doctor/lab.jpg";
import ageingCouple from "@/assets/doctor/ageing-couple.jpg";
import teaching from "@/assets/doctor/teaching.jpg";
import caregiver from "@/assets/doctor/caregiver.jpg";
import research from "@/assets/doctor/research.jpg";

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

export const cvUrl = cvAsset.url;

export const home = {
  portrait: { src: portraitAsset.url, alt: "Professor Ramesh Kandel, geriatrician, smiling in a blue shirt" },
  clinic: { src: clinic, alt: "A bright, calm hospital waiting area" },
  checkup: { src: checkup, alt: "An older Nepali man in a dhaka topi having his blood pressure checked" },
  lab: { src: lab, alt: "A hospital laboratory with a microscope and sample tubes" },
  ageingCouple: { src: ageingCouple, alt: "An elderly Nepali couple walking hand in hand on a hillside path at sunset" },
  teaching: { src: teaching, alt: "Medical students in white coats attending a lecture on caring for older adults" },
  caregiver: { src: caregiver, alt: "A young woman helping her grandmother stand up from a chair at home" },
  research: { src: research, alt: "Research papers with charts, reading glasses, a stethoscope and a notebook on a desk" },
} satisfies Record<string, SitePhoto>;
