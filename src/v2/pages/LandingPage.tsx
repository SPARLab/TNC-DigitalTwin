// ============================================================================
// LandingPage — full-screen hero.
// Ported from the twin_models webapp mockup landing page.
// ============================================================================

export function LandingPage() {
  return (
    <div id="landing-page" className="relative h-full w-full overflow-hidden">
      <img
        id="landing-hero-image"
        src="/landing.jpg"
        alt="Aerial view of the Dangermond Preserve coastline"
        className="absolute inset-0 h-full w-full object-cover object-center"
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
        <h1 className="whitespace-nowrap text-[clamp(2rem,5vw,4rem)] font-extrabold leading-tight tracking-[-0.03em] text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.5)]">
          Digital Twin of Nature
        </h1>
        <p className="mt-1 text-2xl text-white/85 [text-shadow:0_1px_10px_rgba(0,0,0,0.4)]">
          Jack and Laura Dangermond Preserve
        </p>
        <p className="mt-5 max-w-[480px] text-[15px] leading-relaxed text-white/70 [text-shadow:0_1px_6px_rgba(0,0,0,0.3)]">
          A research platform enabling data discovery, ecological modeling, and
          scientific insights for the preservation of coastal biodiversity.
        </p>
      </div>

      {/* Both marks are white-on-transparent, so they sit over the darker base of
          the photo and rely on a drop shadow rather than a backing panel. */}
      <div
        id="landing-hero-logos"
        className="pointer-events-none absolute inset-x-6 bottom-5 flex items-end justify-between"
      >
        <img
          src="/tnc.png"
          alt="The Nature Conservancy"
          className="pointer-events-auto h-12 w-auto object-contain [filter:drop-shadow(0_1px_4px_rgba(0,0,0,0.4))]"
        />
        <img
          src="/spatial.png"
          alt="UCSB Spatial Center"
          className="pointer-events-auto h-12 w-auto object-contain [filter:drop-shadow(0_1px_4px_rgba(0,0,0,0.4))]"
        />
      </div>
    </div>
  );
}
