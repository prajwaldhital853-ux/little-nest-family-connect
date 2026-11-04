// The site's editorial content as plain data, so the same shape can be served by
// the CMS API and shipped in the bundle as the offline fallback. Strings only:
// renderers own the markup.
import type { PhotoKey } from "./media";

export interface SiteVideo {
  url: string;
  kind: string;
  title: string;
  source?: string;
}

export interface SitePost {
  slug: string;
  title: string;
  topic: string;
  excerpt: string;
  date?: string;
  minutes?: number;
  photo: PhotoKey;
  body: string[];
}

export type FaqGroup = "home" | "how-it-works" | "teaching";

export interface SiteFaq {
  group: FaqGroup;
  q: string;
  a: string;
}

export interface SitePress {
  href: string;
  topic: string;
  title: string;
  source: string;
  blurb: string;
  photo: PhotoKey;
}

export const videos: SiteVideo[] = [
  {
    url: "https://www.youtube.com/watch?v=l1H2YtG1vMw",
    kind: "Interview",
    title: "The truth about Alzheimer’s: myths and facts",
    source: "Kritika Dangi, Episode 02",
  },
  {
    url: "https://www.youtube.com/watch?v=IZrt-D8j3dk",
    kind: "Interview",
    title: "Geriatric problems in Nepal",
    source: "Health Television Nepal",
  },
  {
    url: "https://www.youtube.com/watch?v=rSY9I1-c5Ig",
    kind: "TV interview",
    title: "Health Station with Binisha Thapa",
    source: "Himalaya TV",
  },
  {
    url: "https://www.youtube.com/watch?v=BJ6bUJ0LhA8",
    kind: "Talk",
    title: "Climate change and older people in Nepal",
    source: "बाढीमा बगेको बुढ्यौली, recorded talk",
  },
  {
    url: "https://www.youtube.com/watch?v=gbIswWAYIAI",
    kind: "Interview",
    title: "के हो अल्जाइमर (बिर्सने) रोग? लक्षण र रोकथामका उपाय",
    source: "UkeraaTV, Medianp.com",
  },
  {
    url: "https://www.youtube.com/watch?v=Rf4jKLg2JKg",
    kind: "TV interview",
    title: "हाम्रो प्रश्न विज्ञको सुझाव: होम आइसोलेसन",
    source: "NTV Plus, 2078-03-15",
  },
  {
    url: "https://www.youtube.com/watch?v=cRIkwxFmhyQ",
    kind: "Interview",
    title: "जेष्ठ नागरिक रोग विशेषज्ञ: नसर्ने रोगबारे के भन्नुहुन्छ?",
    source: "Butwal Today Online TV",
  },
  {
    url: "https://www.youtube.com/watch?v=g_CN7jE4u8g",
    kind: "TV interview",
    title: "Swasthya Sarokar with Sobita Gautam",
    source: "Nepal Television, 2076-11-08",
  },
  {
    url: "https://www.youtube.com/watch?v=mLYJS-t37Sg",
    kind: "TV interview",
    title: "Swastha Sandesh with Tejendra K.C",
    source: "Buddha TV Butwal",
  },
];

export const press: SitePress[] = [
  {
    href: "https://swasthyakhabar.com/story/63850",
    topic: "Feature article",
    title: "डिमेन्सिया रोक्न सकिन्छ? स्मरणशक्ति कमजोर हुनुअघि नै मस्तिष्कलाई जोगाऔँ",
    source: "Swasthya Khabarpatrika",
    blurb: "A Nepali-language article on what lowers dementia risk: lifelong behaviour, everyday health decisions and social policy that protect brain health before memory weakens.",
    photo: "press",
  },
];

