/* global React, ReactDOM, useTweaks, TweaksPanel, TweakSection, TweakColor, TweakText, QUOTES, Nav, Hero, AskBox, GuestStrip, WhatThisIs, PullQuote, Episodes, Listen, About, Footer */
const { useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": ["#172223", "#f5f0e8", "#d4a87d"]
}/*EDITMODE-END*/;

const PALETTES = [
  ["#172223", "#f5f0e8", "#d4a87d"],   // brand: forest + off-white + cream
  ["#0c0c0c", "#f5f0e8", "#d4a87d"],   // deep black variant
  ["#1e2b2c", "#f5f0e8", "#e6c4a0"],   // surface-lifted
];

function applyPalette(p) {
  const root = document.documentElement;
  root.style.setProperty("--bg", p[0]);
  root.style.setProperty("--fg", p[1]);
  root.style.setProperty("--cream", p[2]);
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    applyPalette(t.palette);
  }, [t.palette]);

  return (
    <>
      <Nav />
      <Hero />
      <AskBox />
      <GuestStrip />
      <WhatThisIs />
      <PullQuote quotes={QUOTES} />
      <Episodes />
      <About />
      <Footer />

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakColor
          label="Palette (bg · fg · cream)"
          value={t.palette}
          options={PALETTES}
          onChange={(v) => setTweak("palette", v)}
        />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
