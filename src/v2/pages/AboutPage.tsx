// ============================================================================
// AboutPage — preserve introduction, contact, and team.
// ============================================================================

import { useState, type FormEvent } from 'react';
import { Mail } from 'lucide-react';
import {
  ABOUT_CONTACT_EMAIL,
  ABOUT_HERO_IMAGE,
  ABOUT_PARAGRAPHS,
  CONTACT_TOPICS,
  TEAM_MEMBERS,
  buildContactMailto,
  initialsFor,
  type ContactTopicId,
} from './aboutContent';

const inputClassName =
  'w-full rounded-button border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none';

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
              alt="UCSB Spatial Center"
              className="h-10 w-auto object-contain [filter:drop-shadow(0_1px_4px_rgba(0,0,0,0.45))]"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-8 py-10">
        <section id="about-description" className="flex flex-col gap-4">
          {ABOUT_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="text-[15px] leading-relaxed text-gray-700">
              {paragraph}
            </p>
          ))}
        </section>

        <ContactSection />
      </div>

      <div className="mx-auto w-full max-w-5xl px-8 pb-16">
        <TeamSection />
      </div>
    </div>
  );
}

function ContactSection() {
  const [topicId, setTopicId] = useState<ContactTopicId>('questions');
  const [name, setName] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const topic = CONTACT_TOPICS.find((item) => item.id === topicId);
    if (!topic || !name.trim() || !replyEmail.trim() || !message.trim()) {
      setNotice('Add your name, email, and a message so we know how to reply.');
      return;
    }
    if (!ABOUT_CONTACT_EMAIL) {
      setNotice('The team inbox is not connected yet.');
      return;
    }

    window.location.href = buildContactMailto({
      to: ABOUT_CONTACT_EMAIL,
      topicLabel: topic.label,
      name,
      replyEmail,
      message,
    });
    setNotice('Your email app should open with this message ready to send.');
  }

  return (
    <section id="about-contact" className="rounded-card border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
          <Mail className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Contact us</h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            Questions, feedback, and requests for new functionality or data are welcome.
          </p>
        </div>
      </div>

      <form id="about-contact-form" className="mt-5 flex flex-col gap-4" onSubmit={onSubmit}>
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            What is this about?
          </legend>
          <div className="mt-2 grid gap-2 lg:grid-cols-3">
            {CONTACT_TOPICS.map((topic) => {
              const isSelected = topic.id === topicId;
              return (
                <button
                  key={topic.id}
                  id={`about-contact-topic-${topic.id}`}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setTopicId(topic.id);
                    setNotice(null);
                  }}
                  className={`rounded-card border px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40'
                  }`}
                >
                  <span className="block text-sm font-semibold text-gray-900">{topic.label}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-gray-600">
                    {topic.description}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700" htmlFor="about-contact-name">
            Name
            <input
              id="about-contact-name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClassName}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700" htmlFor="about-contact-email">
            Email
            <input
              id="about-contact-email"
              name="email"
              type="email"
              autoComplete="email"
              value={replyEmail}
              onChange={(event) => setReplyEmail(event.target.value)}
              className={inputClassName}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-xs font-medium text-gray-700" htmlFor="about-contact-message">
          Message
          <textarea
            id="about-contact-message"
            name="message"
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className={`${inputClassName} resize-y`}
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="about-contact-submit"
            type="submit"
            className="rounded-button bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
          >
            Send message
          </button>
          {notice && (
            <p id="about-contact-notice" className="text-sm text-gray-600" role="status">
              {notice}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}

function TeamSection() {
  return (
    <section id="about-team">
      <h2 className="text-lg font-semibold text-gray-900">Our team</h2>
      <p className="mt-1 max-w-2xl text-sm text-gray-600">
        The Nature Conservancy’s Point Conception Institute and the Center for Spatial Science at UCSB.
      </p>

      <ul className="mt-5 grid gap-4 lg:grid-cols-2">
        {TEAM_MEMBERS.map((member) => (
          <li
            key={member.id}
            id={`about-team-${member.id}`}
            className="flex gap-4 rounded-card border border-gray-200 bg-white p-4"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-sm font-semibold text-emerald-900">
              {member.photoSrc ? (
                <img src={member.photoSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                <span aria-hidden="true">{initialsFor(member.name)}</span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">{member.name}</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{member.bio}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
