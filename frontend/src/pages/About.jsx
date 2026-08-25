import { useState } from "react";

import Sidebar from "../components/Navbar";

import "../css/about.css";

function About() {

    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="about-page">

            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            <main className="about-main">

                {/* =====================================================
                    HEADER
                ====================================================== */}

                <header className="about-header">

                    <div className="about-header-left">

                        <button
                            className="about-menu-button"
                            onClick={() => setSidebarOpen(true)}
                        >
                            ☰
                        </button>

                        <div>
                            <h1>About HydroControl</h1>
                        </div>

                    </div>

                    <div className="about-header-status">
                        <span></span>
                        SYSTEM ONLINE
                    </div>

                </header>


                {/* =====================================================
                    HERO
                ====================================================== */}

                <section className="about-hero">

                    <div className="about-hero-content">

                        <div className="about-logo">

                            <div className="about-logo-icon">
                                🌱
                            </div>

                        </div>

                        <div className="about-hero-text">

                            <span className="about-label">
                                SMART HYDROPONIC MANAGEMENT
                            </span>

                            <h2>
                                HydroControl
                            </h2>

                            <p>
                                A smart hydroponic monitoring and automation
                                platform designed to help growers monitor
                                water conditions, nutrient levels, pH,
                                pumps, sensors, and system activity from
                                one centralized dashboard.
                            </p>

                            <div className="about-version">
                                <span>
                                    VERSION
                                </span>

                                <strong>
                                    1.0.0
                                </strong>
                            </div>

                        </div>

                    </div>

                    <div className="hero-decoration">

                        <div className="orbit orbit-one"></div>
                        <div className="orbit orbit-two"></div>
                        <div className="orbit orbit-three"></div>

                        <div className="hero-plant">
                            🌿
                        </div>

                    </div>

                </section>


                {/* =====================================================
                    PLATFORM OVERVIEW
                ====================================================== */}

                <section className="about-grid">

                    <div className="about-panel">

                        <div className="about-panel-header">

                            <div className="about-panel-icon">
                                🎯
                            </div>

                            <div>

                                <span className="about-panel-label">
                                    PURPOSE
                                </span>

                                <h2>
                                    Our Mission
                                </h2>

                            </div>

                        </div>

                        <p className="about-description">
                            HydroControl aims to make hydroponic farming
                            easier to manage by combining real-time
                            monitoring, automated control, and clear
                            system information into a single interface.
                        </p>

                        <p className="about-description">
                            The platform helps growers make informed
                            decisions by presenting important environmental
                            and hardware data in an organized and
                            accessible dashboard.
                        </p>

                    </div>


                    <div className="about-panel">

                        <div className="about-panel-header">

                            <div className="about-panel-icon">
                                💡
                            </div>

                            <div>

                                <span className="about-panel-label">
                                    VISION
                                </span>

                                <h2>
                                    Smart Agriculture
                                </h2>

                            </div>

                        </div>

                        <p className="about-description">
                            Our vision is to support modern agriculture
                            through connected technology, intelligent
                            automation, and reliable monitoring systems.
                        </p>

                        <div className="vision-highlight">

                            <span>
                                🌱
                            </span>

                            <div>
                                <strong>
                                    Grow Smarter
                                </strong>

                                <small>
                                    Monitor • Control • Optimize
                                </small>
                            </div>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    FEATURES
                ====================================================== */}

                <section className="about-panel features-panel">

                    <div className="about-panel-header">

                        <div className="about-panel-icon">
                            ✨
                        </div>

                        <div>

                            <span className="about-panel-label">
                                PLATFORM
                            </span>

                            <h2>
                                HydroControl Features
                            </h2>

                        </div>

                    </div>


                    <div className="feature-grid">

                        <div className="feature-card">

                            <div className="feature-icon">
                                💧
                            </div>

                            <div>

                                <strong>
                                    Water Monitoring
                                </strong>

                                <span>
                                    Track reservoir level,
                                    temperature, and flow rate.
                                </span>

                            </div>

                        </div>


                        <div className="feature-card">

                            <div className="feature-icon">
                                🧪
                            </div>

                            <div>

                                <strong>
                                    Nutrient Control
                                </strong>

                                <span>
                                    Monitor and manage nutrient
                                    concentrations.
                                </span>

                            </div>

                        </div>


                        <div className="feature-card">

                            <div className="feature-icon">
                                ⚗️
                            </div>

                            <div>

                                <strong>
                                    pH Control
                                </strong>

                                <span>
                                    Monitor pH values and maintain
                                    suitable growing conditions.
                                </span>

                            </div>

                        </div>


                        <div className="feature-card">

                            <div className="feature-icon">
                                ⚙️
                            </div>

                            <div>

                                <strong>
                                    Pump Automation
                                </strong>

                                <span>
                                    Control pumps and manage
                                    automated circulation.
                                </span>

                            </div>

                        </div>


                        <div className="feature-card">

                            <div className="feature-icon">
                                📡
                            </div>

                            <div>

                                <strong>
                                    ESP32 Integration
                                </strong>

                                <span>
                                    Connect sensors and controllers
                                    through an ESP32 device.
                                </span>

                            </div>

                        </div>


                        <div className="feature-card">

                            <div className="feature-icon">
                                📊
                            </div>

                            <div>

                                <strong>
                                    System Analytics
                                </strong>

                                <span>
                                    Review readings, events,
                                    and system activity.
                                </span>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    TECHNOLOGY STACK
                ====================================================== */}

                <section className="about-panel">

                    <div className="about-panel-header">

                        <div className="about-panel-icon">
                            💻
                        </div>

                        <div>

                            <span className="about-panel-label">
                                TECHNOLOGY
                            </span>

                            <h2>
                                Built With
                            </h2>

                        </div>

                    </div>


                    <div className="technology-grid">

                        <div className="technology-card">

                            <div className="technology-icon">
                                ⚛️
                            </div>

                            <strong>
                                React
                            </strong>

                            <span>
                                User Interface
                            </span>

                        </div>


                        <div className="technology-card">

                            <div className="technology-icon">
                                🟨
                            </div>

                            <strong>
                                JavaScript
                            </strong>

                            <span>
                                Application Logic
                            </span>

                        </div>


                        <div className="technology-card">

                            <div className="technology-icon">
                                🎨
                            </div>

                            <strong>
                                CSS3
                            </strong>

                            <span>
                                Interface Design
                            </span>

                        </div>


                        <div className="technology-card">

                            <div className="technology-icon">
                                📡
                            </div>

                            <strong>
                                ESP32
                            </strong>

                            <span>
                                Hardware Controller
                            </span>

                        </div>


                        <div className="technology-card">

                            <div className="technology-icon">
                                🗄️
                            </div>

                            <strong>
                                Database
                            </strong>

                            <span>
                                System Data
                            </span>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    SYSTEM STATUS
                ====================================================== */}

                <section className="about-status-panel">

                    <div className="status-main">

                        <div className="status-icon">
                            ✓
                        </div>

                        <div>

                            <span>
                                SYSTEM STATUS
                            </span>

                            <strong>
                                All Systems Operational
                            </strong>

                        </div>

                    </div>


                    <div className="status-items">

                        <div>
                            <i></i>
                            Dashboard
                        </div>

                        <div>
                            <i></i>
                            ESP32
                        </div>

                        <div>
                            <i></i>
                            Sensors
                        </div>

                        <div>
                            <i></i>
                            Database
                        </div>

                    </div>

                </section>


                {/* =====================================================
                    DEVELOPER
                ====================================================== */}

                <section className="about-panel developer-panel">

                    <div className="developer-content">

                        <div className="developer-avatar">
                            👨‍💻
                        </div>

                        <div className="developer-info">

                            <span className="about-panel-label">
                                PROJECT
                            </span>

                            <h2>
                                HydroControl Development
                            </h2>

                            <p>
                                HydroControl is designed as a modern
                                technology platform for monitoring and
                                controlling a hydroponic growing system.
                                The project combines web development,
                                embedded systems, sensors, and automation.
                            </p>

                        </div>

                        <div className="developer-version">

                            <span>
                                CURRENT VERSION
                            </span>

                            <strong>
                                v1.0.0
                            </strong>

                            <small>
                                © 2026
                            </small>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    FOOTER
                ====================================================== */}

                <footer className="about-footer">

                    <span>
                        © 2026 HydroControl
                    </span>

                    <span>
                        Smart Hydroponic Monitoring & Control System
                    </span>

                    <span>
                        System Status: Online
                    </span>

                </footer>

            </main>

        </div>
    );
}

export default About;