import portrait from "@/assets/doctor/ramesh-kandel-portrait.webp";
import ageingCouple from "@/assets/doctor/ageing-couple.jpg";
import teaching from "@/assets/doctor/teaching.jpg";
import caregiver from "@/assets/doctor/caregiver.jpg";
import research from "@/assets/doctor/research.jpg";
import checkup from "@/assets/doctor/checkup.jpg";
import clinic from "@/assets/doctor/clinic.jpg";
import press from "@/assets/doctor/swasthya-dementia.webp";
import hiwCyclist from "@/assets/hiw/cyclist.jpg";
import hiwLaptop from "@/assets/hiw/laptop.jpg";

export interface SitePhoto {
  src: string;
  alt: string;
  page?: string;
  width?: number;
  height?: number;
}

export const cvUrl = "/Ramesh_Kandel_CV.pdf";

/* The sizes are the files' own pixels, so the browser can hold the space before a photo arrives. */
export const home = {
  portrait: { src: portrait, alt: "Dr. Ramesh Kandel, geriatrician, smiling in a blue shirt", width: 819, height: 819 },
  ageingCouple: { src: ageingCouple, alt: "An elderly couple walking hand in hand on a hillside path at sunset", width: 1152, height: 864 },
  teaching: { src: teaching, alt: "Medical students in white coats attending a lecture", width: 1152, height: 864 },
  caregiver: { src: caregiver, alt: "A young woman helping her grandmother stand up from a chair at home", width: 1152, height: 864 },
  research: { src: research, alt: "Research papers, charts, reading glasses, a stethoscope and a notebook on a desk", width: 1152, height: 864 },
  checkup: { src: checkup, alt: "A doctor examining an elderly patient at a community health camp in Nepal", width: 1280, height: 960 },
  clinic: { src: clinic, alt: "A doctor consulting with a patient in a clinic", width: 1280, height: 960 },
  press: { src: press, alt: "Quote card from Dr. Ramesh Kandel's Swasthya Khabarpatrika article on dementia prevention, with his portrait", width: 1087, height: 611 },
} satisfies Record<string, SitePhoto>;

export type PhotoKey = keyof typeof home;

export const hiw = {
  cyclist: { src: hiwCyclist, alt: "Overhead view of a cyclist riding a bicycle across a pale blue field", width: 852, height: 646 },
  laptop: { src: hiwLaptop, alt: "Overhead view of two hands typing on a laptop laid on a pale pink field", width: 840, height: 457 },
} satisfies Record<string, SitePhoto>;

