import portrait from "@/assets/doctor/ramesh-kandel-portrait.png";
import ageingCouple from "@/assets/doctor/ageing-couple.jpg";
import teaching from "@/assets/doctor/teaching.jpg";
import caregiver from "@/assets/doctor/caregiver.jpg";
import research from "@/assets/doctor/research.jpg";
import checkup from "@/assets/doctor/checkup.jpg";
import clinic from "@/assets/doctor/clinic.jpg";
import hiwCyclist from "@/assets/hiw/cyclist.jpg";
import hiwLaptop from "@/assets/hiw/laptop.jpg";
import hiwChart from "@/assets/hiw/chart.jpg";

export interface SitePhoto {
  src: string;
  alt: string;
  page?: string;
}

export const cvUrl = "/Ramesh_Kandel_CV.pdf";

export const home = {
  portrait: { src: portrait, alt: "Professor Ramesh Kandel, geriatrician, smiling in a blue shirt" },
  ageingCouple: { src: ageingCouple, alt: "An elderly couple walking hand in hand on a hillside path at sunset" },
  teaching: { src: teaching, alt: "Medical students in white coats attending a lecture" },
  caregiver: { src: caregiver, alt: "A young woman helping her grandmother stand up from a chair at home" },
  research: { src: research, alt: "Research papers, charts, reading glasses, a stethoscope and a notebook on a desk" },
  checkup: { src: checkup, alt: "A doctor examining an elderly patient at a community health camp in Nepal" },
  clinic: { src: clinic, alt: "A doctor consulting with a patient in a clinic" },
} satisfies Record<string, SitePhoto>;

export const hiw = {
  cyclist: { src: hiwCyclist, alt: "Overhead view of a cyclist riding a bicycle across a pale blue field" },
  laptop: { src: hiwLaptop, alt: "Overhead view of two hands typing on a laptop laid on a pale pink field" },
  chart: { src: hiwChart, alt: "A chart card tracking a blood sugar trend falling from 136 to 88 over six months" },
} satisfies Record<string, SitePhoto>;

