
import { useState } from "react";
import Sidebar from "../components/Navbar";
import "../css/about.css";

const FEATURES = [
    {
        icon: "💧",
        title: "Water Monitoring",
        description:
            "Monitor reservoir distance, water level, and water percentage through connected sensors.",
        tag: "SENSORS",
        color: "blue",
    },
    {
        icon: "🧪",
        title: "Nutrient Management",
        description:
            "Control nutrient dosing through dedicated pumps for Nutrient A and Nutrient B.",
        tag: "DOSING",
        color: "purple",
    },
    {
        icon: "⚗️",
        title: "pH Monitoring",
        description:
            "Track pH readings to help maintain suitable conditions for hydroponic plants.",
        tag: "WATER QUALITY",
        color: "orange",
    },
    {
        icon: "⚙️",
        title: "Pump Control",
        description:
            "Send timed pump commands through the web interface and connected ESP32.",
        tag: "AUTOMATION",
        color: "green",
    },
    {
        icon: "📡",
        title: "ESP32 Connectivity",
        description:
            "Connect hardware sensors and relay-controlled pumps through the device API.",
        tag: "IOT DEVICE",
        color: "cyan",
    },
    {
        icon: "📊",
        title: "System Records",
        description:
            "Store and review sensor readings, pump events, and system activity.",
        tag: "ANALYTICS",
        color: "pink",
    },
];

const TECHNOLOGIES = [
    {
        icon: "⚛️",
        name: "React",
        description: "Frontend interface",
    },
    {
        icon: "🟨",
        name: "JavaScript",
        description: "Application logic",
    },
    {
        icon: "🎨",
        name: "CSS3",
        description: "Responsive styling",
    },
    {
        icon: "🟢",
        name: "Node.js",
        description: "Backend runtime",
    },
    {
        icon: "🚀",
        name: "Express.js",
        description: "REST API",
    },
    {
        icon: "🗄️",
        name: "Supabase",
        description: "Database services",
    },
    {
        icon: "📟",
        name: "ESP32",
        description: "Hardware controller",
    },
];

function SectionHeading({ eyebrow, title, description }) {
    return (
        <div className="about-section-heading">
            <span className="about-eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
        </div>
    );
}

