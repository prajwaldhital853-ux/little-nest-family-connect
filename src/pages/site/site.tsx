import { TextLink } from "@/components/base/text-link";
import { ContactDetails } from "@/components/contact-details/contact-details";
import { ContactDetailsForm } from "@/components/contact-details/contact-details-form";
import { FactsBlock } from "@/components/facts-block/facts-block";
import { FaqGroups } from "@/components/faq-groups/faq-groups";
import { ListSection } from "@/components/list-section/list-section";
import { PhotoPause } from "@/components/photo-pause/photo-pause";
import { PageIntro } from "@/components/page-intro/page-intro";
import { PillLink } from "@/components/pill-link/pill-link";
import { PosterHero } from "@/components/poster-hero/poster-hero";
import { QuoteRow } from "@/components/quote-row/quote-row";
import { RoomTabs } from "@/components/room-tabs/room-tabs";
import { SplitHero } from "@/components/split-hero/split-hero";
import { StepStory } from "@/components/step-story/step-story";
import { StoryHighlight } from "@/components/story-highlight/story-highlight";
import { ValueColumns } from "@/components/value-columns/value-columns";
import { hazelHouse } from "@/style-packs/hazel-house";

import { home } from "./media";
import { Img } from "./parts";
import type { SiteContent } from "./types";

