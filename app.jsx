/* global React, ReactDOM, QUOTES, Nav, Hero, AskBox, GuestStrip, WhatThisIs, PullQuote, Episodes, About, Footer */

// The brand palette (--bg / --fg / --cream) is defined in styles.css :root, so
// the theme applies without any runtime JS.
function App() {
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
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
