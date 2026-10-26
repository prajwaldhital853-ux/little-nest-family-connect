import { TextLink } from "@/components/base/text-link";
import { ContactDetails } from "@/components/contact-details/contact-details";
import { ContactDetailsForm } from "@/components/contact-details/contact-details-form";
import { FactsBlock } from "@/components/facts-block/facts-block";
import { FaqGroups } from "@/components/faq-groups/faq-groups";
import { GrowthSteps } from "@/components/growth-steps/growth-steps";
import { ListSection } from "@/components/list-section/list-section";
import { PhotoPause } from "@/components/photo-pause/photo-pause";
import { PageIntro } from "@/components/page-intro/page-intro";
import { PillLink } from "@/components/pill-link/pill-link";
import { PosterHero } from "@/components/poster-hero/poster-hero";
import { QuoteRow } from "@/components/quote-row/quote-row";
import { RoomTabs } from "@/components/room-tabs/room-tabs";
import { SplitHero } from "@/components/split-hero/split-hero";
import { StepStory } from "@/components/step-story/step-story";
import { Decorated } from "@/components/sticker/sticker-layer";
import { StoryHighlight } from "@/components/story-highlight/story-highlight";
import { ValueColumns } from "@/components/value-columns/value-columns";
import { hazelHouse } from "@/style-packs/hazel-house";

import { ApplySection } from "./apply-section";
import { home } from "./media";
import { Img } from "./parts";
import { RoomPage } from "./room-page";
import type { SiteContent } from "./types";

const nestDay = [
  { id: "arrival", start: "07:30", end: "09:00", name: "Arrival", text: "Cuddles, a bottle and quiet play on the mat." },
  { id: "tummy", start: "09:00", end: "10:00", name: "Tummy time", text: "Songs, mirrors and soft toys to reach for." },
  { id: "naps", start: "10:00", end: "12:00", name: "Naps and feeds", text: "Each baby sleeps when they need to." },
  { id: "garden", start: "12:00", end: "14:00", name: "Garden time", text: "A blanket under the trees, or the porch when it rains." },
  { id: "rest", start: "14:00", end: "16:00", name: "Rest and play", text: "Rocking, books and slow play." },
  { id: "home", start: "16:00", end: "18:00", name: "Home time", text: "A last bottle and a hand-over with the day's notes." }
];

const burrowDay = [
  { id: "arrival", start: "07:30", end: "09:00", name: "Arrival and free play", text: "A warm welcome, blocks and friends." },
  { id: "snack", start: "09:00", end: "09:30", name: "Morning snack", text: "Practising cups, spoons and passing the bowl." },
  { id: "circle", start: "09:30", end: "10:15", name: "Circle time", text: "Songs, stories and new words." },
  { id: "play", start: "10:15", end: "11:15", name: "Play and make", text: "Paint, sand, blocks and pretend." },
  { id: "lunch", start: "11:15", end: "11:45", name: "Lunch", text: "Eating together at little tables." },
  { id: "nap", start: "11:45", end: "14:30", name: "Nap", text: "Quiet time to rest and recharge." },
  { id: "garden", start: "14:30", end: "16:30", name: "Garden and music", text: "The mud kitchen, the sandpit and songs with Sam." },
  { id: "home", start: "16:30", end: "18:00", name: "Free play and home time", text: "Winding down and a word with your teacher." }
];

const groveDay = [
  { id: "arrival", start: "07:30", end: "09:00", name: "Arrival and free play", text: "Friends, puzzles and the drawing table." },
  { id: "circle", start: "09:00", end: "09:30", name: "Morning circle", text: "The day's plan, a song and a question." },
  { id: "project", start: "09:30", end: "11:30", name: "Project time", text: "Building, painting and early letters and numbers." },
  { id: "lunch", start: "11:30", end: "12:15", name: "Lunch", text: "Setting the table and serving ourselves." },
  { id: "rest", start: "12:15", end: "13:30", name: "Rest", text: "Quiet books, or a nap for those who need one." },
  { id: "garden", start: "13:30", end: "15:30", name: "Garden and music", text: "Planting, digging and songs with Sam." },
  { id: "home", start: "15:30", end: "18:00", name: "Free play and home time", text: "Stories, games and a word with your teacher." }
];