function About() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="about-page">
            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            <main className="about-main">
                {/* HEADER */}
                <header className="about-header">
                    <div className="about-header-left">
                        <button
                            type="button"
                            className="about-menu-button"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open navigation menu"
                        >
                            <span />
                            <span />
                            <span />
                        </button>

                        <div className="about-breadcrumb">
                            <span>HydroControl</span>
                            <span className="about-breadcrumb-divider">
                                /
                            </span>
                            <strong>About</strong>
                        </div>
                    </div>

                    <div className="about-header-right">
                        <div className="about-header-status">
                            <span className="about-status-dot" />
                            <span>PLATFORM OVERVIEW</span>
                        </div>
                    </div>
                </header>

                {/* HERO */}
                <section className="about-hero">
                    <div className="about-hero-content">
                        <div className="about-hero-topline">
                            <span className="about-hero-badge">
                                <span>✦</span>
                                SMART AGRICULTURE PLATFORM
                            </span>

                            <span className="about-hero-version">
                                VERSION 1.0.0
                            </span>
                        </div>

                        <h1>
                            Growing smarter,
                            <br />
                            <span>one drop at a time.</span>
                        </h1>

                        <p className="about-hero-description">
                            Meet HydroControl — a connected hydroponic
                            monitoring and control platform that brings
                            water-level sensing, pH monitoring, pump
                            management, and system records into one
                            centralized workspace.
                        </p>

                        <div className="about-hero-actions">
                            <a
                                href="#about-features"
                                className="about-primary-button"
                            >
                                Explore the platform
                                <span>↗</span>
                            </a>

                            <a
                                href="#about-technology"
                                className="about-secondary-button"
                            >
                                Our technology
                            </a>
                        </div>

                        <div className="about-hero-divider" />

                        <div className="about-hero-highlights">
                            <div className="about-hero-highlight">
                                <span className="about-highlight-icon">
                                    <span>⌁</span>
                                </span>
                                <div>
                                    <strong>Connected</strong>
                                    <small>ESP32 integration</small>
                                </div>
                            </div>

                            <div className="about-hero-highlight">
                                <span className="about-highlight-icon">
                                    <span>◉</span>
                                </span>
                                <div>
                                    <strong>Data-driven</strong>
                                    <small>Sensor monitoring</small>
                                </div>
                            </div>

                            <div className="about-hero-highlight">
                                <span className="about-highlight-icon">
                                    <span>↗</span>
                                </span>
                                <div>
                                    <strong>Centralized</strong>
                                    <small>Web-based control</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="about-hero-visual" aria-hidden="true">
                        <div className="about-visual-glow" />

                        <div className="about-visual-orbit orbit-a" />
                        <div className="about-visual-orbit orbit-b" />

                        <div className="about-visual-plant">
                            <div className="about-plant-stem" />
                            <div className="about-plant-leaf leaf-a" />
                            <div className="about-plant-leaf leaf-b" />
                            <div className="about-plant-leaf leaf-c" />
                            <div className="about-plant-leaf leaf-d" />
                            <div className="about-plant-leaf leaf-e" />
                        </div>

                        <div className="about-floating-card about-float-top">
                            <span className="about-floating-icon">💧</span>
                            <div>
                                <small>WATER MONITORING</small>
                                <strong>Smart sensing</strong>
                            </div>
                            <span className="about-floating-check">✓</span>
                        </div>

                        <div className="about-floating-card about-float-bottom">
                            <span className="about-floating-icon">🌱</span>
                            <div>
                                <small>GROWTH SYSTEM</small>
                                <strong>Connected growing</strong>
                            </div>
                        </div>

                        <div className="about-visual-caption">
                            <span className="about-caption-dot" />
                            TECHNOLOGY MEETS NATURE
                        </div>
                    </div>
                </section>

                {/* INTRODUCTION */}
                <section className="about-intro-grid">
                    <article className="about-intro-card about-mission-card">
                        <div className="about-card-icon mission-icon">
                            <span>◎</span>
                        </div>

                        <span className="about-card-eyebrow">
                            OUR MISSION
                        </span>

                        <h2>
                            Simplifying hydroponic management.
                        </h2>

                        <p>
                            HydroControl aims to make hydroponic systems
                            easier to monitor and operate by bringing
                            connected sensors, pump controls, and system
                            information together in one interface.
                        </p>

                        <div className="about-card-bottom">
                            <span>01</span>
                            <span className="about-card-line" />
                            <span>MONITOR · CONTROL · REVIEW</span>
                        </div>
                    </article>

                    <article className="about-intro-card about-vision-card">
                        <div className="about-card-icon vision-icon">
                            <span>✳</span>
                        </div>

                        <span className="about-card-eyebrow">
                            OUR VISION
                        </span>

                        <h2>
                            Technology for more informed growing.
                        </h2>

                        <p>
                            We envision a growing environment where
                            accessible data and practical automation help
                            users understand system conditions and manage
                            their hydroponic equipment more effectively.
                        </p>

                        <div className="about-vision-note">
                            <span>🌿</span>
                            <div>
                                <strong>Grow with insight.</strong>
                                <small>
                                    Connected tools for modern growing.
                                </small>
                            </div>
                        </div>
                    </article>
                </section>

                {/* FEATURES */}
                <section
                    className="about-content-section"
                    id="about-features"
                >
                    <SectionHeading
                        eyebrow="WHAT THE PLATFORM OFFERS"
                        title="Everything in one growing space."
                        description="A unified interface for monitoring connected hardware, managing pumps, and reviewing important system information."
                    />

                    <div className="about-feature-grid">
                        {FEATURES.map((feature, index) => (
                            <article
                                className={`about-feature-card feature-${feature.color}`}
                                key={feature.title}
                            >
                                <div className="about-feature-top">
                                    <div className="about-feature-icon">
                                        {feature.icon}
                                    </div>

                                    <span className="about-feature-number">
                                        0{index + 1}
                                    </span>
                                </div>

                                <span className="about-feature-tag">
                                    {feature.tag}
                                </span>

                                <h3>{feature.title}</h3>

                                <p>{feature.description}</p>

                                <div className="about-feature-bottom">
                                    <span>PLATFORM MODULE</span>
                                    <span className="about-feature-arrow">
                                        ↗
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                {/* TECHNOLOGY */}
                <section
                    className="about-content-section"
                    id="about-technology"
                >
                    <SectionHeading
                        eyebrow="THE TECHNOLOGY"
                        title="Built with modern tools."
                        description="The platform combines frontend development, backend services, database storage, and embedded hardware."
                    />

                    <div className="about-tech-grid">
                        {TECHNOLOGIES.map((technology, index) => (
                            <article
                                className="about-tech-card"
                                key={technology.name}
                            >
                                <div className="about-tech-icon">
                                    {technology.icon}
                                </div>

                                <div className="about-tech-info">
                                    <strong>{technology.name}</strong>
                                    <span>{technology.description}</span>
                                </div>

                                <span className="about-tech-index">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                            </article>
                        ))}
                    </div>
                </section>

                {/* SYSTEM ARCHITECTURE */}
                <section className="about-architecture">
                    <div className="about-architecture-heading">
                        <div>
                            <span className="about-eyebrow">
                                HOW IT CONNECTS
                            </span>
                            <h2>From sensor to dashboard.</h2>
                            <p>
                                Sensor information and pump commands travel
                                through the connected system architecture.
                            </p>
                        </div>

                        <div className="about-architecture-symbol">
                            ⌘
                        </div>
                    </div>

                    <div className="about-flow">
                        <article className="about-flow-step">
                            <div className="about-flow-icon">📟</div>
                            <span className="about-flow-number">STEP 01</span>
                            <h3>Hardware</h3>
                            <p>
                                ESP32, water-level sensor, pH sensor,
                                and pump relays.
                            </p>
                        </article>

                        <div className="about-flow-connector">
                            <span>→</span>
                        </div>

                        <article className="about-flow-step">
                            <div className="about-flow-icon">🌐</div>
                            <span className="about-flow-number">STEP 02</span>
                            <h3>API Services</h3>
                            <p>
                                The backend receives sensor data and
                                processes authorized pump commands.
                            </p>
                        </article>

                        <div className="about-flow-connector">
                            <span>→</span>
                        </div>

                        <article className="about-flow-step">
                            <div className="about-flow-icon">🗄️</div>
                            <span className="about-flow-number">STEP 03</span>
                            <h3>Data Storage</h3>
                            <p>
                                Supabase stores supported sensor readings
                                and system records.
                            </p>
                        </article>

                        <div className="about-flow-connector">
                            <span>→</span>
                        </div>

                        <article className="about-flow-step">
                            <div className="about-flow-icon">🖥️</div>
                            <span className="about-flow-number">STEP 04</span>
                            <h3>Dashboard</h3>
                            <p>
                                The web interface presents available
                                readings and pump controls.
                            </p>
                        </article>
                    </div>
                </section>

                {/* SYSTEM INFORMATION */}
                <section className="about-system-card">
                    <div className="about-system-icon">⌘</div>

                    <div className="about-system-copy">
                        <span className="about-eyebrow">
                            SYSTEM INFORMATION
                        </span>
                        <h2>HydroControl Platform</h2>
                        <p>
                            The interface is designed to bring monitoring
                            and control features together. Actual device,
                            sensor, and database availability should be
                            verified through live system health checks.
                        </p>
                    </div>

                    <div className="about-system-meta">
                        <div>
                            <span>VERSION</span>
                            <strong>1.0.0</strong>
                        </div>

                        <div>
                            <span>RELEASE YEAR</span>
                            <strong>2026</strong>
                        </div>

                        <div>
                            <span>PLATFORM</span>
                            <strong>Web + IoT</strong>
                        </div>
                    </div>
                </section>

                {/* PROJECT */}
                <section className="about-project">
                    <div className="about-project-decoration">
                        <span>H</span>
                    </div>

                    <div className="about-project-content">
                        <span className="about-eyebrow">
                            ABOUT THE PROJECT
                        </span>

                        <h2>
                            A connected approach to hydroponic management.
                        </h2>

                        <p>
                            HydroControl brings together web application
                            development, embedded systems, sensor
                            integration, database services, and pump
                            control. The project explores how connected
                            technology can make hydroponic monitoring
                            and operation more accessible.
                        </p>
                    </div>

                    <div className="about-project-badge">
                        <span>🌱</span>
                        <strong>HydroControl</strong>
                        <small>SMART GROWING SYSTEM</small>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="about-footer">
                    <div className="about-footer-brand">
                        <span className="about-footer-logo">H</span>
                        <div>
                            <strong>HydroControl</strong>
                            <span>Smart hydroponic management</span>
                        </div>
                    </div>

                    <p>
                        Designed for connected growing and smarter
                        system management.
                    </p>

                    <span className="about-footer-copyright">
                        © 2026 HydroControl · v1.0.0
                    </span>
                </footer>
            </main>
        </div>
    );
}

export default About;
