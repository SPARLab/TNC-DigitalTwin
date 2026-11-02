// ============================================================================
// AboutPage — preserve introduction, contact, and team.
// ============================================================================

import type { ReactNode } from 'react';
import { Mail, MessageSquareText } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FEEDBACK_PATH } from '../config/navigation';
import {
  ABOUT_HERO_IMAGE,
  ABOUT_PARAGRAPHS,
  CONTACT_TOPICS,
  TEAM_MEMBERS,
  initialsFor,
} from './aboutContent';

const sectionHeadingClassName = 'text-2xl font-semibold tracking-tight text-gray-900 2xl:text-3xl';

/** Section title with a thin full-width rule and an emerald accent under the text. */
function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-gray-200">
      <h2
        className={`${sectionHeadingClassName} -mb-px inline-block border-b-[3px] border-emerald-700 pb-2`}
      >
        {children}
      </h2>
    </div>
  );
}

export function AboutPage() {
  return (
    <div id="about-page" className="h-full w-full overflow-y-auto bg-stone-50">
      <header id="about-hero" className="relative h-[min(42vh,380px)] min-h-[240px] overflow-hidden">
        <img
          src={ABOUT_HERO_IMAGE}
          alt="Coastal cliffs and ocean at the Jack and Laura Dangermond Preserve"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-gray-950/25 to-gray-950/10"
        />

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 px-8 pb-6 pt-16 sm:px-10">
          <div className="min-w-0 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
              About
            </p>
            <h1 className="mt-1 text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-tight tracking-tight text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.45)]">
              Dangermond Preserve Digital Twin
            </h1>
          </div>

          <div className="hidden shrink-0 items-end gap-4 lg:flex">
            <img
              src="/tnc.png"
              alt="The Nature Conservancy"
              className="h-10 w-auto object-contain [filter:drop-shadow(0_1px_4px_rgba(0,0,0,0.45))]"
            />
            <img
              src="/spatial.png"
              alt="UC Santa Barbara Spatial Center"
              className="h-10 w-auto object-contain [filter:drop-shadow(0_1px_4px_rgba(0,0,0,0.45))]"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-8 pb-20 pt-12 lg:grid-cols-[minmax(0,1fr)_300px] xl:max-w-7xl xl:grid-cols-[minmax(0,1fr)_340px] 2xl:max-w-[1680px] 2xl:grid-cols-[minmax(0,1fr)_400px] 2xl:gap-14 lg:items-start">
        <div className="flex min-w-0 flex-col gap-14 xl:gap-16 2xl:gap-20">
          <section id="about-description" className="flex flex-col gap-4">
            <SectionHeading>About the platform</SectionHeading>
            {ABOUT_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="text-[15px] leading-relaxed text-gray-700 lg:text-base xl:text-lg 2xl:text-xl">
                {paragraph}
              </p>
            ))}
          </section>

          <TeamSection />
        </div>

        <ContactSidebar />
      </div>
    </div>
  );
}

function ContactSidebar() {
  return (
    <aside
      id="about-contact"
      aria-label="Contact information"
      className="rounded-card border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-6"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
          <Mail className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 xl:text-xl 2xl:text-2xl">Contact us</h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-600 xl:text-base 2xl:text-lg">
            Questions, feedback, and requests for new functionality or data are welcome.
          </p>
        </div>
      </div>

      <dl id="about-contact-topics" className="mt-5 flex flex-col gap-3">
        {CONTACT_TOPICS.map((topic) => (
          <div key={topic.id}>
            <dt className="text-sm font-semibold text-gray-900 xl:text-base 2xl:text-lg">{topic.label}</dt>
            <dd className="mt-0.5 text-xs leading-snug text-gray-600 xl:text-sm 2xl:text-base">{topic.description}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <p className="text-sm leading-relaxed text-gray-600 xl:text-base">
          Send us a message with the form on the Feedback page.
        </p>
        <FeedbackButton />
      </div>
    </aside>
  );
}

/** Opens the Feedback page, the same one as the Feedback item in the nav rail. */
function FeedbackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <button
      id="about-contact-feedback"
      type="button"
      onClick={() => navigate(FEEDBACK_PATH, { state: { from: location.pathname } })}
      className="mt-3 inline-flex items-center gap-2 rounded-button bg-emerald-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 xl:text-base 2xl:text-lg"
    >
      <MessageSquareText className="h-4 w-4 shrink-0" aria-hidden />
      Go to the feedback form
    </button>
  );
}

function TeamSection() {
  return (
    <section id="about-team">
      <SectionHeading>Our team</SectionHeading>
      <p className="mt-4 max-w-2xl text-sm text-gray-600 xl:text-base 2xl:max-w-3xl 2xl:text-lg">
        The Center for Spatial Science at UC Santa Barbara and The Nature Conservancy’s Point Conception Institute.
      </p>

      <ul className="mt-6 grid auto-rows-fr gap-5 2xl:grid-cols-2">
        {TEAM_MEMBERS.map((member) => (
          <li
            key={member.id}
            id={`about-team-${member.id}`}
            // The text keeps a minimum width of about 19.5rem, so once the card is
            // narrower than roughly 500px it drops under the photo instead of squeezing.
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-4 rounded-card border border-gray-200 bg-white p-5 2xl:gap-x-6"
          >
            <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-3xl font-semibold text-emerald-900 xl:h-40 xl:w-40 xl:text-4xl 2xl:h-48 2xl:w-48 2xl:text-5xl">
              {member.photoSrc ? (
                <img src={member.photoSrc} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <span aria-hidden="true">{initialsFor(member.name)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1 basis-[19.5rem]">
              <h3 className="text-sm font-semibold text-gray-900 xl:text-base 2xl:text-lg">{member.name}</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-600 xl:text-base 2xl:text-lg">{member.bio}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
