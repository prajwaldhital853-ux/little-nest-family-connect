import type { CSSProperties, ReactNode } from "react";

import type { DaySlot } from "@/components/day-schedule/day-schedule";
import { DaySchedule } from "@/components/day-schedule/day-schedule";
import { PillLink } from "@/components/pill-link/pill-link";
import { SplitHero } from "@/components/split-hero/split-hero";
import { StatementSection } from "@/components/statement-section/statement-section";
import type { StickerShape } from "@/components/sticker/sticker";
import { Decorated } from "@/components/sticker/sticker-layer";
import { StoryHighlight } from "@/components/story-highlight/story-highlight";
import { ValueColumns } from "@/components/value-columns/value-columns";

import type { SitePhoto } from "./media";
import { Img } from "./parts";

interface RoomShape {
  shape: StickerShape;
  color: string;
}

export interface RoomPageProps {
  band: string;
  shapes: [ RoomShape, RoomShape ];
  hero: { photo: SitePhoto; eyebrow: ReactNode; title: ReactNode; lede: ReactNode };
  day: { title: ReactNode; intro: ReactNode; slots: DaySlot[] };
  values: { title: ReactNode; items: Array<{ id: string; title: ReactNode; text: ReactNode }> };
  quote: { title: ReactNode; lede: ReactNode; photo: SitePhoto };
  statement: ReactNode;
}

export function RoomPage( { band, shapes, hero, day, values, quote, statement }: RoomPageProps ) {
  const [ first, second ] = shapes;
  return (
    <div style={ { "--band": band } as CSSProperties }>
      <Decorated stickers={ [
        { id: "hero", ...first, size: 170, bottom: "8%", left: "44%", phone: { size: 90, top: 96, right: -10 } }
      ] }>
        <SplitHero
          titleSize="h1"
          stack="text-first"
          className="bg-[var(--band)]"
          media={ <Img photo={ hero.photo } /> }
          eyebrow={ hero.eyebrow }
          title={ hero.title }
          lede={ hero.lede }
          action={ <PillLink tone="solid" href="/contact#tour">Book a tour</PillLink> }
        />
      </Decorated>
      <div id="day" className="scroll-mt-[var(--site-header-height)]">
        <DaySchedule title={ day.title } intro={ day.intro } slots={ day.slots } timeZone="America/Los_Angeles" />
      </div>
      <div id="care" className="scroll-mt-[var(--site-header-height)]">
        <Decorated stickers={ [
          { id: "care", ...second, size: 34, top: -17, right: "12%", phone: { size: 24 } }
        ] }>
          <ValueColumns
            title={ values.title }
            values={ values.items.map( item => ( { ...item, ground: "var(--band)" } ) ) }
          />
        </Decorated>
      </div>
      <Decorated stickers={ [
        { id: "quote", ...second, size: 150, bottom: "6%", left: "3%", phone: false }
      ] }>
        <StoryHighlight
          align="center"
          ground="var(--band)"
          title={ quote.title }
          lede={ quote.lede }
          media={ <Img photo={ quote.photo } /> }
        />
      </Decorated>
      <Decorated stickers={ [
        { id: "join-1", ...first, size: 100, top: "calc(14% - 2.5rem)", left: "calc(var(--grid-margin) + 7.125rem)", phone: { size: 56, top: "calc(14% - 28px)", left: "calc(10% + 28px)" } },
        { id: "join-2", ...second, size: 80, bottom: "16%", right: "12%", phone: false }
      ] }>
        <StatementSection
          className="bg-[var(--pill-pale)]"
          eyebrow="Join us"
          action={ <PillLink tone="solid" href="/enroll">Start enrolling</PillLink> }
        >
          { statement }
        </StatementSection>
      </Decorated>
    </div>
  );
}
