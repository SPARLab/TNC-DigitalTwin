// ============================================================================
// LandingPage — full-screen hero.
// Ported from the twin_models webapp mockup landing page.
// ============================================================================

export function LandingPage() {
  return (
    <div id="landing-page" className="relative h-full w-full overflow-hidden">
      <video
        id="landing-hero-video"
        className="absolute inset-0 h-full w-full object-cover object-center"
        src="/dangermond_footage_2.mp4"
        poster="/landing.jpg"
        autoPlay
        muted
        loop
        playsInline
        aria-label="Drone footage of the ocean, beaches, and ecosystems of the Jack and Laura Dangermond Preserve. Video by Kelly Easterday."
      />
      <div
        id="landing-hero-overlay"
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-gray-950/20 to-gray-950/45"
      />

      <div
        id="landing-hero-content"
        className="relative flex h-full w-full flex-col items-center justify-center px-8 text-center"
      >
        <h1 className="text-[clamp(2rem,5vw,4rem)] font-extrabold leading-tight tracking-[-0.03em] text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.5)]">
          Research Digital Twin of Nature
        </h1>
        <p className="mt-1 text-2xl text-white/85 [text-shadow:0_1px_10px_rgba(0,0,0,0.4)]">
          Jack and Laura Dangermond Preserve
        </p>
        <p className="mt-5 max-w-[480px] text-[15px] leading-relaxed text-white/70 [text-shadow:0_1px_6px_rgba(0,0,0,0.3)]">
          A research platform enabling data discovery, ecological modeling, and
          scientific insights for the preservation of coastal biodiversity.
        </p>
      </div>

      <p
        id="landing-hero-video-credit"
        className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11px] leading-snug text-white/65 [text-shadow:0_1px_6px_rgba(0,0,0,0.45)]"
      >
        Footage credit: Kelly Easterday
      </p>

      {/* Both marks are white-on-transparent, so they sit over the darker base of
          the footage and rely on a drop shadow rather than a backing panel. */}
      <div
        id="landing-hero-logos"
        className="pointer-events-none absolute inset-x-8 bottom-5 flex items-end justify-between sm:inset-x-10 sm:bottom-6"
      >
        <img
          src="/tnc.png"
          alt="The Nature Conservancy"
          className="pointer-events-auto h-14 w-auto object-contain sm:h-16 [filter:drop-shadow(0_1px_4px_rgba(0,0,0,0.4))]"
        />
        <img
          src="/spatial.png"
          alt="UCSB Spatial Center"
          className="pointer-events-auto h-14 w-auto object-contain sm:h-16 [filter:drop-shadow(0_1px_4px_rgba(0,0,0,0.4))]"
        />
      </div>
    </div>
  );
}