export const site: SiteContent = {
  name: "site",
  title: "Dr. Aashish Karki",
  pack: hazelHouse,
  layout: "margin",
  header: {
    name: "Dr. Aashish Karki",
    home: "/",
    start: [
      { label: "About", href: "/about" },
      { label: "Services", href: "/services" }
    ],
    end: [
      { label: "Contact", href: "/contact" },
      { label: "Book a visit", href: "/contact#appointment" }
    ]
  },
  footer: {
    contact: {
      label: "Book a visit",
      text: "Same-week appointments, Sunday to Friday",
      action: <TextLink href="/contact#appointment">Request an appointment</TextLink>
    },
    address: {
      label: "Karki Clinic / Baneshwor",
      lines: [ "Karki Clinic", "Baneshwor Marg, opposite BICC gate", "Kathmandu, Nepal", "Sunday to Friday, 9:00 am to 5:00 pm" ],
      action: <TextLink href="tel:+97714570000">+977-1-4570000</TextLink>
    },
    photos: [
      <Img key="clinic" photo={ home.clinic } />,
      <Img key="checkup" photo={ home.checkup } />,
      <Img key="family" photo={ home.family } />
    ],
    social: <>
      <TextLink href="https://facebook.com">Facebook</TextLink>
      <TextLink href="https://instagram.com">Instagram</TextLink>
      <TextLink href="https://linkedin.com">LinkedIn</TextLink>
      <TextLink href="https://youtube.com">YouTube</TextLink>
    </>,
    copyright: "© Dr. Aashish Karki, 2026"
  },
  hero: (
    <PosterHero
      place="top"
      media={ <img src={ home.heroPortrait.src } alt={ home.heroPortrait.alt } /> }
      eyebrow="Internal Medicine · Baneshwor, Kathmandu"
      title={ <>Get real answers about your health — without the queues or the guesswork</> }
      lede="Unhurried 30-minute consultations, on-site lab tests and a plan you actually understand. Trusted by over 20,000 patients across the valley."
      action={ <div className="flex flex-wrap gap-3"><PillLink tone="solid" href="/contact#appointment">Book an appointment</PillLink><PillLink href="/services">See services</PillLink></div> }
    />
  ),
  after: (
    <>
      <ValueColumns
        title="Trusted across the valley"
        values={ [
          { id: "years", title: "15+ years", text: "Practising internal medicine in Kathmandu since 2010.", ground: "var(--band-yellow)" },
          { id: "patients", title: "20,000+ patients", text: "From students to grandparents, many families for over a decade.", ground: "var(--band-cream)" },
          { id: "access", title: "Same-week visits", text: "Book today, be seen this week — no month-long waits.", ground: "var(--band-blush)" }
        ] }
      />
      <QuoteRow
        label="What patients say"
        size="display"
        quotes={ [
          { id: "sita", text: "For the first time, a doctor explained my reports in words I understood.", who: "Sita R., patient since 2018" },
          { id: "deepak", text: "He found what three other clinics had missed. My father is himself again.", who: "Deepak M., Bhaktapur" },
          { id: "anita", text: "No rushing, no unnecessary tests. Just honest, careful medicine.", who: "Anita S., Lalitpur" }
        ] }
      />
      <PhotoPause media={ <Img photo={ home.healthCamp } /> } by="Free health camp, Gorkha" shade="strong">
        Most of us see a doctor only when it is already serious
      </PhotoPause>
      <ValueColumns
        title="The real cost of waiting"
        values={ [
          { id: "late", title: "Late diagnosis", text: "Diabetes, blood pressure and thyroid problems grow silently for years before symptoms appear.", ground: "var(--band-cream)" },
          { id: "bills", title: "Emergency bills", text: "A condition that costs Rs 1,500 to manage early can become a Rs 150,000 hospital stay.", ground: "var(--band-yellow)" },
          { id: "chronic", title: "Chronic worry", text: "Living with an unexplained symptom drains your sleep, your work and your family.", ground: "var(--band-blush)" }
        ] }
      />
      <RoomTabs
        label="Care, end to end"
        title="Care, end to end"
        tabs={ [
          { id: "consult", name: "Consult", ground: "var(--band-yellow)", media: <Img photo={ home.consultation } />, links: [
            { label: "General consultation", href: "/services#consultation" },
            { label: "Chronic care", href: "/services#chronic" },
            { label: "Fees", href: "/services#fees" }
          ] },
          { id: "diagnose", name: "Diagnose", ground: "var(--band-cream)", media: <Img photo={ home.lab } />, links: [
            { label: "On-site lab tests", href: "/services#lab" },
            { label: "Annual health check-up", href: "/services#checkup" },
            { label: "Fees", href: "/services#fees" }
          ] },
          { id: "follow", name: "Follow up", ground: "var(--band-blush)", media: <Img photo={ home.teleconsult } />, links: [
            { label: "Video consultations", href: "/services#video" },
            { label: "Report reviews", href: "/services#video" },
            { label: "Fees", href: "/services#fees" }
          ] }
        ] }
      />
      <ValueColumns
        title="What you get with every visit"
        values={ [
          { id: "time", title: "A full 30 minutes", text: "Your concerns are heard to the end — no five-minute rush.", ground: "var(--band-yellow)" },
          { id: "lab", title: "On-site lab", text: "Blood tests and reports the same day, in the same building.", ground: "var(--band-cream)" },
          { id: "plain", title: "Plain-language plans", text: "Every diagnosis and prescription explained in Nepali or English.", ground: "var(--band-blush)" },
          { id: "fees", title: "Transparent fees", text: "Published prices, no surprise charges, no unnecessary tests.", ground: "var(--band-cream)" },
          { id: "video", title: "Video follow-ups", text: "Review your reports from home, wherever in Nepal you live.", ground: "var(--band-yellow)" },
          { id: "records", title: "Family records", text: "Your history kept in one place, so nothing is ever re-asked.", ground: "var(--band-blush)" }
        ] }
      />
      <StepStory
        nav="arrow"
        mediaSide="end"
        title="How it works"
        steps={ [
          { id: "book", title: "Book", media: <Img photo={ home.clinic } />, children: <p>Call, message or use the form. You get a confirmed slot within one working day — usually the same week.</p> },
          { id: "consult", title: "Consult", media: <Img photo={ home.consultation } />, children: <p>A full 30 minutes: your history, your symptoms, a proper examination, and time for every question.</p> },
          { id: "plan", title: "Test and plan", media: <Img photo={ home.lab } />, children: <p>Any tests run on-site the same day. You leave with a written plan — what to do, what to watch, when to return.</p> },
          { id: "follow", title: "Follow up", media: <Img photo={ home.teleconsult } />, children: <p>A review visit or video call checks your progress and adjusts the plan. You are never left guessing.</p> }
        ] }
      />
      <FaqGroups
        groups={ [
          { id: "visits", title: "Visits and fees", items: [
            { id: "walkin", question: "Do you take walk-in patients?", answer: <p>Yes, though booked patients are seen first. Calling ahead usually means little or no waiting.</p> },
            { id: "cost", question: "What does a consultation cost?", answer: <p>A first consultation is Rs 1,500 and follow-ups are Rs 1,000. Lab tests are priced separately and always quoted before they are done.</p> },
            { id: "reports", question: "Can I bring reports from other hospitals?", answer: <p>Please do. Old reports, scans and prescriptions help avoid repeating tests you have already paid for.</p> }
          ] },
          { id: "practical", title: "Practical questions", items: [
            { id: "video", question: "Can I consult from outside Kathmandu?", answer: <p>Yes. Video consultations run every afternoon, and prescriptions are sent to your phone afterwards.</p> },
            { id: "language", question: "Which languages can I speak?", answer: <p>Nepali and English, whichever you are more comfortable with.</p> },
            { id: "emergency", question: "What if I need urgent care?", answer: <p>For emergencies, go to the nearest hospital first. Once you are stable, we coordinate your follow-up care.</p> }
          ] }
        ] }
      />
      <StoryHighlight
        align="center"
        ground="var(--band-yellow)"
        title="Your health can't wait for a quieter week"
        lede="One visit. A clear answer. A plan you can follow. Book today and be seen this week."
        action={ <PillLink tone="solid" href="/contact#appointment">Book an appointment</PillLink> }
        media={ <Img photo={ home.family } /> }
      />
      <FactsBlock
        className="bg-[var(--band-cream)]"
        title="Visit the clinic"
        media={ <Img photo={ home.clinic } /> }
        name="Karki Clinic"
        action={ <TextLink href="https://maps.google.com/?q=Baneshwor+Kathmandu+Nepal">Get directions</TextLink> }
        facts={ [
          { label: "Address", value: "Baneshwor Marg, opposite BICC gate, Kathmandu" },
          { label: "Hours", value: "Sunday to Friday, 9:00 am to 5:00 pm" },
          { label: "Phone", value: "+977-1-4570000" }
        ] }
      />
    </>
  ),
  pages: {
    about: {
      title: "About",
      content: (
        <>
          <SplitHero
            titleSize="h1"
            stack="text-first"
            className="bg-[var(--band-cream)]"
            media={ <Img photo={ home.heroPortrait } /> }
            eyebrow="About"
            title="About Dr. Aashish Karki"
            lede="Physician, teacher and health-camp regular — practising internal medicine in Kathmandu for over fifteen years."
            action={ <PillLink tone="solid" href="/contact#appointment">Book an appointment</PillLink> }
          />
          <ValueColumns
            title="How I practise"
            values={ [
              { id: "listen", title: "Listen first", text: "The diagnosis usually hides in the story. I make sure I hear all of it.", ground: "var(--band-yellow)" },
              { id: "evidence", title: "Evidence, not habit", text: "Tests and medicines only when they change what we do next.", ground: "var(--band-cream)" },
              { id: "prevent", title: "Prevention first", text: "The best consultation is the one you never need. We screen early.", ground: "var(--band-blush)" },
              { id: "plain", title: "Plain language", text: "You leave knowing what you have, why, and exactly what to do.", ground: "var(--band-cream)" }
            ] }
          />
          <ListSection
            title="Training and credentials"
            items={ [
              { name: "MBBS", detail: "Institute of Medicine, Tribhuvan University", note: "2005" },
              { name: "MD, Internal Medicine", detail: "National Academy of Medical Sciences (NAMS)", note: "2010" },
              { name: "Nepal Medical Council", detail: "Registered practitioner", note: "Reg. no. 8421" },
              { name: "Nepal Medical Association", detail: "Life member", note: "Since 2011" },
              { name: "Community health camps", detail: "Free camps in Gorkha, Sindhupalchok and Dolakha", note: "12 a year" }
            ] }
          />
          <PhotoPause media={ <Img photo={ home.checkup } /> } by="Karki Clinic, Baneshwor" shade="strong">
            Medicine is a conversation, not a transaction
          </PhotoPause>
          <StoryHighlight
            align="center"
            ground="var(--band-yellow)"
            title="Come in once, and judge for yourself"
            lede="Same-week appointments, Sunday to Friday."
            action={ <PillLink tone="solid" href="/contact#appointment">Book an appointment</PillLink> }
            media={ <Img photo={ home.consultation } /> }
          />
        </>
      )
    },
    services: {
      title: "Services",
      content: (
        <>
          <PageIntro title="Services" className="bg-[var(--band-cream)]">
            Complete internal medicine care under one roof — from a first consultation to long-term follow-up.
          </PageIntro>
          <ListSection
            title="What I treat and offer"
            items={ [
              { name: "General consultation", detail: "Fever, infections, pain, fatigue and new symptoms", note: "30 minutes" },
              { name: "Chronic care", detail: "Diabetes, blood pressure, thyroid, cholesterol and asthma", note: "Monthly reviews" },
              { name: "Annual health check-up", detail: "Full screening with labs, ECG and a written report", note: "Half a morning" },
              { name: "On-site lab and diagnostics", detail: "Blood tests, urine tests, ECG and same-day reports", note: "Results same day" },
              { name: "Video consultation", detail: "Follow-ups and report reviews from anywhere in Nepal", note: "Every afternoon" },
              { name: "Community health camps", detail: "Free screening camps outside the valley", note: "12 a year" }
            ] }
          />
          <div id="fees">
            <ListSection
              layout="prices"
              title="Fees"
              notes={ [ "All fees are fixed and published. Lab tests are always quoted before they are done." ] }
              items={ [
                { name: "First consultation", detail: "Rs 1,500" },
                { name: "Follow-up visit", detail: "Rs 1,000" },
                { name: "Video consultation", detail: "Rs 1,200" },
                { name: "Annual health check-up", detail: "Rs 6,500" }
              ] }
            />
          </div>
          <FaqGroups
            groups={ [
              { id: "services", title: "About the services", items: [
                { id: "checkup", question: "What does the annual check-up include?", answer: <p>A full physical examination, blood panel, urine test, ECG, blood pressure and sugar screening, and a written report reviewed with you in person.</p> },
                { id: "chronic", question: "How does chronic care work?", answer: <p>We set a baseline with tests, agree a treatment plan, then review monthly — in person or by video — adjusting medicines only when the numbers say so.</p> },
                { id: "referral", question: "What if I need a specialist?", answer: <p>I refer you to a specialist I trust, share your records with them, and stay involved so nothing falls between two doctors.</p> }
              ] }
            ] }
          />
          <StoryHighlight
            align="center"
            ground="var(--band-yellow)"
            title="Not sure which service fits? Just ask."
            lede="Describe your concern in the form and we will point you to the right visit."
            action={ <PillLink tone="solid" href="/contact#appointment">Ask a question</PillLink> }
            media={ <Img photo={ home.lab } /> }
          />
        </>
      )
    },
    contact: {
      title: "Contact",
      content: (
        <ContactDetails
          title="Contact Dr. Karki"
          media={ <Img photo={ home.clinic } /> }
          rows={ [
            { id: "appointment", label: "Book an appointment", content: <>
              <p id="appointment" className="scroll-mt-[calc(var(--site-header-height)_+_5.5rem)]">Request a slot below and we confirm within one working day — usually the same week.</p>
              <ContactDetailsForm
                subject="Appointment"
                submitLabel="Request my appointment"
                fields={ [
                  { id: "name", kind: "text", label: "Your name", required: true },
                  { id: "email", kind: "email", label: "Your email", required: true },
                  { id: "phone", kind: "tel", label: "Your phone" },
                  { id: "day", kind: "choice", label: "Preferred day", options: [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" ] },
                  { id: "notes", kind: "textarea", label: "Your concern, in a few words" }
                ] }
              />
            </> },
            { id: "visit", label: "Visit", content: <>
              <p>Karki Clinic, Baneshwor Marg, opposite the BICC gate, Kathmandu.</p>
              <TextLink href="https://maps.google.com/?q=Baneshwor+Kathmandu+Nepal">Get directions</TextLink>
              <p>Two minutes from the Baneshwor bus stop; parking behind the building.</p>
            </> },
            { id: "hours", label: "Hours", content: <p>Sunday to Friday, 9:00 am to 5:00 pm. Video consultations every afternoon, 2:00 to 4:00 pm.</p> },
            { id: "call", label: "Call or write", content: <>
              <TextLink href="tel:+97714570000">+977-1-4570000</TextLink>
              <TextLink href="mailto:hello@karkiclinic.com.np">hello@karkiclinic.com.np</TextLink>
            </> }
          ] }
        />
      )
    }
  }
};
