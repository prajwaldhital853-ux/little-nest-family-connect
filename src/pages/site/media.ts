import heroClassroom from "@/assets/hazel-house/hero-classroom.webp";
import nestCard from "@/assets/hazel-house/nest-card.webp";
import nestCardHover from "@/assets/hazel-house/nest-card-hover.webp";
import burrowCard from "@/assets/hazel-house/burrow-card.webp";
import burrowCardHover from "@/assets/hazel-house/burrow-card-hover.webp";
import groveCard from "@/assets/hazel-house/grove-card.webp";
import groveCardHover from "@/assets/hazel-house/grove-card-hover.webp";
import storyTeacher from "@/assets/hazel-house/story-teacher.webp";
import fullRug from "@/assets/hazel-house/full-rug.webp";
import visitRoom from "@/assets/hazel-house/visit-room.webp";
import footRainbow from "@/assets/hazel-house/foot-rainbow.webp";
import footRainbows from "@/assets/hazel-house/foot-rainbows.webp";
import footCrayons from "@/assets/hazel-house/foot-crayons.webp";
import aboutHero from "@/assets/hazel-house/about-hero.webp";
import aboutPause from "@/assets/hazel-house/about-pause.webp";
import nestHero from "@/assets/hazel-house/nest-hero.webp";
import nestSplit from "@/assets/hazel-house/nest-split.webp";
import burrowHero from "@/assets/hazel-house/burrow-hero.webp";
import burrowSplit from "@/assets/hazel-house/burrow-split.webp";
import groveHero from "@/assets/hazel-house/grove-hero.webp";
import groveSplit from "@/assets/hazel-house/grove-split.webp";
import stepVisit from "@/assets/hazel-house/step-visit.webp";
import stepApply from "@/assets/hazel-house/step-apply.webp";
import stepPapers from "@/assets/hazel-house/step-papers.webp";
import stepSettle from "@/assets/hazel-house/step-settle.webp";
import applyTeacher from "@/assets/hazel-house/apply-teacher.webp";
import contactRainbow from "@/assets/hazel-house/contact-rainbow.webp";
import nestCloud from "@/assets/hazel-house/nest-cloud.webp";
import burrowCloud from "@/assets/hazel-house/burrow-cloud.webp";
import groveCloud from "@/assets/hazel-house/grove-cloud.webp";
import nestQuoteCloud from "@/assets/hazel-house/nest-quote-cloud.webp";
import burrowQuoteCloud from "@/assets/hazel-house/burrow-quote-cloud.webp";
import groveQuoteCloud from "@/assets/hazel-house/grove-quote-cloud.webp";
import storyTeacherCloud from "@/assets/hazel-house/story-teacher-cloud.webp";
import nestHeroCloud from "@/assets/hazel-house/nest-hero-cloud.webp";
import burrowHeroCloud from "@/assets/hazel-house/burrow-hero-cloud.webp";
import groveHeroCloud from "@/assets/hazel-house/grove-hero-cloud.webp";
import aboutHeroCloud from "@/assets/hazel-house/about-hero-cloud.webp";
import nestTab from "@/assets/hazel-house/nest-tab.webp";
import burrowTab from "@/assets/hazel-house/burrow-tab.webp";
import groveTab from "@/assets/hazel-house/grove-tab.webp";

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
  heroClassroom: { src: heroClassroom, alt: "Children sorting alphabet cards at a yellow classroom table" },
  visitRoom: { src: visitRoom, alt: "A bright classroom with small chairs, tables and shelves of toys" },
  footRainbow: { src: footRainbow, alt: "A crayon rainbow taped to a white wall" },
  footRainbows: { src: footRainbows, alt: "Four crayon rainbows taped side by side" },
  footCrayons: { src: footCrayons, alt: "Crayon rainbows on paper, seen from above" },
  aboutPause: { src: aboutPause, alt: "Four children standing together in a sunny classroom" },
  stepVisit: { src: stepVisit, alt: "A teacher holding up a letter card for the children" },
  stepApply: { src: stepApply, alt: "A teacher standing with a group of children in the classroom" },
  stepPapers: { src: stepPapers, alt: "A crayon drawing on paper beside a pile of crayons" },
  stepSettle: { src: stepSettle, alt: "A toddler playing happily at a small table" },
  applyTeacher: { src: applyTeacher, alt: "Children gathered round their teacher" },
  contactRainbow: { src: contactRainbow, alt: "A hand drawing a rainbow with crayons" },
  nestCloud: { src: nestCloud, alt: "A baby sitting on a bright play mat, looking up" },
  burrowCloud: { src: burrowCloud, alt: "A toddler stacking coloured wooden blocks" },
  groveCloud: { src: groveCloud, alt: "Children painting with watercolours at a table" },
  nestQuoteCloud: { src: nestQuoteCloud, alt: "A baby reaching for a toy on a play mat" },
  burrowQuoteCloud: { src: burrowQuoteCloud, alt: "A toddler playing with wooden toys in a bright playroom" },
  groveQuoteCloud: { src: groveQuoteCloud, alt: "A child drawing on a chalkboard easel" },
  storyTeacherCloud: { src: storyTeacherCloud, alt: "A teacher helping two children at a yellow table" },
  nestHeroCloud: { src: nestHeroCloud, alt: "A baby and a grown-up laughing together on a play mat" },
  burrowHeroCloud: { src: burrowHeroCloud, alt: "Two toddlers playing with wooden blocks on the floor" },
  groveHeroCloud: { src: groveHeroCloud, alt: "Children painting with their teacher at a long table" },
  aboutHeroCloud: { src: aboutHeroCloud, alt: "A teacher showing children how to draw" },
  nestTab: { src: nestTab, alt: "A baby and a grown-up laughing together on a play mat" },
  burrowTab: { src: burrowTab, alt: "A toddler playing with wooden toys in a bright playroom" },
  groveTab: { src: groveTab, alt: "Children painting with their teacher at a long table" },
} satisfies Record<string, SitePhoto>;
