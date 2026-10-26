import type { ReactNode } from "react";

import type { EnquiryField } from "@/components/contact-details/contact-details-form";
import { ContactDetailsForm } from "@/components/contact-details/contact-details-form";
import { Reveal } from "@/lib/animations/reveal";

import type { SitePhoto } from "./media";
import { Img } from "./parts";

export interface ApplySectionProps {
  id: string;
  title: ReactNode;
  line: ReactNode;
  subject: string;
  submitLabel: string;
  fields: EnquiryField[];
  aside: ReactNode;
  photo: SitePhoto;
}

export function ApplySection( { id, title, line, subject, submitLabel, fields, aside, photo }: ApplySectionProps ) {
  return (
    <section id={ id } data-header="solid" className="bg-background px-[var(--grid-margin)] py-20 text-foreground lg:py-[7.5rem]">
      <hr className="m-0 mb-10 h-px border-0 bg-current opacity-20 lg:mb-16" />
      <div className="flex flex-col gap-12 lg:grid lg:grid-cols-12 lg:gap-x-[var(--grid-gutter)]">
        <Reveal className="flex flex-col gap-8 lg:col-span-6">
          <div className="flex flex-col gap-5">
            <h2 className="m-0 text-h2">{ title }</h2>
            <p className="m-0 text-large">{ line }</p>
          </div>
          <ContactDetailsForm subject={ subject } submitLabel={ submitLabel } fields={ fields } />
          <p className="m-0">{ aside }</p>
        </Reveal>
        <Reveal order={ 1 } className="relative aspect-[4/5] overflow-hidden lg:col-span-5 lg:col-start-8 [&>img]:absolute [&>img]:inset-0 [&>img]:h-full [&>img]:w-full [&>img]:object-cover">
          <Img photo={ photo } />
        </Reveal>
      </div>
    </section>
  );
}