export const posts: SitePost[] = [
  {
    slug: "what-healthy-ageing-means",
    title: "What healthy ageing actually means",
    topic: "Ageing and everyday care",
    excerpt: "Healthy ageing is not the absence of disease. It is keeping people able to do the things they value for as long as possible.",
    date: "October 28, 2026",
    minutes: 6,
    photo: "ageingCouple",
    body: [ "Healthy ageing means supporting people to do the things they value as they grow older. It requires attention to physical and mental health, functional ability, social relationships and the environments in which people live.", "That definition matters because it changes what we measure. A clinic visit that only asks about symptoms can miss the person who can no longer open a jar, walk to the shop or sleep through the night. Those losses are the ones families describe as the real problem.", "In Nepal this work has to respond to diverse communities, changing family structures and wide differences in access to health and social care. A plan that depends on daily specialist visits, or on equipment that has to be imported, is not a plan at all for most households.", "So I start from function and priorities, then work backwards to what is available locally." ],
  },
  {
    slug: "screening-is-only-the-beginning",
    title: "Screening is only the beginning",
    topic: "Research into practice",
    excerpt: "Finding a problem is the easy half. What happens in the weeks after the result decides whether screening helped anyone.",
    date: "October 12, 2026",
    minutes: 7,
    photo: "checkup",
    body: [ "Identifying a health concern is only the beginning. Older people also need access to assessment, appropriate treatment, rehabilitation and continuing support.", "This is where well-intentioned programmes quietly fail. A screening camp produces a list of names, and the list becomes a report. Nobody is worse off than before, but nobody is much better off either.", "My work on the WHO ICOPE approach in Nepal has focused on connecting those steps: implementation planning, health-worker training, and understanding where the gaps between facilities and communities actually sit.", "The central question is practical. How can we ensure that an older person identified as needing support receives care that is accessible, coordinated and meaningful to them?" ],
  },
  {
    slug: "caregivers-are-partners",
    title: "Caregivers are partners, not extras",
    topic: "Families and caregiving",
    excerpt: "Most care for older people in Nepal is given by families at home. They need skills and support, not only instructions.",
    date: "September 26, 2026",
    minutes: 6,
    photo: "caregiver",
    body: [ "Families provide much of the care for older people in Nepal. Caregivers need information, practical skills and support for their own wellbeing.", "In clinical practice I have seen how several manageable problems can combine to make life difficult for an older person. A fall, a new medicine, poor nutrition or a change in memory may affect the whole family, and the family is usually asked to absorb that without being equipped for it.", "I am interested in approaches that recognise caregivers as partners in care while also acknowledging the pressures and responsibilities they carry. That means explaining what to watch for, what is expected, and when to come back.", "It also means asking the caregiver how they are doing. The answer changes the plan more often than people expect." ],
  },
  {
    slug: "what-geriatrics-teaches-every-clinician",
    title: "What geriatric medicine teaches every clinician",
    topic: "Education and leadership",
    excerpt: "Understanding multiple conditions together, reviewing medicines thoughtfully and deciding with patients are skills every specialty needs.",
    date: "September 8, 2026",
    minutes: 8,
    photo: "teaching",
    body: [ "Geriatric medicine offers valuable lessons across healthcare: understanding multiple conditions together, reviewing medicines thoughtfully, assessing function and making decisions with patients and families.", "Medical training is organised by organ system, which prepares people well for single-disease emergencies and less well for the 78-year-old with diabetes, knee pain, poor sleep and six medicines who arrives with her daughter.", "Teaching is a central part of my work. I aim to help learners combine clinical knowledge with careful observation, clear communication and respect for the person receiving care.", "Good care requires careful listening, sound clinical judgement and shared decisions. Treatment should consider a person’s goals, functional ability, family circumstances and the benefits and burdens of available options." ],
  },
  {
    slug: "a-fall-is-rarely-just-an-accident",
    title: "A fall is rarely just an accident",
    topic: "Ageing and everyday care",
    excerpt: "Older people who fall are usually told they were unlucky. Most of the time there is a reason, and finding it changes what happens next.",
    date: "August 21, 2026",
    minutes: 5,
    photo: "clinic",
    body: [ "When an older person falls, the first question is usually about the floor. Was it wet, was it dark, was the person in a hurry. Those things matter, but they are rarely the whole story.", "A fall can be the first visible sign of something else. A medicine that lowers blood pressure too far, an infection, eyes that have not been checked in years, or a body that has quietly lost strength and balance over a long season. When we call it bad luck we lose the chance to look.", "In practice I treat a fall as a clinical event. I ask how it happened, whether there was any loss of consciousness, what changed in the weeks before, and what the person was doing at the time. Then I look at medicines, vision, feet, footwear and the home itself.", "Not every fall can be prevented. Many can be, and the difference usually comes from a few patient questions rather than another scan." ],
  },
  {
    slug: "six-medicines-one-person",
    title: "Six medicines, one person",
    topic: "Ageing and everyday care",
    excerpt: "Each tablet may be reasonable on its own. The combination is a different prescription, and somebody has to look at it as a whole.",
    date: "August 3, 2026",
    minutes: 6,
    photo: "research",
    body: [ "A person can see four specialists and come home with four sets of instructions, each of which makes perfect sense on its own. Nobody has yet looked at those six medicines as a single regimen belonging to one body.", "Older adults process medicines differently. Kidney function declines, muscle mass shrinks, and the small side effect a younger person never notices can cause dizziness, confusion or a fall.", "A medication review is not a campaign to stop treatment. It asks what each medicine is still doing, whether the dose still fits the person, whether two of them are doing the same job, and what would happen if one was withdrawn with a plan and a follow-up date.", "Bring every medicine to the appointment, including what was bought over the counter and what a relative recommended. The full list is the starting point." ],
  },
  {
    slug: "memory-change-deserves-an-assessment",
    title: "Memory change deserves an assessment, not a label",
    topic: "Ageing and everyday care",
    excerpt: "Forgetfulness is not automatically dementia, and dementia is not a normal part of ageing. Both ideas cost families time they cannot get back.",
    date: "July 17, 2026",
    minutes: 5,
    photo: "ageingCouple",
    body: [ "Families often arrive having already decided. Either it is normal ageing and there is nothing to do, or it is dementia and there is nothing to do. Both conclusions are usually wrong, and both delay care.", "Some causes of memory trouble are reversible or at least treatable: depression, thyroid disease, poor sleep, vitamin deficiency, sedating medicines, alcohol. Others are progressive, and knowing early is what makes planning possible.", "A proper assessment takes time. It needs a history from someone who lives with the person as well as from the person, a look at daily function, mood and medicines, and simple cognitive testing. Blood tests and imaging answer specific questions rather than fill the file.", "The goal is not a name for what is happening. The goal is a plan the household can live with, and an honest answer about what comes next." ],
  },
  {
    slug: "eating-less-is-a-symptom",
    title: "Eating less in older age is a symptom",
    topic: "Ageing and everyday care",
    excerpt: "Weight loss and a poor appetite get filed under ageing. They are worth investigating, and sometimes they are the loudest clue in the room.",
    date: "June 29, 2026",
    minutes: 5,
    photo: "checkup",
    body: [ "A change in appetite is one of the first things a family notices and one of the easiest to dismiss. He is older now, he does not need as much food. That is not quite true, and the losses that follow are real.", "Unintentional weight loss can point to dental pain, difficulty swallowing, depression, constipation, a medicine that blunts taste, eating alone, or an illness that has not been found yet. It also speeds up frailty, because muscle goes before fat.", "Nutrition in older age is rarely solved by a supplement. It is solved by removing whatever makes eating hard, then protecting protein and regular meals in a way the household budget can sustain.", "Weigh the person at home, write the number down, and bring it along. A trend over three months tells a clinician more than any description of appetite." ],
  },
  {
    slug: "discharge-is-not-the-end",
    title: "Discharge is not the end of the illness",
    topic: "Families and caregiving",
    excerpt: "The week after a hospital stay is when older patients are most vulnerable, and it is the part of care least likely to be planned properly.",
    date: "June 12, 2026",
    minutes: 6,
    photo: "clinic",
    body: [ "A hospital is organised around the acute problem. Once that is fixed the patient goes home to a body that has been deconditioned, a medicine chart that has changed, and a family who was not in the conversation.", "Delirium, falls and readmission cluster in this period. Much of it is preventable with a discharge that answers plain questions: what changed in the medicines, what is normal for the next week, what activity is allowed, and who to call when something is not.", "Rehabilitation is not only physiotherapy. It is getting the person back to the stairs, the bathroom, the kitchen and the street, roughly in that order, and it needs a start date.", "Ask for the revised medicine list in writing, and have one person who sees the whole picture check it. That single step prevents a large share of what goes wrong." ],
  },
  {
    slug: "caregiver-exhaustion-is-a-clinical-sign",
    title: "Caregiver exhaustion is a clinical sign",
    topic: "Families and caregiving",
    excerpt: "When the person doing the caring has stopped sleeping, eating well or seeing anyone, that belongs in the record and not only in family conversation.",
    date: "May 22, 2026",
    minutes: 7,
    photo: "caregiver",
    body: [ "Most long-term care in Nepal is given at home by a family member, often a woman who has quietly stopped doing anything for herself. She is rarely treated as someone with her own health needs, and she is rarely asked how she is managing.", "Caregiver strain is not a soft outcome. It predicts worse care, earlier institutionalisation, and genuine illness in the caregiver. It is also one of the few things a clinic can act on, by sharing tasks and teaching what to expect.", "Practical help beats sympathy. People need to know how to move someone safely, what to do on a bad night, when agitation is a medical problem rather than behaviour, and which parts of the routine can be handed to another relative or a community worker.", "If you are the one doing the caring, say so at the appointment. Bring your own questions, and let the plan include you." ],
  },
  {
    slug: "frailty-is-a-description-not-a-verdict",
    title: "Frailty is a description, not a verdict",
    topic: "Research into practice",
    excerpt: "Frailty sounds final. In practice it is a measurable state on a spectrum, and one of the most useful things we can identify early.",
    date: "May 6, 2026",
    minutes: 6,
    photo: "research",
    body: [ "Frailty is often heard as a polite way of saying someone is declining and nothing can be done. That is not what it means clinically. It describes reduced reserve: less strength, slower walking, less tolerance for stress.", "It matters because it predicts. Two people of the same age with the same diagnosis will tolerate the same operation, the same infection or the same new medicine very differently, and frailty explains much of that difference.", "Measuring it is not complicated. Questions about exhaustion, weight loss, activity and walking speed, with a timed walk or a grip test, identify most people who need a different kind of plan. That is why frailty sits at the centre of WHO’s ICOPE approach and of the work I have done in Nepal.", "Frailty can improve. Strength, nutrition, medicines and the home are all levers. What it must not do is decide in advance what a person is allowed to hope for." ],
  },
  {
    slug: "what-happens-after-the-health-camp",
    title: "What happens after the health camp",
    topic: "Research into practice",
    excerpt: "Screening days reach many people in a week. Whether any of them get better depends on what was built for the day after.",
    date: "April 15, 2026",
    minutes: 7,
    photo: "checkup",
    body: [ "Community screening camps do something valuable: they reach people who would not otherwise come. They also produce a list of names with findings that need follow-up, and the follow-up is where programmes usually stop.", "A blood pressure taken once at a camp is not a diagnosis. An X-ray nobody has read, or a referral with no transport and no money attached, is not care. The gap between the two is a service design problem rather than a medical one.", "My work on ICOPE has been preoccupied with exactly this gap: which steps a trained community health worker can own, who supervises them, where the referral actually leads, and how a plan is written so a person can act on it.", "If a camp result has been sitting in a folder, bring it. An interpretation and a next step are worth more than another test." ],
  },
  {
    slug: "what-a-geriatric-assessment-involves",
    title: "What a geriatric assessment actually involves",
    topic: "Education and leadership",
    excerpt: "It is mostly conversation. That surprises families, and it is also why the visit can change care when scans have not.",
    date: "March 28, 2026",
    minutes: 8,
    photo: "teaching",
    body: [ "A comprehensive geriatric assessment is not a battery of machines. It is a structured way of looking at an older person who has several problems at once: function, cognition, mood, nutrition, continence, balance, medicines, and the social world around them.", "It begins with what the person can do and what they want to keep doing. Then it searches for reversible contributors, and for the things that have accumulated because no single department owned them.", "The output is a written plan with priorities, usually a small number of changes rather than a long list, with names attached to who does what. Families tend to remember the sentence that explained the situation more than any test result.", "Not everyone needs one. It is for the person whose problems do not fit inside a single specialty." ],
  },
];

