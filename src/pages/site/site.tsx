import {
  Activity,
  AlarmClock,
  BookOpen,
  Brain,
  Building2,
  ClipboardList,
  Eye,
  Footprints,
  GraduationCap,
  HeartHandshake,
  HeartPulse,
  Home,
  Lightbulb,
  Mail,
  Microscope,
  MousePointerClick,
  Pill,
  Presentation,
  Shield,
  Stethoscope,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";

import { ContactDetails } from "@/components/contact-details/contact-details";
import { ContactDetailsForm } from "@/components/contact-details/contact-details-form";
import { TextLink } from "@/components/base/text-link";
import { hazelHouse } from "@/style-packs/hazel-house";

import {
  CareJourney,
  CinematicWork,
  ClosingCta,
  CredentialColumns,
  DoctorFooter,
  DoctorHero,
  DrFaq,
  FullBleedHero,
  HiwAssess,
  HiwBenefits,
  HiwChart,
  HiwConsult,
  HiwCta,
  HiwFaq,
  HiwHero,
  HiwPill,
  HiwPlan,
  HiwProcess,
  HiwSplit,
  HiwTrack,
  HomeBlogSection,
  LeadQuestions,
  MediaGallery,
  NamasteIntro,
  PostList,
  PressSection,
  ProseSection,
  PublicationList,
  StatementBand,
  StoryProse,
  WhyItMatters,
} from "./doctor-sections";
import type { DrMediaItem, DrPost } from "./doctor-sections";
import { cvUrl, hiw, home } from "./media";
import { publicationGroups } from "./publications";
import { Img } from "./parts";
import type { SiteContent } from "./types";

const EMAIL = "drameshkandel@gmail.com";
const PHONE = "+977-9857042717";
const PHONE_HREF = "tel:+9779857042717";

const nav = [
  { label: "About", href: "/about" },
  { label: "Research", href: "/research" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Teaching", href: "/teaching" },
  { label: "Media", href: "/media" },
  { label: "Blog", href: "/blog" },
];

const allLinks = [
  ...nav,
  { label: "Contact", href: "/contact" },
];

const allVideos: DrMediaItem[] = [
  {
    url: "https://www.youtube.com/watch?v=l1H2YtG1vMw",
    kind: "Interview",
    title: "The truth about Alzheimer’s: myths and facts",
    date: "Kritika Dangi, Episode 02",
  },
  {
    url: "https://www.youtube.com/watch?v=IZrt-D8j3dk",
    kind: "Interview",
    title: "Geriatric problems in Nepal",
    date: "Health Television Nepal",
  },
  {
    url: "https://www.youtube.com/watch?v=rSY9I1-c5Ig",
    kind: "TV interview",
    title: "Health Station with Binisha Thapa",
    date: "Himalaya TV",
  },
  {
    url: "https://www.youtube.com/watch?v=BJ6bUJ0LhA8",
    kind: "Talk",
    title: "Climate change and older people in Nepal",
    date: "बाढीमा बगेको बुढ्यौली, recorded talk",
  },
  {
    url: "https://www.youtube.com/watch?v=gbIswWAYIAI",
    kind: "Interview",
    title: "के हो अल्जाइमर (बिर्सने) रोग? लक्षण र रोकथामका उपाय",
    date: "UkeraaTV, Medianp.com",
  },
  {
    url: "https://www.youtube.com/watch?v=Rf4jKLg2JKg",
    kind: "TV interview",
    title: "हाम्रो प्रश्न विज्ञको सुझाव: होम आइसोलेसन",
    date: "NTV Plus, 2078-03-15",
  },
  {
    url: "https://www.youtube.com/watch?v=cRIkwxFmhyQ",
    kind: "Interview",
    title: "जेष्ठ नागरिक रोग विशेषज्ञ: नसर्ने रोगबारे के भन्नुहुन्छ?",
    date: "Butwal Today Online TV",
  },
  {
    url: "https://www.youtube.com/watch?v=g_CN7jE4u8g",
    kind: "TV interview",
    title: "Swasthya Sarokar with Sobita Gautam",
    date: "Nepal Television, 2076-11-08",
  },
  {
    url: "https://www.youtube.com/watch?v=mLYJS-t37Sg",
    kind: "TV interview",
    title: "Swastha Sandesh with Tejendra K.C",
    date: "Buddha TV Butwal",
  },
];

const mediaItems: DrMediaItem[] = allVideos.slice( 0, 3 );

const posts: DrPost[] = [
  {
    slug: "what-healthy-ageing-means",
    date: "October 28, 2026",
    minutes: 6,
    title: "What healthy ageing actually means",
    topic: "Ageing and everyday care",
    excerpt: "Healthy ageing is not the absence of disease. It is keeping people able to do the things they value for as long as possible.",
    photo: home.ageingCouple,
    body: (
      <>
        <p>Healthy ageing means supporting people to do the things they value as they grow older. It requires attention to physical and mental health, functional ability, social relationships and the environments in which people live.</p>
        <p>That definition matters because it changes what we measure. A clinic visit that only asks about symptoms can miss the person who can no longer open a jar, walk to the shop or sleep through the night. Those losses are the ones families describe as the real problem.</p>
        <p>In Nepal this work has to respond to diverse communities, changing family structures and wide differences in access to health and social care. A plan that depends on daily specialist visits, or on equipment that has to be imported, is not a plan at all for most households.</p>
        <p>So I start from function and priorities, then work backwards to what is available locally.</p>
      </>
    ),
  },
  {
    slug: "screening-is-only-the-beginning",
    date: "October 12, 2026",
    minutes: 7,
    title: "Screening is only the beginning",
    topic: "Research into practice",
    excerpt: "Finding a problem is the easy half. What happens in the weeks after the result decides whether screening helped anyone.",
    photo: home.checkup,
    body: (
      <>
        <p>Identifying a health concern is only the beginning. Older people also need access to assessment, appropriate treatment, rehabilitation and continuing support.</p>
        <p>This is where well-intentioned programmes quietly fail. A screening camp produces a list of names, and the list becomes a report. Nobody is worse off than before, but nobody is much better off either.</p>
        <p>My work on the WHO ICOPE approach in Nepal has focused on connecting those steps: implementation planning, health-worker training, and understanding where the gaps between facilities and communities actually sit.</p>
        <p>The central question is practical. How can we ensure that an older person identified as needing support receives care that is accessible, coordinated and meaningful to them?</p>
      </>
    ),
  },
  {
    slug: "caregivers-are-partners",
    date: "September 26, 2026",
    minutes: 6,
    title: "Caregivers are partners, not extras",
    topic: "Families and caregiving",
    excerpt: "Most care for older people in Nepal is given by families at home. They need skills and support, not only instructions.",
    photo: home.caregiver,
    body: (
      <>
        <p>Families provide much of the care for older people in Nepal. Caregivers need information, practical skills and support for their own wellbeing.</p>
        <p>In clinical practice I have seen how several manageable problems can combine to make life difficult for an older person. A fall, a new medicine, poor nutrition or a change in memory may affect the whole family, and the family is usually asked to absorb that without being equipped for it.</p>
        <p>I am interested in approaches that recognise caregivers as partners in care while also acknowledging the pressures and responsibilities they carry. That means explaining what to watch for, what is expected, and when to come back.</p>
        <p>It also means asking the caregiver how they are doing. The answer changes the plan more often than people expect.</p>
      </>
    ),
  },
  {
    slug: "what-geriatrics-teaches-every-clinician",
    date: "September 8, 2026",
    minutes: 8,
    title: "What geriatric medicine teaches every clinician",
    topic: "Education and leadership",
    excerpt: "Understanding multiple conditions together, reviewing medicines thoughtfully and deciding with patients are skills every specialty needs.",
    photo: home.teaching,
    body: (
      <>
        <p>Geriatric medicine offers valuable lessons across healthcare: understanding multiple conditions together, reviewing medicines thoughtfully, assessing function and making decisions with patients and families.</p>
        <p>Medical training is organised by organ system, which prepares people well for single-disease emergencies and less well for the 78-year-old with diabetes, knee pain, poor sleep and six medicines who arrives with her daughter.</p>
        <p>Teaching is a central part of my work. I aim to help learners combine clinical knowledge with careful observation, clear communication and respect for the person receiving care.</p>
        <p>Good care requires careful listening, sound clinical judgement and shared decisions. Treatment should consider a person’s goals, functional ability, family circumstances and the benefits and burdens of available options.</p>
      </>
    ),
  },
  {
    slug: "a-fall-is-rarely-just-an-accident",
    date: "August 21, 2026",
    minutes: 5,
    title: "A fall is rarely just an accident",
    topic: "Ageing and everyday care",
    excerpt: "Older people who fall are usually told they were unlucky. Most of the time there is a reason, and finding it changes what happens next.",
    photo: home.clinic,
    body: (
      <>
        <p>When an older person falls, the first question is usually about the floor. Was it wet, was it dark, was the person in a hurry. Those things matter, but they are rarely the whole story.</p>
        <p>A fall can be the first visible sign of something else. A medicine that lowers blood pressure too far, an infection, eyes that have not been checked in years, or a body that has quietly lost strength and balance over a long season. When we call it bad luck we lose the chance to look.</p>
        <p>In practice I treat a fall as a clinical event. I ask how it happened, whether there was any loss of consciousness, what changed in the weeks before, and what the person was doing at the time. Then I look at medicines, vision, feet, footwear and the home itself.</p>
        <p>Not every fall can be prevented. Many can be, and the difference usually comes from a few patient questions rather than another scan.</p>
      </>
    ),
  },
  {
    slug: "six-medicines-one-person",
    date: "August 3, 2026",
    minutes: 6,
    title: "Six medicines, one person",
    topic: "Ageing and everyday care",
    excerpt: "Each tablet may be reasonable on its own. The combination is a different prescription, and somebody has to look at it as a whole.",
    photo: home.research,
    body: (
      <>
        <p>A person can see four specialists and come home with four sets of instructions, each of which makes perfect sense on its own. Nobody has yet looked at those six medicines as a single regimen belonging to one body.</p>
        <p>Older adults process medicines differently. Kidney function declines, muscle mass shrinks, and the small side effect a younger person never notices can cause dizziness, confusion or a fall.</p>
        <p>A medication review is not a campaign to stop treatment. It asks what each medicine is still doing, whether the dose still fits the person, whether two of them are doing the same job, and what would happen if one was withdrawn with a plan and a follow-up date.</p>
        <p>Bring every medicine to the appointment, including what was bought over the counter and what a relative recommended. The full list is the starting point.</p>
      </>
    ),
  },
  {
    slug: "memory-change-deserves-an-assessment",
    date: "July 17, 2026",
    minutes: 5,
    title: "Memory change deserves an assessment, not a label",
    topic: "Ageing and everyday care",
    excerpt: "Forgetfulness is not automatically dementia, and dementia is not a normal part of ageing. Both ideas cost families time they cannot get back.",
    photo: home.ageingCouple,
    body: (
      <>
        <p>Families often arrive having already decided. Either it is normal ageing and there is nothing to do, or it is dementia and there is nothing to do. Both conclusions are usually wrong, and both delay care.</p>
        <p>Some causes of memory trouble are reversible or at least treatable: depression, thyroid disease, poor sleep, vitamin deficiency, sedating medicines, alcohol. Others are progressive, and knowing early is what makes planning possible.</p>
        <p>A proper assessment takes time. It needs a history from someone who lives with the person as well as from the person, a look at daily function, mood and medicines, and simple cognitive testing. Blood tests and imaging answer specific questions rather than fill the file.</p>
        <p>The goal is not a name for what is happening. The goal is a plan the household can live with, and an honest answer about what comes next.</p>
      </>
    ),
  },
  {
    slug: "eating-less-is-a-symptom",
    date: "June 29, 2026",
    minutes: 5,
    title: "Eating less in older age is a symptom",
    topic: "Ageing and everyday care",
    excerpt: "Weight loss and a poor appetite get filed under ageing. They are worth investigating, and sometimes they are the loudest clue in the room.",
    photo: home.checkup,
    body: (
      <>
        <p>A change in appetite is one of the first things a family notices and one of the easiest to dismiss. He is older now, he does not need as much food. That is not quite true, and the losses that follow are real.</p>
        <p>Unintentional weight loss can point to dental pain, difficulty swallowing, depression, constipation, a medicine that blunts taste, eating alone, or an illness that has not been found yet. It also speeds up frailty, because muscle goes before fat.</p>
        <p>Nutrition in older age is rarely solved by a supplement. It is solved by removing whatever makes eating hard, then protecting protein and regular meals in a way the household budget can sustain.</p>
        <p>Weigh the person at home, write the number down, and bring it along. A trend over three months tells a clinician more than any description of appetite.</p>
      </>
    ),
  },
  {
    slug: "discharge-is-not-the-end",
    date: "June 12, 2026",
    minutes: 6,
    title: "Discharge is not the end of the illness",
    topic: "Families and caregiving",
    excerpt: "The week after a hospital stay is when older patients are most vulnerable, and it is the part of care least likely to be planned properly.",
    photo: home.clinic,
    body: (
      <>
        <p>A hospital is organised around the acute problem. Once that is fixed the patient goes home to a body that has been deconditioned, a medicine chart that has changed, and a family who was not in the conversation.</p>
        <p>Delirium, falls and readmission cluster in this period. Much of it is preventable with a discharge that answers plain questions: what changed in the medicines, what is normal for the next week, what activity is allowed, and who to call when something is not.</p>
        <p>Rehabilitation is not only physiotherapy. It is getting the person back to the stairs, the bathroom, the kitchen and the street, roughly in that order, and it needs a start date.</p>
        <p>Ask for the revised medicine list in writing, and have one person who sees the whole picture check it. That single step prevents a large share of what goes wrong.</p>
      </>
    ),
  },
  {
    slug: "caregiver-exhaustion-is-a-clinical-sign",
    date: "May 22, 2026",
    minutes: 7,
    title: "Caregiver exhaustion is a clinical sign",
    topic: "Families and caregiving",
    excerpt: "When the person doing the caring has stopped sleeping, eating well or seeing anyone, that belongs in the record and not only in family conversation.",
    photo: home.caregiver,
    body: (
      <>
        <p>Most long-term care in Nepal is given at home by a family member, often a woman who has quietly stopped doing anything for herself. She is rarely treated as someone with her own health needs, and she is rarely asked how she is managing.</p>
        <p>Caregiver strain is not a soft outcome. It predicts worse care, earlier institutionalisation, and genuine illness in the caregiver. It is also one of the few things a clinic can act on, by sharing tasks and teaching what to expect.</p>
        <p>Practical help beats sympathy. People need to know how to move someone safely, what to do on a bad night, when agitation is a medical problem rather than behaviour, and which parts of the routine can be handed to another relative or a community worker.</p>
        <p>If you are the one doing the caring, say so at the appointment. Bring your own questions, and let the plan include you.</p>
      </>
    ),
  },
  {
    slug: "frailty-is-a-description-not-a-verdict",
    date: "May 6, 2026",
    minutes: 6,
    title: "Frailty is a description, not a verdict",
    topic: "Research into practice",
    excerpt: "Frailty sounds final. In practice it is a measurable state on a spectrum, and one of the most useful things we can identify early.",
    photo: home.research,
    body: (
      <>
        <p>Frailty is often heard as a polite way of saying someone is declining and nothing can be done. That is not what it means clinically. It describes reduced reserve: less strength, slower walking, less tolerance for stress.</p>
        <p>It matters because it predicts. Two people of the same age with the same diagnosis will tolerate the same operation, the same infection or the same new medicine very differently, and frailty explains much of that difference.</p>
        <p>Measuring it is not complicated. Questions about exhaustion, weight loss, activity and walking speed, with a timed walk or a grip test, identify most people who need a different kind of plan. That is why frailty sits at the centre of WHO’s ICOPE approach and of the work I have done in Nepal.</p>
        <p>Frailty can improve. Strength, nutrition, medicines and the home are all levers. What it must not do is decide in advance what a person is allowed to hope for.</p>
      </>
    ),
  },
  {
    slug: "what-happens-after-the-health-camp",
    date: "April 15, 2026",
    minutes: 7,
    title: "What happens after the health camp",
    topic: "Research into practice",
    excerpt: "Screening days reach many people in a week. Whether any of them get better depends on what was built for the day after.",
    photo: home.checkup,
    body: (
      <>
        <p>Community screening camps do something valuable: they reach people who would not otherwise come. They also produce a list of names with findings that need follow-up, and the follow-up is where programmes usually stop.</p>
        <p>A blood pressure taken once at a camp is not a diagnosis. An X-ray nobody has read, or a referral with no transport and no money attached, is not care. The gap between the two is a service design problem rather than a medical one.</p>
        <p>My work on ICOPE has been preoccupied with exactly this gap: which steps a trained community health worker can own, who supervises them, where the referral actually leads, and how a plan is written so a person can act on it.</p>
        <p>If a camp result has been sitting in a folder, bring it. An interpretation and a next step are worth more than another test.</p>
      </>
    ),
  },
  {
    slug: "what-a-geriatric-assessment-involves",
    date: "March 28, 2026",
    minutes: 8,
    title: "What a geriatric assessment actually involves",
    topic: "Education and leadership",
    excerpt: "It is mostly conversation. That surprises families, and it is also why the visit can change care when scans have not.",
    photo: home.teaching,
    body: (
      <>
        <p>A comprehensive geriatric assessment is not a battery of machines. It is a structured way of looking at an older person who has several problems at once: function, cognition, mood, nutrition, continence, balance, medicines, and the social world around them.</p>
        <p>It begins with what the person can do and what they want to keep doing. Then it searches for reversible contributors, and for the things that have accumulated because no single department owned them.</p>
        <p>The output is a written plan with priorities, usually a small number of changes rather than a long list, with names attached to who does what. Families tend to remember the sentence that explained the situation more than any test result.</p>
        <p>Not everyone needs one. It is for the person whose problems do not fit inside a single specialty.</p>
      </>
    ),
  },
];

const footer = (
  <DoctorFooter
    name="Professor Ramesh Kandel"
    note="The views on this website are my own unless otherwise stated. Educational content is for general information and does not replace an individual clinical assessment."
    links={ allLinks }
    email={ EMAIL }
    phone={ PHONE }
    cvHref={ cvUrl }
    copyright="© 2026 Professor Ramesh Kandel. All rights reserved."
  />
);

export const site: SiteContent = {
  name: "site",
  title: "Professor Ramesh Kandel, Geriatric Medicine in Nepal",
  pack: hazelHouse,
  layout: "margin",
  header: {
    name: "Dr. Ramesh Kandel.",
    role: "Geriatrician · Nepal",
    strip: "Personalised geriatric care. Clear answers. A plan for you.",
    place: "Kathmandu, Nepal",
    links: nav,
    phone: { label: "Call", href: PHONE_HREF },
    cta: { label: "Book an appointment", href: "/contact" }
  },
  footer,
  hero: (
    <DoctorHero
      eyebrow=""
      title="Geriatric care in Nepal. Clear answers. Less uncertainty."
      lede="Understand your health with a doctor who listens, explains your options and helps you take the next step with confidence."
      primary={ { label: "Book a consultation", href: "/contact" } }
      secondary={ { label: "Explore geriatric care", href: "/about" } }
      ticks={ [ "Time for your questions", "Clear treatment advice" ] }
      photo={ home.portrait }
      bandTitle="Good care starts with trust and understanding"
      bandItems={ [
        { icon: HeartHandshake, label: "Care based on your needs" },
        { icon: Stethoscope, label: "Advice you can understand" },
        { icon: HeartPulse, label: "Support beyond your first visit" },
        { icon: GraduationCap, label: "Professionals prepared for ageing" },
      ] }
    />
  ),
  after: (
    <>
      <NamasteIntro
        eyebrow="Namaste, I'm Professor Kandel"
        title="Care that listens first."
        body={
          <p>
            After more than a decade in geriatric medicine in Nepal, I have sat with farmers, grandparents, teachers and their families as several small problems stacked into a life that suddenly felt unsafe. A fall, a new tablet, poor sleep, a change in memory. Each of them deserves the same thing: time, an honest explanation, and a plan written in words they understand.
          </p>
        }
        name="Professor Ramesh Kandel"
        credentials="MD (Geriatric Medicine, AIIMS New Delhi) · MBBS (BPKIHS) · Professor, Rapti Academy of Health Sciences"
        marks={ [ "RAHS", "WHO-SEARO", "HAMS", "Patan Academy", "NIAH" ] }
      />
      <CinematicWork
        kicker="My areas of work"
        title="Most of us reach a doctor only when it is already serious."
        caption="Community health camp, Lumbini Province"
        photo={ home.checkup }
        areas={ [
          {
            id: "geriatrics",
            title: "Geriatric medicine",
            text: "Person-centred care for older adults living with frailty, several health conditions and complex needs. It looks beyond a single diagnosis to daily life.",
            href: "/about",
          },
          {
            id: "research",
            title: "Research and innovation",
            text: "Practical studies on frailty, multimorbidity, integrated care and how services are organised in resource-constrained settings.",
            href: "/research",
          },
          {
            id: "teaching",
            title: "Medical education",
            text: "Preparing health professionals to deliver compassionate, evidence-informed care and helping institutions strengthen programmes and clinical governance.",
            href: "/teaching",
          },
          {
            id: "systems",
            title: "Healthy ageing and health systems",
            text: "Work with hospitals, primary care, communities and families, including the WHO-supported Integrated Care for Older People (ICOPE) programme in Nepal.",
            href: "/research",
          },
        ] }
      />
      <CareJourney
        kicker="The process"
        title="Your health journey"
        lede="Good geriatric care is a sequence, not a single visit. These are the steps I keep joined up in clinic, in teaching and in national programmes."
        steps={ [
          { id: "listen", title: "Understand the person", text: "Health, daily activities, relationships and what matters most, before any test or tablet.", icon: Users, tone: "black" },
          { id: "assess", title: "Screen and assess", text: "Frailty, falls, memory, medicines and nutrition, using tools that can work in Nepal.", icon: Stethoscope, tone: "yellow" },
          { id: "plan", title: "Plan together", text: "A written plan families can follow, with benefits and burdens spoken aloud.", icon: ClipboardList, tone: "red" },
          { id: "family", title: "Support families", text: "Caregivers are partners. They need skills, information and care for themselves too.", icon: HeartHandshake, tone: "yellow" },
          { id: "follow", title: "Keep care going", text: "Referral, rehabilitation and follow-up so a screening result does not become a dead end.", icon: Activity, tone: "red" },
        ] }
      />
      <WhyItMatters
        kicker="Why this work matters"
        title="Ageing well is not a luxury."
        body={
          <>
            <p>In Nepal, several manageable problems can combine until an older person, and the family around them, is suddenly in crisis. A fall, a new medicine, poor nutrition or a change in memory may affect the whole household.</p>
            <p>Geriatric medicine offers a way to see those connections and to build care around dignity, function and the person’s own priorities. That work happens in clinic, in policy and in the classroom.</p>
          </>
        }
        items={ [
          { label: "Clinical care" },
          { label: "Teaching" },
          { label: "Health systems" },
        ] }
        quote="Growing up in Nepal and watching older family members taught me that dignity, support and the right care are not extras. They are the work."
        quoteName="Professor Ramesh Kandel"
        quotePlace="Rapti Academy of Health Sciences"
        quoteRole="Professor of Geriatric Medicine"
        quoteLink={ { label: "Read my journey", href: "/about" } }
        photo={ home.portrait }
      />
      <MediaGallery
        kicker="In the media"
        title="Talks and interviews"
        items={ mediaItems }
        allHref="/media"
      />
      <HomeBlogSection
        kicker="From the blog"
        title="Notes from the work"
        lede={ <p>Short pieces on ageing, care, families and the services in between.</p> }
        posts={ posts }
        allHref="/blog"
      />
      <HiwCta
        kicker="GET STARTED TODAY"
        title="Start to improve your"
        accent="Independence"
        action={ <HiwPill href="/contact" tone="blue">Book a consultation</HiwPill> }
        note="*Send an enquiry and I will reply with availability, directions and what to bring."
      >
        <p>It is important to find and treat the root cause of decline, not just the symptoms. Let us work together to reverse your risk of dependence, reduce your reliance on prescription drugs, and optimize your health. Your custom plan will include low-risk, high-value recommendations in the areas of diet, lifestyle, fitness, and medicines so that you can start to live your healthiest life.</p>
      </HiwCta>
      <DrFaq
        title={ <span>A few questions.<br />Clear answers.</span> }
        lede="It’s natural to have questions about your care. Here are a few things you might be wondering."
        link={ { label: "Have another question?", href: "/contact" } }
        items={ [
          { q: "When should I see a geriatrician?", a: <p>If you or a family member is 60 or older and managing several health problems, medicines or a change in memory, balance or daily function, a geriatric assessment can help. You do not need a referral to enquire.</p> },
          { q: "What should I bring to my first appointment?", a: <p>Bring all your current medicines (or a list with doses), any recent test results, and a family member or caregiver if possible. A short note of your main concerns helps too.</p> },
          { q: "Will I need tests at my first visit?", a: <p>A comprehensive geriatric assessment focuses mainly on talking and listening. Further tests are arranged only if they will change your care, and we explain why before ordering them.</p> },
          { q: "Can I come for a second opinion?", a: <p>Yes. Second opinions are a normal and welcome part of good medical care. Please bring any previous reports or letters so we can review the full picture together.</p> },
          { q: "Where is the clinic, and how do I book?", a: <p>Current clinical sessions are at Rapti Academy of Health Sciences, Dang. Use the contact page to send an enquiry and we will confirm availability and directions.</p> },
          { q: "What if I have concerns about a parent’s memory?", a: <p>Memory changes can have many causes. A careful assessment including a medication review is the right first step. Please book an appointment so we can take a proper history.</p> },
        ] }
      />
      <ClosingCta
        kicker="Let’s work together"
        title="I welcome serious collaboration."
        lede="Research, teaching, speaking and programmes that improve care for older people. Tell me who you are, what you need, and when."
        primary={ { label: "Get in touch", href: "/contact" } }
        secondary={ { label: "Download my CV", href: cvUrl } }
      />
    </>
  ),
  pages: {
    about: {
      title: "About",
      content: (
        <>
          <FullBleedHero
            kicker="About"
            title="Professor Ramesh Kandel."
            lede={ <p>A physician specialising in geriatric medicine, working across clinical practice, research, medical education and institutional leadership in Nepal.</p> }
            photo={ home.portrait }
          />
          <LeadQuestions
            kicker="Stop the guesswork and finally get answers"
            title="Have you ever asked yourself"
            questions={ [
              <>Is this <strong>normal ageing</strong>, or is something actually wrong?</>,
              <>Are all of these <strong>medicines</strong> still needed, and for how long?</>,
              <>What do we do after a <strong>fall</strong>, before the next one happens?</>,
              <>Is this <strong>memory change</strong> treatable, or something the family simply accepts?</>,
              <>Who do we call when <strong>every specialist</strong> says something different?</>,
              <>What will the <strong>next ten years</strong> look like, honestly?</>,
            ] }
            cta={ { label: "See how the care works", href: "/how-it-works" } }
          />
          <StoryProse kicker="My story" photos={ [ home.portrait, home.checkup ] } signature="Ramesh Kandel">
            <p><strong>I am a physician specialising in geriatric medicine</strong>, working across clinical practice, research, medical education and institutional leadership in Nepal.</p>
            <p><strong>My training began at B.P. Koirala Institute of Health Sciences</strong> and continued in Geriatric Medicine at the All India Institute of Medical Sciences, New Delhi. That training shaped how I care for older adults: looking beyond individual diagnoses to understand how illness affects independence, wellbeing and everyday life.</p>
            <p><strong>My interest in older people’s health has personal roots.</strong> Growing up in Nepal and observing the experiences of older family members helped me recognise the importance of dignity, support and access to appropriate care.</p>
            <p><strong>Much of my work now builds the services around the person.</strong> At Rapti Academy of Health Sciences that has included academic leadership as Dean of the School of Medicine, hospital administration as Hospital Director and Medical Director, and the development of medicine and geriatric services. Before that I led geriatric services at the Hospital for Advanced Medicine and Surgery, taught at Patan Academy of Health Sciences, and worked as a consultant on healthy ageing at the WHO South-East Asia Regional Office in New Delhi.</p>
          </StoryProse>
          <StatementBand
            kicker="How I work"
            cta={ { label: "Book a consultation", href: "/contact" } }
            note="General information about my practice. It does not replace an individual clinical assessment."
          >
            <p>Several manageable problems can combine into a crisis: a fall, a new medicine, poor nutrition, a change in memory that reaches the whole family.</p>
            <p>Good care means careful listening, sound judgement and decisions made with the person rather than around them. The same principle guides my research and teaching: work that responds to real needs and can be delivered in local settings.</p>
          </StatementBand>
          <CredentialColumns
            columns={ [
              [
                {
                  title: "Training and appointments",
                  entries: [
                    { id: "md", label: "M.D. Geriatric Medicine, AIIMS, New Delhi", meta: "2012 – 2015" },
                    { id: "mbbs", label: "M.B.B.S., B.P. Koirala Institute of Health Sciences, Dharan", meta: "2005 – 2011" },
                    { id: "prof", label: "Professor of Geriatric Medicine, Rapti Academy of Health Sciences", meta: "Nov 2025 – present" },
                    { id: "dean", label: "Dean, School of Medicine, Rapti Academy of Health Sciences", meta: "Oct 2024 – May 2026" },
                    { id: "director", label: "Hospital Director and Medical Director, Rapti Academy of Health Sciences", meta: "2022 – 2024" },
                    { id: "hams", label: "Consultant and Chief of Geriatric Services, HAMS, Nepal", meta: "2020 – 2022" },
                    { id: "who", label: "Consultant, Healthy Ageing, WHO-SEARO, New Delhi", meta: "2019" },
                  ],
                },
              ],
              [
                {
                  title: "Where I see patients",
                  entries: [
                    { id: "place", label: "Rapti Academy of Health Sciences", meta: "Dang, Nepal" },
                    { id: "email", label: <TextLink href={ `mailto:${ EMAIL }` }>{ EMAIL }</TextLink>, meta: "Email" },
                    { id: "phone", label: <TextLink href={ PHONE_HREF }>{ PHONE }</TextLink>, meta: "Clinic enquiries" },
                    { id: "enquiry", label: <TextLink href="/contact">Send an enquiry</TextLink>, meta: "Availability and directions" },
                    { id: "cv", label: <a href={ cvUrl }>Curriculum vitae (PDF)</a>, meta: "Full list of roles and publications" },
                  ],
                },
                {
                  title: "Memberships and advisory work",
                  entries: [
                    { id: "niah", label: "National Institute on Ageing and Health (NIAH), Nepal", meta: "Founder President" },
                    { id: "consortium", label: "WHO Clinical Consortium on Healthy Ageing, Geneva", meta: "Member" },
                    { id: "strategy", label: "Nepal National Geriatric Strategy and Geriatric Service Standards", meta: "Principal consultant" },
                    { id: "standards", label: "Minimum Service Standards, Nepal", meta: "Subject expert" },
                  ],
                },
              ],
            ] }
          />
          <ClosingCta
            kicker="Get started today"
            title={ <>Bring the whole picture to <em>one</em> appointment.</> }
            lede="An assessment, a medicine review and a written plan the household can actually follow. Tell me who you are, what you need and when."
            primary={ { label: "Book a consultation", href: "/contact" } }
            secondary={ { label: "Read my research", href: "/research" } }
            note="For a first visit, bring every medicine currently in use and, if you can, a family member or caregiver who knows the daily routine."
          />
        </>
      )
    },
    research: {
      title: "Research",
      content: (
        <>
          <FullBleedHero
            kicker="Research"
            title="Grounded in clinical and community needs."
            lede={ <p>My research focuses on improving care for older adults and people living with chronic conditions. I look for approaches that are practical, affordable and responsive to patients, caregivers and health professionals in Nepal.</p> }
            photo={ home.research }
          />
          <LeadQuestions
            kicker="Questions that start in the clinic"
            title="What the work keeps asking"
            questions={ [
              <>How do <strong>several conditions together</strong> change independence, risk and what care should actually do?</>,
              <>Can <strong>community screening</strong> lead to assessment, a plan, referral and follow-up?</>,
              <>What supports people and families <strong>between visits</strong>, not only in hospital?</>,
              <>How do people carry the <strong>mental load</strong> of long-term disease, and what helps?</>,
              <>After a fall or a medicine change, which <strong>results matter</strong> to older people?</>,
              <>How does evidence become <strong>routine practice</strong>, and what does it cost?</>,
            ] }
            cta={ { label: "Discuss a collaboration", href: "/contact" } }
          />
          <StoryProse kicker="Programme work" photos={ [ home.research, home.clinic ] } signature="Ramesh Kandel">
            <p><strong>My research begins in the clinic and the community.</strong> It focuses on improving care for older adults and people living with chronic conditions, looking for approaches that are practical, affordable and responsive to patients, caregivers and health professionals in Nepal.</p>
            <p><strong>Integrated Care for Older People is a central thread.</strong> My work explores how the WHO ICOPE approach can be adapted to local services and communities: identifying implementation needs, supporting health-worker training and examining how screening can lead to assessment, care planning, referral and follow-up.</p>
            <p><strong>I served as programme coordinator and consultant</strong> for the WHO-supported project developing an ICOPE implementation model in Lumbini Province, and as a member of the WHO Clinical Consortium on Healthy Ageing in Geneva.</p>
            <p><strong>My clinical research interests include frailty, falls and other geriatric syndromes</strong>, alongside antimicrobial resistance in older patients. These areas reflect challenges encountered in routine practice and the need for evidence that can inform care in Nepal.</p>
          </StoryProse>
          <StatementBand
            kicker="How the work is used"
            cta={ { label: "Discuss a collaboration", href: "/contact" } }
            note="Research that stays on a shelf changes nothing. The test is whether a district health worker or a family at home can use it."
          >
            <p>Adapting WHO guidance to Nepali services, so screening becomes assessment, a plan and follow-up rather than a form.</p>
            <p>Studying frailty, geriatric syndromes and antimicrobial resistance where they actually occur, in routine practice and local settings.</p>
          </StatementBand>
          <CredentialColumns
            columns={ [
              [
                {
                  title: "Selected publications",
                  entries: [
                    { id: "amr-uro", label: <a href="https://scholar.google.com/citations?user=Us6Zr_YAAAAJ&hl=en&citation_for_view=Us6Zr_YAAAAJ:LkGwnXOMwfcC" target="_blank" rel="noreferrer">Frailty and antimicrobial resistance in uropathogens</a>, meta: "Journal of Indian Academy of Geriatrics, 2025" },
                    { id: "amr-rahs", label: <a href="https://scholar.google.com/citations?user=Us6Zr_YAAAAJ&hl=en&citation_for_view=Us6Zr_YAAAAJ:YsMSGLbcyi4C" target="_blank" rel="noreferrer">Antimicrobial resistance among older patients at RAHS</a>, meta: "Journal of Rapti Academy of Health Sciences, 2025" },
                    { id: "syndromes", label: <a href="https://doi.org/10.70027/jrahs29" target="_blank" rel="noreferrer">Geriatric syndromes in a tertiary Geri OPD, western Nepal</a>, meta: "Journal of Rapti Academy of Health Sciences, 2025" },
                    { id: "strategy", label: <a href="https://scholar.google.com/citations?user=Us6Zr_YAAAAJ&hl=en&citation_for_view=Us6Zr_YAAAAJ:u-x6o8ySG0sC" target="_blank" rel="noreferrer">Nepal’s Geriatric Health Strategy 2021–2030: a narrative review</a>, meta: "Journal of Indian Academy of Geriatrics, 2024" },
                    { id: "caregiver", label: <a href="https://scholar.google.com/citations?user=Us6Zr_YAAAAJ&hl=en&citation_for_view=Us6Zr_YAAAAJ:hqOjcs7Dif8C" target="_blank" rel="noreferrer">Caregiver burden in Alzheimer’s dementia in Nepal</a>, meta: "Journal of Indian Academy of Geriatrics, 2021" },
                    { id: "cancer", label: <a href="https://doi.org/10.1016/j.jgo.2020.04.013" target="_blank" rel="noreferrer">Care protocol for older adults with cancer in resource-limited settings</a>, meta: "Journal of Geriatric Oncology, 2021" },
                    { id: "walking", label: <a href="https://doi.org/10.1186/s12877-018-0890-4" target="_blank" rel="noreferrer">Nordic walking and nutrition in pre-frail older Indians</a>, meta: "BMC Geriatrics, 2018" },
                  ],
                },
              ],
              [
                {
                  title: "Research interests",
                  entries: [
                    { id: "frailty", label: "Frailty, function and multimorbidity", meta: "Independence, risk and what care should do" },
                    { id: "icope", label: "Integrated care and community healthy ageing", meta: "WHO ICOPE adapted to local services" },
                    { id: "chronic", label: "Chronic disease self-management", meta: "Support people can use between visits" },
                    { id: "mind", label: "Psychological wellbeing in chronic illness", meta: "The mental load of long-term disease" },
                    { id: "systems", label: "Health services and implementation", meta: "How evidence becomes routine practice" },
                  ],
                },
                {
                  title: "Where the work appears",
                  entries: [
                    { id: "jiag", label: "Journal of Indian Academy of Geriatrics", meta: "Peer reviewed" },
                    { id: "jrahs", label: "Journal of Rapti Academy of Health Sciences", meta: "Peer reviewed" },
                    { id: "jgo", label: "Journal of Geriatric Oncology", meta: "Peer reviewed" },
                    { id: "swasthya", label: <a href="https://swasthyakhabar.com/story/63850" target="_blank" rel="noreferrer">Swasthya Khabarpatrika</a>, meta: "Health feature article in Nepali" },
                    { id: "scholar", label: <a href="https://scholar.google.com/citations?user=Us6Zr_YAAAAJ&hl=en" target="_blank" rel="noreferrer">Google Scholar profile</a>, meta: "Full citation list" },
                    { id: "cv", label: <a href={ cvUrl }>Curriculum vitae (PDF)</a>, meta: "Including case reports" },
                  ],
                },
              ],
            ] }
          />
          <PublicationList groups={ publicationGroups } />
          <ClosingCta
            kicker="Collaboration"
            title="I welcome research partners."
            lede="Clinical ageing research, implementation studies, health services research and multidisciplinary projects that aim to improve care for older people."
            primary={ { label: "Discuss a collaboration", href: "/contact" } }
            secondary={ { label: "Google Scholar", href: "https://scholar.google.com/citations?user=Us6Zr_YAAAAJ&hl=en" } }
            note="The list above is compiled from Google Scholar, ORCID and the CV annexure."
          />
        </>
      )
    },
    "how-it-works": {
      title: "How it works",
      content: (
        <>
          <HiwHero
            title="Good care in older age is so much more than the absence of disease."
            lede={ <p>A comprehensive geriatric assessment and a written health plan to help you live longer in the home you love.</p> }
            action={ <HiwPill href="/contact">Book a consultation</HiwPill> }
            note="*Send an enquiry and I will reply with availability, directions and what to bring."
            photo={ home.portrait }
          />
          <HiwSplit
            kicker="Who I can help"
            title="Your health is not a destination, it’s a journey."
            photo={ hiw.cyclist }
            action={ <HiwPill href="/contact" tone="outline">Book a consultation</HiwPill> }
            note="*Send an enquiry and I will reply with availability, directions and what to bring."
          >
            <p>Although you may be currently struggling with an illness or symptoms, my focus is on restoring function and independence rather than just treating disease. This approach may be different from what you are used to, but it is far superior for improving your overall quality of life and reducing your future risk of dependence.</p>
            <p>I only work with people who are ready to make changes and who I know I can help. If I do not think that I can help you I will refer you to someone or something that can.</p>
            <p>To determine if this type of consultation is a good fit for you, click the button below and send a short enquiry. I will be in touch shortly with details.</p>
          </HiwSplit>
          <HiwProcess
            kicker="The process"
            title="Your care journey"
            steps={ [
              { id: "enquire", label: "Send an enquiry", icon: Mail, color: "#1e60ce" },
              { id: "assess", label: "Comprehensive assessment", icon: Stethoscope, color: "#91dad1" },
              { id: "consult", label: "Family consultation", icon: Video, color: "#f01444" },
              { id: "plan", label: "Personalized written plan", icon: ClipboardList, color: "#f3bb0c" },
              { id: "track", label: "Track your progress", icon: TrendingUp, color: "#f87879" },
            ] }
          />
          <HiwSplit
            kicker="The first appointment"
            title="Build your health story and gain clarity about the years ahead."
            photo={ hiw.laptop }
            checks={ [
              "Medical history",
              "Current medicines",
              "Daily function",
              "Diet and appetite",
              "Lifestyle choices",
              "Fitness and balance",
            ] }
          >
            <p>Before the first appointment, write the story in your own words: the medical history, the current challenges, and the goals that matter most to you and your family.</p>
          </HiwSplit>
          <HiwAssess
            kicker="The assessment"
            title="What a comprehensive assessment includes:"
            rows={ [
              {
                id: "mind",
                icon: Brain,
                color: "#f01444",
                left: { title: "Memory and thinking", text: "A simple bedside screening of recall, attention and language, explained as we go." },
                right: { title: "Mood and motivation", text: "A screening for low mood, anxiety, apathy and the losses that accompany them." },
              },
              {
                id: "move",
                icon: Footprints,
                color: "#f3bb0c",
                left: { title: "Function and gait", text: "How you rise, walk, turn and sit, observed and timed at your own pace." },
                right: { title: "Falls and balance", text: "A determination of your level of fall risk and the confidence lost after a fall." },
              },
              {
                id: "meds",
                icon: Pill,
                color: "#f87879",
                left: { title: "Medicines and prescriptions", text: "Every tablet, injection and remedy matched against its purpose, benefit and burden." },
                right: { title: "Nutrition and weight", text: "An assessment of appetite, weight, meals and the risk of deficiency." },
              },
              {
                id: "senses",
                icon: Eye,
                color: "#91dad1",
                left: { title: "Vision and hearing", text: "A screening of the senses that quietly withdraw people from conversation and street life." },
                right: { title: "Sleep and continence", text: "A review of nights, daytime tiredness and the problems people rarely volunteer." },
              },
              {
                id: "body",
                icon: HeartPulse,
                color: "#1e60ce",
                left: { title: "Heart, lungs and circulation", text: "An examination of rate, rhythm, breath and the feet, with referral where needed." },
                right: { title: "Bones, joints and strength", text: "A determination of arthritis, osteoporosis risk and the strength needed for daily life." },
              },
            ] }
          />
          <HiwConsult
            kicker="The consultation"
            title="One conversation, the whole picture."
            icon={ Home }
            photo={ home.portrait }
            cardTitle="Focused time"
            cardText="The first appointment is a full hour of focused time. I listen for the hidden details and ask the questions that reveal so much more than I can observe."
            cardName="Ramesh Kandel"
            cardMeta="Professor of Geriatric Medicine"
          >
            <p>During the first consultation we meet for a full hour, in person or by video, to prioritize your goals, review your history and medicines, determine the underlying causes of your complaints, and create a custom written plan.</p>
          </HiwConsult>
          <HiwPlan
            kicker="The written plan"
            title="A personalized written plan designed to protect your independence"
            action={ <HiwPill href="/contact" tone="teal">View Here</HiwPill> }
          >
            <p>Your custom plan will help to reduce your future risk of dependence, as well as the need for extra medicines and hospital visits.</p>
            <p>Click below to see the areas that make up your complete plan.</p>
          </HiwPlan>
          <HiwBenefits
            items={ [
              { id: "convenient", icon: MousePointerClick, title: "Convenient", paragraphs: [ "One appointment, one room, with the family present where possible, in person or by video.", "Get all your important health questions answered without the usual barriers." ] },
              { id: "time", icon: AlarmClock, title: "Time saving", paragraphs: [ "There is no need to spend precious days moving from desk to desk to get a single answer.", "The assessment, the review and the plan happen in one unhurried visit." ] },
              { id: "answers", icon: Lightbulb, title: "Get answers", paragraphs: [ "Make more informed decisions about diet, fitness, and medicines based on your own health data.", "Understand the steps that are needed to achieve your health goals." ] },
            ] }
          />
          <HiwTrack
            kicker="Track your progress"
            title="Track your health progress over time."
            media={
              <HiwChart
                name="Mobility"
                metric="Timed Up and Go"
                unit="seconds"
                domain={ [ 30, 8 ] }
                bands={ [
                  { label: "High risk", range: ">20", color: "#f01444", from: 30, to: 20 },
                  { label: "Moderate", range: "13–20", color: "#f3bb0c", from: 20, to: 13 },
                  { label: "Optimal", range: "<13", color: "#91dad1", from: 13, to: 8 },
                ] }
                points={ [
                  { month: "May", year: "2026", value: 24, color: "#f01444" },
                  { month: "Jul", year: "2026", value: 17, color: "#f3bb0c" },
                  { month: "Nov", year: "2026", value: 12, color: "#91dad1" },
                ] }
              />
            }
          >
            <p>From a <strong>structured review of function, mood, medicines and falls</strong> we will determine if the plan is working, if your exercise is adequate, and if every medicine is still worth its burden. In addition, monitoring these trends year after year helps us to determine if your health is declining, maintaining, or improving.</p>
          </HiwTrack>
          <HiwFaq
            title="Frequently asked questions"
            items={ [
              { q: "What happens after I send an enquiry?", a: <p>I reply with availability, directions and a short list of what to bring. If the situation is urgent, say so and I will advise on the fastest route to care.</p> },
              { q: "Where do I meet you?", a: <p>Current clinical sessions are at Rapti Academy of Health Sciences, Dang. The contact page has the enquiry form and directions.</p> },
              { q: "Should a family member come along?", a: <p>Yes, where possible. A relative or caregiver who knows the daily routine adds half the history, and leaves understanding the plan.</p> },
              { q: "What should I bring?", a: <p>Every medicine currently in use, including injections and remedies, plus recent test results and a short note of your main concerns.</p> },
              { q: "Will this replace my usual doctor?", a: <p>No. Geriatric assessment complements your existing care. With your consent, the written plan is shared with your usual doctor.</p> },
              { q: "Can you review medicines prescribed by others?", a: <p>Yes. Medicine review is a core part of the assessment. Any change is discussed with you and communicated to the prescriber rather than made silently.</p> },
              { q: "What happens after the first appointment?", a: <p>You leave with the written plan. Follow-up is arranged to review progress, and referral or rehabilitation is set in motion where needed.</p> },
              { q: "What if you cannot help?", a: <p>I will say so plainly and point you to someone or something that can. That answer is part of the service.</p> },
            ] }
          />
          <HiwCta
            kicker="GET STARTED TODAY"
            title="Start to improve your"
            accent="Independence"
            action={ <HiwPill href="/contact" tone="blue">Book a consultation</HiwPill> }
            note="*Send an enquiry and I will reply with availability, directions and what to bring."
          >
            <p>It is important to find and treat the root cause of decline, not just the symptoms. Let us work together to reverse your risk of dependence, reduce your reliance on prescription drugs, and optimize your health. Your custom plan will include low-risk, high-value recommendations in the areas of diet, lifestyle, fitness, and medicines so that you can start to live your healthiest life.</p>
          </HiwCta>
        </>
      )
    },
    teaching: {
      title: "Teaching",
      content: (
        <>
          <HiwHero
            title="Teaching is how good care outlives one clinician."
            lede={ <p>Lectures, bedside teaching, skills workshops and curriculum work that prepare health professionals for an ageing population.</p> }
            action={ <HiwPill href="/contact">Enquire about teaching</HiwPill> }
            note="*Send an enquiry and I will reply with availability, formats and a suggested outline."
            photo={ home.teaching }
          />
          <HiwSplit
            kicker="Why teach geriatrics"
            title="Lessons that travel across healthcare."
            photo={ hiw.cyclist }
            action={ <HiwPill href="/media" tone="outline">See recorded talks</HiwPill> }
          >
            <p>Geriatric medicine offers lessons every specialty needs: understanding several conditions at once, reviewing medicines thoughtfully, assessing function, and making decisions together with patients and families.</p>
            <p>I teach the way I practise. A session starts with the person in front of us and ends with something the learner can repeat on their own ward.</p>
            <p>Colleges, hospitals, professional bodies and community programmes are all welcome to ask for a session built around their own cases.</p>
          </HiwSplit>
          <HiwProcess
            kicker="How I teach"
            title="Ways of working with learners"
            steps={ [
              { id: "lecture", label: "Guest lecture", icon: Presentation, color: "#1e60ce" },
              { id: "ward", label: "Bedside and ward round teaching", icon: Stethoscope, color: "#91dad1" },
              { id: "workshop", label: "Skills workshop", icon: Users, color: "#f01444" },
              { id: "curriculum", label: "Curriculum and assessment design", icon: BookOpen, color: "#f3bb0c" },
              { id: "faculty", label: "Faculty development", icon: GraduationCap, color: "#f87879" },
            ] }
          />
          <HiwAssess
            kicker="What I teach"
            title="Topics I bring to a classroom or a clinic"
            rows={ [
              {
                id: "assessment",
                icon: Stethoscope,
                color: "#91dad1",
                left: { title: "Comprehensive geriatric assessment", text: "A structured way to see the whole person, not a single organ." },
                right: { title: "Frailty and multimorbidity", text: "When several conditions travel together, plans have to change." },
              },
              {
                id: "syndromes",
                icon: Footprints,
                color: "#f3bb0c",
                left: { title: "Falls, cognition and other syndromes", text: "The presentations that do not fit neatly on a referral form." },
                right: { title: "Person-centred clinical decisions", text: "Goals, burdens and what the person actually wants from treatment." },
              },
              {
                id: "practice",
                icon: HeartHandshake,
                color: "#f01444",
                left: { title: "Chronic disease self-management", text: "Skills people use on the days they are not in clinic." },
                right: { title: "Research methods and appraisal", text: "Clear questions, honest methods and evidence that can be used." },
              },
            ] }
          />
          <HiwConsult
            kicker="Academic leadership"
            title="Institutions that teach well."
            icon={ Building2 }
            photo={ home.portrait }
            cardTitle="Mentoring"
            cardText="I support students and early-career health professionals as they build clinical, teaching and research skills, with honest feedback and room to ask a second question."
            cardName="Ramesh Kandel"
            cardMeta="Professor of Geriatric Medicine"
          >
            <p>My experience includes academic and hospital leadership at Rapti Academy of Health Sciences, alongside work in curriculum development and educational quality improvement.</p>
            <p>I am interested in programmes that connect classroom learning with clinical and community needs, prepare graduates for local practice and support continuous improvement.</p>
          </HiwConsult>
          <HiwBenefits
            items={ [
              { id: "students", icon: GraduationCap, title: "For students", paragraphs: [ "Medical and nursing students, interns and residents get a framework for the older patient that a single-organ syllabus rarely provides.", "Every session starts with a real case and ends with an assessment anyone can repeat." ] },
              { id: "professionals", icon: Users, title: "For professionals", paragraphs: [ "General practitioners, medical officers and specialists refresh the prescribing and referral habits that matter most in later life.", "Workshops are built around the cases your team actually saw last month." ] },
              { id: "institutions", icon: Building2, title: "For institutions", paragraphs: [ "Curriculum design, assessment tools and faculty development, worked through with the teachers who will have to run them.", "Quality improvement projects that connect teaching to the community the college serves." ] },
            ] }
          />
          <HiwFaq
            title="Questions from organisers"
            items={ [
              { q: "What formats do you teach?", a: <p>Guest lectures, half and full-day workshops, bedside and ward-round teaching, faculty sessions, and curriculum or assessment design work.</p> },
              { q: "Who benefits most?", a: <p>Medical and nursing students, interns, general practitioners, specialists, allied health teams and the families who care for older people at home.</p> },
              { q: "In which language?", a: <p>English for academic and professional sessions, Nepali for community and caregiver programmes, and a mix of both in the classroom when it helps the discussion.</p> },
              { q: "Can you design a whole module?", a: <p>Yes. I prefer to build modules with the faculty who will teach them, so the content, the assessment and the staff development arrive together.</p> },
              { q: "Do you still see patients?", a: <p>Clinical sessions at Rapti Academy of Health Sciences continue alongside teaching, so the examples come from current practice rather than old notes.</p> },
              { q: "How much notice do you need?", a: <p>Four to six weeks is comfortable for a workshop or a series of lectures. A single class can often be arranged sooner.</p> },
            ] }
          />
          <HiwCta
            kicker="INVITATIONS"
            title="Teaching, training and"
            accent="professional discussion"
            action={ <>
              <HiwPill href="/contact">Enquire about teaching</HiwPill>
              <HiwPill href={ cvUrl } tone="outline">Download my CV</HiwPill>
            </> }
            note="*Send an enquiry and I will reply with availability, formats and a suggested outline."
          >
            <p>Invitations on geriatric medicine, healthy ageing, integrated care and medical education are welcome from colleges, hospitals, professional bodies and community programmes.</p>
          </HiwCta>
        </>
      )
    },
    media: {
      title: "Media",
      content: (
        <>
          <FullBleedHero
            kicker="Media"
            title="Interviews, speeches and talks."
            lede={ <p>Television interviews, recorded talks and community conversations about ageing, Alzheimer’s disease, geriatric care and healthy ageing in Nepal.</p> }
            photo={ home.teaching }
          />
          <MediaGallery
            kicker="Watch"
            title="All videos"
            items={ allVideos }
          />
          <PressSection
            kicker="In the press"
            title="Written for a wider audience."
            lede="Longer pieces for Nepali readers, turning clinical evidence into advice families can act on."
            items={ [
              {
                href: "https://swasthyakhabar.com/story/63850",
                photo: home.press,
                topic: "Feature article",
                title: "डिमेन्सिया रोक्न सकिन्छ? स्मरणशक्ति कमजोर हुनुअघि नै मस्तिष्कलाई जोगाऔँ",
                source: "Swasthya Khabarpatrika",
                blurb: "A Nepali-language article on what lowers dementia risk: lifelong behaviour, everyday health decisions and social policy that protect brain health before memory weakens.",
              },
            ] }
          />
          <ClosingCta
            kicker="Invitations"
            title="Speaking and media requests."
            lede="Available for interviews, lectures, workshops and community talks on geriatric medicine, healthy ageing and integrated care."
            primary={ { label: "Enquire about speaking", href: "/contact" } }
            secondary={ { label: "Download my CV", href: cvUrl } }
          />
        </>
      )
    },
    blog: {
      title: "Blog",
      content: (
        <PostList
          posts={ posts }
          author="Professor Ramesh Kandel"
          avatar={ home.portrait }
        />
      )
    },
    contact: {
      title: "Contact",
      content: (
        <ContactDetails
          title="Let’s connect"
          media={ <Img photo={ home.portrait } /> }
          rows={ [
            { id: "enquiry", label: "Professional enquiry", content: <>
              <p id="enquiry" className="scroll-mt-[calc(var(--site-header-height)_+_5.5rem)]">I welcome professional enquiries about research collaboration, teaching, speaking and initiatives that improve care for older people. Please include a brief description of your enquiry, your organisation and any relevant timeline.</p>
              <ContactDetailsForm
                subject="Professional enquiry"
                inquiryType="Collaboration"
                submitLabel="Send enquiry"
                fields={ [
                  { id: "name", kind: "text", label: "Your name", required: true, half: true },
                  { id: "email", kind: "email", label: "Your email", required: true, half: true },
                  { id: "organisation", kind: "text", label: "Organisation" },
                  { id: "topic", kind: "choice", label: "Nature of enquiry", required: true, options: [ "Research collaboration", "Teaching and speaking", "Programme and policy work", "Other" ] },
                  { id: "timeline", kind: "text", label: "Timeline, if any" },
                  { id: "concerns", kind: "textarea", label: "Please briefly list your top 3 most important health concerns or goals", required: true },
                  { id: "aim", kind: "textarea", label: "What are you hoping to achieve from a consultation with me?", required: true },
                  { id: "message", kind: "textarea", label: "Your message", required: true },
                ] }
              />
            </> },
            { id: "work", label: "What I can help with", content: <>
              <p>Research collaboration on frailty, healthy ageing, multimorbidity, integrated care, chronic disease self-management and health services research.</p>
              <p>Teaching and speaking: academic lectures, professional training, workshops and conference contributions.</p>
              <p>Programme and policy work: healthy-ageing services, workforce development and community-based approaches to care.</p>
            </> },
            { id: "write", label: "Write or call", content: <>
              <TextLink href={ `mailto:${ EMAIL }` }>{ EMAIL }</TextLink>
              <TextLink href={ PHONE_HREF }>{ PHONE }</TextLink>
              <p>Professor of Geriatric Medicine, Rapti Academy of Health Sciences, Nepal.</p>
              <TextLink href="https://orcid.org/0000-0002-7827-1471">ORCID</TextLink>
              <TextLink href="https://scholar.google.com/citations?user=Us6Zr_YAAAAJ&hl=en">Google Scholar</TextLink>
            </> },
            { id: "clinic", label: "Clinical appointments", content: <>
              <p>For clinical appointments, please contact the relevant hospital or clinic directly. Please do not submit confidential medical information through this website.</p>
            </> }
          ] }
        />
      )
    }
  },
  items: {
    blog: ( slug ) => {
      const post = posts.find( p => p.slug === slug );
      if ( !post ) return undefined;
      return {
        title: post.title,
        content: (
          <>
            <FullBleedHero
              kicker={ post.topic }
              title={ post.title }
              lede={ <p>{ post.excerpt }</p> }
              photo={ post.photo }
            />
            <ProseSection ground="paper">{ post.body }</ProseSection>
            <ClosingCta
              kicker="Keep reading"
              title="Back to the writing."
              lede="More notes from clinic, classroom and community work."
              primary={ { label: "All articles", href: "/blog" } }
              secondary={ { label: "Get in touch", href: "/contact" } }
            />
          </>
        )
      };
    }
  }
};
