import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <section className="home">
      <p className="eyebrow">Aravali Hostel · IIT Delhi</p>
      <h1 className="hero-title">Maintenance Portal</h1>
      <p className="hero-sub">
        Report anything that needs fixing, and follow it until it's done.
      </p>

      <div className="home-cards">
        <Link to="/ongoing" className="home-card">
          <span className="hc-label">01</span>
          <h2>Ongoing Problems</h2>
          <p>See what's pending, being worked on, and resolved.</p>
          <span className="hc-go">View board →</span>
        </Link>

        <Link to="/add" className="home-card accent">
          <span className="hc-label">02</span>
          <h2>Add a Problem</h2>
          <p>Report a new issue in under a minute, with photos.</p>
          <span className="hc-go">Report now →</span>
        </Link>
      </div>
    </section>
  )
}
