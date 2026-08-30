export default function Home() {
  return (
    <main className="shell">
      <header className="masthead">
        <span className="wordmark">Skill Grill</span>
        <span className="descriptor">Community skill reviews</span>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title">Find AI agent skills that actually work.</h1>
          <p>
            Community votes, comments, and practical feedback for agent skills.
          </p>
        </div>

        <div className="monogram" aria-hidden="true">
          <span>Skill</span>
          <span>Grill</span>
        </div>
      </section>
    </main>
  )
}