export const faqs: SiteFaq[] = [
  {
    group: "home",
    q: "When should I see a geriatrician?",
    a: "If you or a family member is 60 or older and managing several health problems, medicines or a change in memory, balance or daily function, a geriatric assessment can help. You do not need a referral to enquire.",
  },
  {
    group: "home",
    q: "What should I bring to my first appointment?",
    a: "Bring all your current medicines (or a list with doses), any recent test results, and a family member or caregiver if possible. A short note of your main concerns helps too.",
  },
  {
    group: "home",
    q: "Will I need tests at my first visit?",
    a: "A comprehensive geriatric assessment focuses mainly on talking and listening. Further tests are arranged only if they will change your care, and we explain why before ordering them.",
  },
  {
    group: "home",
    q: "Can I come for a second opinion?",
    a: "Yes. Second opinions are a normal and welcome part of good medical care. Please bring any previous reports or letters so we can review the full picture together.",
  },
  {
    group: "home",
    q: "Where is the clinic, and how do I book?",
    a: "Current clinical sessions are at Rapti Academy of Health Sciences, Dang. Use the contact page to send an enquiry and we will confirm availability and directions.",
  },
  {
    group: "home",
    q: "What if I have concerns about a parent’s memory?",
    a: "Memory changes can have many causes. A careful assessment including a medication review is the right first step. Please book an appointment so we can take a proper history.",
  },
  {
    group: "how-it-works",
    q: "What happens after I send an enquiry?",
    a: "I reply with availability, directions and a short list of what to bring. If the situation is urgent, say so and I will advise on the fastest route to care.",
  },
  {
    group: "how-it-works",
    q: "Where do I meet you?",
    a: "Current clinical sessions are at Rapti Academy of Health Sciences, Dang. The contact page has the enquiry form and directions.",
  },
  {
    group: "how-it-works",
    q: "Should a family member come along?",
    a: "Yes, where possible. A relative or caregiver who knows the daily routine adds half the history, and leaves understanding the plan.",
  },
  {
    group: "how-it-works",
    q: "What should I bring?",
    a: "Every medicine currently in use, including injections and remedies, plus recent test results and a short note of your main concerns.",
  },
  {
    group: "how-it-works",
    q: "Will this replace my usual doctor?",
    a: "No. Geriatric assessment complements your existing care. With your consent, the written plan is shared with your usual doctor.",
  },
  {
    group: "how-it-works",
    q: "Can you review medicines prescribed by others?",
    a: "Yes. Medicine review is a core part of the assessment. Any change is discussed with you and communicated to the prescriber rather than made silently.",
  },
  {
    group: "how-it-works",
    q: "What happens after the first appointment?",
    a: "You leave with the written plan. Follow-up is arranged to review progress, and referral or rehabilitation is set in motion where needed.",
  },
  {
    group: "how-it-works",
    q: "What if you cannot help?",
    a: "I will say so plainly and point you to someone or something that can. That answer is part of the service.",
  },
  {
    group: "teaching",
    q: "What formats do you teach?",
    a: "Guest lectures, half and full-day workshops, bedside and ward-round teaching, faculty sessions, and curriculum or assessment design work.",
  },
  {
    group: "teaching",
    q: "Who benefits most?",
    a: "Medical and nursing students, interns, general practitioners, specialists, allied health teams and the families who care for older people at home.",
  },
  {
    group: "teaching",
    q: "In which language?",
    a: "English for academic and professional sessions, Nepali for community and caregiver programmes, and a mix of both in the classroom when it helps the discussion.",
  },
  {
    group: "teaching",
    q: "Can you design a whole module?",
    a: "Yes. I prefer to build modules with the faculty who will teach them, so the content, the assessment and the staff development arrive together.",
  },
  {
    group: "teaching",
    q: "Do you still see patients?",
    a: "Clinical sessions at Rapti Academy of Health Sciences continue alongside teaching, so the examples come from current practice rather than old notes.",
  },
  {
    group: "teaching",
    q: "How much notice do you need?",
    a: "Four to six weeks is comfortable for a workshop or a series of lectures. A single class can often be arranged sooner.",
  },
];

export const faqsIn = ( rows: SiteFaq[], group: FaqGroup ) =>
  rows.filter( item => item.group === group );