export const site: SiteContent = {
  name: "site",
  title: "Hazel House",
  pack: hazelHouse,
  layout: "margin",
  header: {
    name: "Hazel House",
    home: "/",
    start: [
      { label: "Infant", href: "/infant" },
      { label: "Toddler", href: "/toddler" },
      { label: "Preschool", href: "/preschool" },
      { label: "About", href: "/about" }
    ],
    end: [
      { label: "Enroll", href: "/enroll" },
      { label: "Contact", href: "/contact" }
    ]
  },
  footer: {
    contact: {
      label: "Come and visit",
      text: "Tours every weekday at 9:30",
      action: <TextLink href="/contact#tour">Book a tour</TextLink>
    },
    address: {
      label: "Hazel House / Portland",
      lines: [ "Hazel House Preschool", "2140 SE Division Street", "Portland, OR 97202", "Monday to Friday, 7:30 am to 6:00 pm" ],
      action: <TextLink href="tel:+15035550142">(503) 555-0142</TextLink>
    },
    photos: [
      <Img key="rainbow" photo={ home.footRainbow } />,
      <Img key="rainbows" photo={ home.footRainbows } />,
      <Img key="crayons" photo={ home.footCrayons } />
    ],
    social: <>
      <TextLink href="https://twitter.com/Lovable">X</TextLink>
      <TextLink href="https://discord.com/invite/lovable-dev">Discord</TextLink>
      <TextLink href="https://reddit.com/r/lovable">Reddit</TextLink>
      <TextLink href="https://www.youtube.com/@lovable">YouTube</TextLink>
      <TextLink href="https://www.linkedin.com/company/lovable-dev/">LinkedIn</TextLink>
    </>,
    copyright: "© Hazel House Preschool, 2026"
  },
  footerStickers: [
    { id: "foot-sun", shape: "sun", color: "var(--band-marigold)", size: 72, bottom: 120, left: "46%", phone: false },
    { id: "foot-arch", shape: "arch", color: "var(--band-mint)", size: 120, bottom: 140, left: "30%", rotate: -10, phone: false },
    { id: "foot-dot", shape: "dot", color: "var(--shape)", size: 26, top: 40, right: "30%" }
  ],
  hero: (
    <PosterHero
      place="top"
      media={ <img src={ home.heroClassroom.src } alt={ home.heroClassroom.alt } /> }
      eyebrow="Preschool in Portland"
      title={ <>A second home, from six weeks</> }
      lede="Small, warm rooms for babies, toddlers and preschoolers, open all year in Southeast Portland."
      action={ <div className="flex flex-wrap gap-3"><PillLink tone="solid" href="/contact#tour">Book a tour</PillLink></div> }
    />
  ),
  after: (
    <>
      <Decorated stickers={ [
        { id: "gs-arch", shape: "arch", color: "var(--band-mint)", size: 130, top: 48, right: "6%", phone: { size: 70, top: 20, right: -12 } },
        { id: "gs-dot", shape: "dot", color: "var(--shape)", size: 28, top: 120, left: "9%", phone: false }
      ] }>
        <GrowthSteps
          title="One house, from babies to five"
          lede="Children move up through three rooms, keeping the same garden and the same faces."
          ground="var(--band-blush)"
          cloud="var(--color-background)"
          steps={ [
            { id: "nest", name: "The Nest", dotLabel: "Show the Nest", detail: "6 weeks to 17 months", note: "Sleep room right next door", href: "/infant", media: <Img photo={ home.nestCloud } />, sticker: { shape: "sun", color: "var(--band-marigold)", rotate: -85 } },
            { id: "burrow", name: "The Burrow", dotLabel: "Show the Burrow", detail: "18 to 35 months", note: "A mud kitchen in the garden", href: "/toddler", media: <Img photo={ home.burrowCloud } />, sticker: { shape: "flower", color: "var(--band-lilac)", rotate: -95 } },
            { id: "grove", name: "The Grove", dotLabel: "Show the Grove", detail: "3 to 5 years", note: "Ready for kindergarten", href: "/preschool", media: <Img photo={ home.groveCloud } />, sticker: { shape: "leaf", color: "var(--band-mint)", rotate: -140 } }
          ] }
        />
      </Decorated>
      <Decorated stickers={ [
        { id: "vc-sun", shape: "sun", color: "var(--band-marigold)", size: 96, top: -48, left: "52%", phone: { size: 56, top: -28, right: 8 } }
      ] }>
        <ValueColumns
          title="Why families choose us"
          values={ [
            { id: "small", title: "Small rooms", text: "Never more than three babies or four toddlers to each teacher.", ground: "var(--band-lilac)" },
            { id: "open", title: "Open all year", text: "We close only for nine public holidays and one training week.", ground: "var(--band-marigold)" },
            { id: "outside", title: "Outside every day", text: "Our garden has a mud kitchen, a sandpit and a covered porch for rain.", ground: "var(--band-mint)" }
          ] }
        />
      </Decorated>
      <Decorated stickers={ [
        { id: "rt-flower", shape: "flower", color: "var(--shape)", size: 110, bottom: -44, left: 330, phone: { size: 60, bottom: -24, left: -12 } }
      ] }>
        <RoomTabs
          label="Inside each room"
          title="Inside each room"
          tabs={ [
            { id: "nest", name: "Nest", ground: "var(--band-lilac)", media: <Img photo={ home.nestTab } />, links: [
              { label: "A day in the Nest", href: "/infant#day" },
              { label: "How we care for babies", href: "/infant#care" },
              { label: "Spaces and tuition", href: "/enroll#tuition" }
            ] },
            { id: "burrow", name: "Burrow", ground: "var(--band-marigold)", media: <Img photo={ home.burrowTab } />, links: [
              { label: "A day in the Burrow", href: "/toddler#day" },
              { label: "How we care for toddlers", href: "/toddler#care" },
              { label: "Spaces and tuition", href: "/enroll#tuition" }
            ] },
            { id: "grove", name: "Grove", ground: "var(--band-mint)", media: <Img photo={ home.groveTab } />, links: [
              { label: "A day in the Grove", href: "/preschool#day" },
              { label: "How we care for preschoolers", href: "/preschool#care" },
              { label: "Spaces and tuition", href: "/enroll#tuition" }
            ] }
          ] }
        />
      </Decorated>
      <Decorated stickers={ [
        { id: "sh-leaf", shape: "leaf", color: "var(--band-mint)", size: 140, top: "12%", left: "44%", rotate: 20, phone: false },
        { id: "sh-dot", shape: "dot", color: "var(--band-lilac)", size: 24, bottom: "18%", left: "8%", phone: { size: 18 } }
      ] }>
        <StoryHighlight
          align="center"
          ground="var(--band-marigold)"
          title="Come and see a morning"
          lede="Tours start at 9:30, when the rooms are busiest and you can see a real day."
          action={ <PillLink tone="solid" href="/contact#tour">Book a tour</PillLink> }
          media={ <Img photo={ home.storyTeacherCloud } /> }
        />
      </Decorated>
      <Decorated stickers={ [
        { id: "qr-arch", shape: "arch", color: "var(--band-marigold)", size: 150, bottom: -28, right: "4%", phone: false },
        { id: "qr-dot", shape: "dot", color: "var(--shape)", size: 30, top: 56, left: "34%", phone: false }
      ] }>
        <QuoteRow
          label="What parents say"
          size="display"
          quotes={ [
            { id: "grove", text: "She runs in every morning and tells us about the garden every night.", who: "Parent, the Grove" },
            { id: "nest", text: "Starting back at work was easier knowing who held him all day.", who: "Parent, the Nest" },
            { id: "burrow", text: "The daily photos and notes mean we never miss a first.", who: "Parent, the Burrow" }
          ] }
        />
      </Decorated>
      <Decorated stickers={ [
        { id: "fb-cloud", shape: "cloud", color: "var(--band-lilac)", size: 170, top: 90, right: "7%", phone: { size: 84, top: 40, right: -16 } }
      ] }>
        <FactsBlock
          className="bg-[var(--band-mint)]"
          title="Visit us"
          media={ <Img photo={ home.visitRoom } /> }
          name="Hazel House Preschool"
          action={ <TextLink href="https://maps.google.com/?q=2140+SE+Division+Street+Portland+OR+97202">Get directions</TextLink> }
          facts={ [
            { label: "Address", value: "2140 SE Division Street, Portland, OR 97202" },
            { label: "Hours", value: "Monday to Friday, 7:30 am to 6:00 pm" },
            { label: "Phone", value: "(503) 555-0142" }
          ] }
        />
      </Decorated>
    </>
  ),
  pages: {
    about: {
      title: "About",
      content: (
        <>
          <Decorated stickers={ [
            { id: "about-flower", shape: "flower", color: "var(--shape)", size: 150, bottom: "8%", left: "44%", phone: { size: 80, top: 96, right: -10 } }
          ] }>
            <SplitHero
              titleSize="h1"
              stack="text-first"
              className="bg-[var(--band-blush)]"
              media={ <Img photo={ home.aboutHeroCloud } /> }
              eyebrow="About"
              title="About Hazel House"
              lede="We opened in an old Division Street house in 2014, with one room and nine children."
              action={ <PillLink tone="solid" href="/contact#tour">Book a tour</PillLink> }
            />
          </Decorated>
          <Decorated stickers={ [
            { id: "about-dot", shape: "dot", color: "var(--band-marigold)", size: 30, top: -15, right: "14%" }
          ] }>
            <ValueColumns
              title="How we care"
              values={ [
                { id: "lead", title: "Children lead", text: "We follow what they are curious about, and plan the week around it.", ground: "var(--band-lilac)" },
                { id: "whole", title: "The whole child", text: "Feelings, friendships and bodies matter as much as letters and numbers.", ground: "var(--band-marigold)" },
                { id: "calm", title: "Calm, steady days", text: "The same faces and the same rhythm, so children feel safe to try.", ground: "var(--band-mint)" },
                { id: "partners", title: "Parents as partners", text: "A note and photos every day, and a sit-down talk each season.", ground: "var(--band-lilac)" }
              ] }
            />
          </Decorated>
          <ListSection
            title="Our teachers"
            items={ [
              { name: "Maren Ostrander", detail: "Director and founder", note: "With us since 2014" },
              { name: "Teo Alvarez", detail: "Lead teacher, the Nest", note: "With us since 2017" },
              { name: "Priya Natarajan", detail: "Lead teacher, the Burrow", note: "With us since 2019" },
              { name: "Joelle Baptiste", detail: "Lead teacher, the Grove", note: "With us since 2016" },
              { name: "Sam Whitlock", detail: "Garden and music", note: "With us since 2021" }
            ] }
          />
          <Decorated stickers={ [
            { id: "about-arch", shape: "arch", color: "var(--band-lilac)", size: 140, top: 40, right: "4%", phone: false }
          ] }>
            <FaqGroups
              groups={ [
                { id: "days", title: "Days and care", items: [
                  { id: "bring", question: "What should my child bring?", answer: <p>A change of clothes, a water bottle and anything they need to sleep. We provide meals and snacks.</p> },
                  { id: "meals", question: "Do you serve meals?", answer: <p>Yes, a hot lunch and two snacks, cooked here each day, with no nuts.</p> },
                  { id: "naps", question: "How do you handle naps?", answer: <p>Babies sleep on their own schedule. Older children rest after lunch, and sleep if they need to.</p> }
                ] },
                { id: "joining", title: "Joining", items: [
                  { id: "start", question: "When can my child start?", answer: <p>Any month there is a space. Most families start after a tour and a short settling-in week.</p> },
                  { id: "part", question: "Do you take part-time children?", answer: <p>Yes, three or five days a week in every room.</p> },
                  { id: "waitlist", question: "Is there a waitlist?", answer: <p>Sometimes for the Nest. Join it from the enrollment page and we will call you when a space opens.</p> }
                ] }
              ] }
            />
          </Decorated>
          <PhotoPause media={ <Img photo={ home.aboutPause } /> } by="Parent, the Burrow" shade="strong">
            Like a second family to us
          </PhotoPause>
        </>
      )
    },
    contact: {
      title: "Contact",
      content: (
        <Decorated stickers={ [
          { id: "contact-cloud", shape: "cloud", color: "var(--band-lilac)", size: 150, top: 120, right: "6%", phone: { size: 70, top: 72, right: -14 } },
          { id: "contact-dot", shape: "dot", color: "var(--band-marigold)", size: 26, top: "13.125rem", left: "calc(var(--grid-margin) + 34.125rem)", phone: false }
        ] }>
          <ContactDetails
            title="Contact Hazel House"
            media={ <Img photo={ home.contactRainbow } /> }
            rows={ [
              { id: "tour", label: "Book a tour", content: <>
                <p id="tour" className="scroll-mt-[calc(var(--site-header-height)_+_5.5rem)]">Tours run every weekday at 9:30 and take about forty minutes.</p>
                <ContactDetailsForm
                  subject="Tour"
                  submitLabel="Book my tour"
                  fields={ [
                    { id: "name", kind: "text", label: "Your name", required: true },
                    { id: "email", kind: "email", label: "Your email", required: true },
                    { id: "phone", kind: "tel", label: "Your phone" },
                    { id: "day", kind: "choice", label: "Best day", options: [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" ] },
                    { id: "notes", kind: "textarea", label: "Anything we should know" }
                  ] }
                />
              </> },
              { id: "visit", label: "Visit", content: <>
                <p>2140 SE Division Street, Portland, OR 97202</p>
                <TextLink href="https://maps.google.com/?q=2140+SE+Division+Street+Portland+OR+97202">Get directions</TextLink>
                <p>Street parking on 22nd, and a bike rack by the gate.</p>
              </> },
              { id: "hours", label: "Hours", content: <p>Monday to Friday, 7:30 am to 6:00 pm. Closed on nine public holidays.</p> },
              { id: "call", label: "Call or write", content: <>
                <TextLink href="tel:+15035550142">(503) 555-0142</TextLink>
                <TextLink href="mailto:hello@hazelhouse.school">hello@hazelhouse.school</TextLink>
              </> }
            ] }
          />
        </Decorated>
      )
    },
    enroll: {
      title: "Enroll",
      content: (
        <>
          <Decorated stickers={ [
            { id: "enroll-sun", shape: "sun", color: "var(--band-marigold)", size: 120, top: "30%", left: "6%", phone: { size: 60, top: 80, right: -10 } },
            { id: "enroll-leaf", shape: "leaf", color: "var(--band-mint)", size: 90, bottom: "14%", right: "10%", phone: false }
          ] }>
            <PageIntro title="Enrolling at Hazel House" className="bg-[var(--band-blush)]">
              Four steps from a first visit to a first day, and we help with each one.
            </PageIntro>
          </Decorated>
          <ListSection
            title="Open spaces"
            items={ [
              { name: "The Nest", detail: "6 weeks to 17 months", note: "2 spaces from March" },
              { name: "The Burrow", detail: "18 to 35 months", note: "1 space from April" },
              { name: "The Grove", detail: "3 to 5 years", note: "3 spaces from September" }
            ] }
          />
          <div id="tuition">
            <Decorated stickers={ [
              { id: "tuition-dot", shape: "dot", color: "var(--shape)", size: 28, top: 40, right: "30%" }
            ] }>
              <ListSection
                layout="prices"
                title="Tuition"
                notes={ [ "A month, for five days a week. Three days is 65%." ] }
                items={ [
                  { name: "The Nest", detail: "$2,450" },
                  { name: "The Burrow", detail: "$2,150" },
                  { name: "The Grove", detail: "$1,690" },
                  { name: "Deposit, paid once", detail: "$300" }
                ] }
              />
            </Decorated>
          </div>
          <StepStory
            nav="arrow"
            mediaSide="end"
            title="Four steps to a first day"
            steps={ [
              { id: "visit", title: "Visit", media: <Img photo={ home.stepVisit } />, children: <p>Come for a 9:30 tour, meet the teachers and see the rooms in full swing.</p> },
              { id: "apply", title: "Apply", media: <Img photo={ home.stepApply } />, children: <p>Fill in the short form below. We answer within two working days.</p> },
              { id: "papers", title: "Paperwork", media: <Img photo={ home.stepPapers } />, children: <p>Send your child's vaccine record, a health form and two emergency contacts.</p> },
              { id: "settle", title: "Settle in", media: <Img photo={ home.stepSettle } />, children: <p>A short first week, with you nearby, then full days.</p> }
            ] }
          />
          <ApplySection
            id="apply"
            title="Start your application"
            line="We answer within two working days."
            subject="Enrollment"
            submitLabel="Send application"
            fields={ [
              { id: "name", kind: "text", label: "Your name", required: true },
              { id: "email", kind: "email", label: "Your email", required: true },
              { id: "phone", kind: "tel", label: "Your phone" },
              { id: "child_age", kind: "text", label: "Your child's age", required: true },
              { id: "start", kind: "date", label: "Preferred start" },
              { id: "notes", kind: "textarea", label: "Anything else" }
            ] }
            aside={ <>Rather talk? Call <TextLink href="tel:+15035550142">(503) 555-0142</TextLink>, Monday to Friday, 7:30 am to 6:00 pm.</> }
            photo={ home.applyTeacher }
          />
        </>
      )
    },
    infant: {
      title: "Infant",
      content: (
        <RoomPage
          band="var(--band-lilac)"
          shapes={ [ { shape: "sun", color: "var(--band-marigold)" }, { shape: "dot", color: "var(--shape)" } ] }
          hero={ {
            photo: home.nestHeroCloud,
            eyebrow: "The Nest · 6 weeks to 17 months",
            title: "Infant care",
            lede: "One teacher for every three babies, in a quiet room with a sleep room next door."
          } }
          day={ {
            title: "A day in the Nest",
            intro: <>
              <p>Every baby keeps their own rhythm for feeds and naps. The times below are the shape of the day, not a rule.</p>
              <p>You get a note after every feed, nap and change, with photos, in the parent app.</p>
            </>,
            slots: nestDay
          } }
          values={ {
            title: "How we care for babies",
            items: [
              { id: "faces", title: "Same faces", text: "Each baby has one main teacher who knows their cues." },
              { id: "routine", title: "Your routine", text: "We follow your feeds and naps from home." },
              { id: "sleep", title: "Safe sleep", text: "Cribs in a separate room, checked every ten minutes." },
              { id: "talk", title: "Talk all day", text: "We name, sing and chat, to build early words." }
            ]
          } }
          quote={ { title: "“Back at work, and never worried”", lede: "A parent in the Nest.", photo: home.nestQuoteCloud } }
          statement="Two Nest spaces open this spring"
        />
      )
    },
    toddler: {
      title: "Toddler",
      content: (
        <RoomPage
          band="var(--band-marigold)"
          shapes={ [ { shape: "flower", color: "var(--band-lilac)" }, { shape: "leaf", color: "var(--shape)" } ] }
          hero={ {
            photo: home.burrowHeroCloud,
            eyebrow: "The Burrow · 18 to 35 months",
            title: "Toddler program",
            lede: "One teacher for every four toddlers, with lots of room to climb, build and make friends."
          } }
          day={ {
            title: "A day in the Burrow",
            intro: <>
              <p>Toddlers want to do it themselves, so the day is built around trying. Short circles, long play and plenty of outside time.</p>
              <p>Lunch and snacks are eaten at small tables, with real cups and plates.</p>
            </>,
            slots: burrowDay
          } }
          values={ {
            title: "How we care for toddlers",
            items: [
              { id: "try", title: "Let them try", text: "We wait a beat before helping, so they can." },
              { id: "feelings", title: "Words for feelings", text: "Big feelings get names, not shushing." },
              { id: "move", title: "Move every day", text: "Climbing, running and dancing, inside and out." },
              { id: "potty", title: "Potty, gently", text: "We start when your child is ready, with you." }
            ]
          } }
          quote={ { title: "“He runs in every single morning”", lede: "A parent in the Burrow.", photo: home.burrowQuoteCloud } }
          statement="One Burrow space open this spring"
        />
      )
    },
    preschool: {
      title: "Preschool",
      content: (
        <RoomPage
          band="var(--band-mint)"
          shapes={ [ { shape: "leaf", color: "var(--band-marigold)" }, { shape: "arch", color: "var(--band-lilac)" } ] }
          hero={ {
            photo: home.groveHeroCloud,
            eyebrow: "The Grove · 3 to 5 years",
            title: "Preschool program",
            lede: "Play-based learning that gets children ready for kindergarten, with one teacher for every eight."
          } }
          day={ {
            title: "A day in the Grove",
            intro: <>
              <p>Mornings are for projects the children choose: a bridge, a shop, a book about worms. Letters and numbers come along the way.</p>
              <p>Afternoons are for the garden, music and quiet reading.</p>
            </>,
            slots: groveDay
          } }
          values={ {
            title: "How we care for preschoolers",
            items: [
              { id: "questions", title: "Their questions", text: "Projects grow from what the children ask." },
              { id: "ready", title: "Ready for school", text: "Letters, numbers and taking turns, through play." },
              { id: "kind", title: "Kind together", text: "We practise sharing, saying sorry and asking for help." },
              { id: "world", title: "Out in the world", text: "Walks to the park, the library and the market." }
            ]
          } }
          quote={ { title: "“She can’t wait to come back”", lede: "A parent in the Grove.", photo: home.groveQuoteCloud } }
          statement="Three Grove spaces open this fall"
        />
      )
    }
  }
};
