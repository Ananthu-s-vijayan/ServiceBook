import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const popularServices = [
    {
        name: "Plumbing",
        description: "Fix leaks, pipes, and bathroom fittings.",
        icon: "🔧",
        search: "plumb",
    },
    {
        name: "Electrical",
        description: "Wiring, power backup, and lighting.",
        icon: "⚡",
        search: "electric",
    },
    {
        name: "AC Repair",
        description: "AC servicing, cleaning, and repairs.",
        icon: "❄️",
        search: "ac",
    },
    {
        name: "Home Cleaning",
        description: "Cleaning for kitchens and living spaces.",
        icon: "🧹",
        search: "clean",
    },
    {
        name: "Painting",
        description: "Interior and exterior painting.",
        icon: "🎨",
        search: "paint",
    },
    {
        name: "Carpentry",
        description: "Furniture assembly and woodwork.",
        icon: "🛠️",
        search: "carpent",
    },
];

function Home() {
    const [search, setSearch] = useState("");
    const [services, setServices] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const navigate = useNavigate();

    // Fetch services from the backend for autocomplete suggestions.
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await fetch(
                    "http://localhost:3000/api/services"
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Failed to load services"
                    );
                }

                setServices(
                    Array.isArray(result.data) ? result.data : []
                );
            } catch (error) {
                console.error(
                    "Failed to load service suggestions:",
                    error
                );
            }
        };

        fetchServices();
    }, []);

    // Match the search text against service names and descriptions.
    const matchingServices = services
        .filter((service) => {
            const query = search.trim().toLowerCase();

            return (
                query.length > 0 &&
                (
                    service.title?.toLowerCase().includes(query) ||
                    service.shortDescription
                        ?.toLowerCase()
                        .includes(query)
                )
            );
        })
        .slice(0, 6);

    // Navigate to the catalog when a suggestion is selected.
    const selectService = (service) => {
        setSearch(service.title);
        setShowSuggestions(false);

        navigate(
            `/services?search=${encodeURIComponent(service.title)}`
        );
    };

    const handleSearch = (event) => {
        event.preventDefault();

        const query = search.trim();

        setShowSuggestions(false);

        if (query) {
            navigate(
                `/services?search=${encodeURIComponent(query)}`
            );
        } else {
            navigate("/services");
        }
    };

    const openCategory = (category) => {
        navigate(
            `/services?search=${encodeURIComponent(category)}`
        );
    };

    return (
        <div className="home-page">
            <header className="home-header">
                <button
                    className="home-logo"
                    onClick={() => navigate("/")}
                    aria-label="ServiceBook home"
                >
                    <span className="home-logo-icon">🔧</span>
                    <span>
                        Service
                        <span className="home-logo-blue">Book</span>
                    </span>
                </button>

                <nav
                    className="home-nav"
                    aria-label="Main navigation"
                >
                    <button
                        className="active"
                        onClick={() => navigate("/")}
                    >
                        Home
                    </button>

                    <button onClick={() => navigate("/services")}>
                        Services
                    </button>

                    <button
                        onClick={() =>
                            document
                                .getElementById("about")
                                ?.scrollIntoView({
                                    behavior: "smooth",
                                })
                        }
                    >
                        About
                    </button>

                    <button
                        onClick={() =>
                            document
                                .getElementById("contact")
                                ?.scrollIntoView({
                                    behavior: "smooth",
                                })
                        }
                    >
                        Contact
                    </button>
                </nav>
            </header>

            <main>
                <section className="home-hero">
                    <div className="home-hero-content">
                        <span className="home-eyebrow">
                            HOME SERVICES, MADE SIMPLE
                        </span>

                        <h1>
                            Book Trusted
                            <span> Service Professionals</span>
                            Near You
                        </h1>

                        <p>
                            Find and book reliable service providers for
                            your home and daily needs. A simpler way to
                            find the services you need.
                        </p>

                        <form
                            className="home-search"
                            onSubmit={handleSearch}
                        >
                            <span aria-hidden="true">⌕</span>

                            <input
                                type="search"
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => {
                                    setShowSuggestions(true);
                                }}
                                onBlur={() => {
                                    setTimeout(() => {
                                        setShowSuggestions(false);
                                    }, 150);
                                }}
                                placeholder="Search services (e.g. plumber, electrician...)"
                                aria-label="Search services"
                                autoComplete="off"
                                aria-expanded={
                                    showSuggestions && Boolean(search.trim())
                                }
                            />

                            <button type="submit">
                                Search
                            </button>

                            {showSuggestions && search.trim() && (
                                <div className="home-search-suggestions">
                                    {matchingServices.length > 0 ? (
                                        matchingServices.map((service) => (
                                            <button
                                                type="button"
                                                key={service._id}
                                                className="home-search-suggestion"
                                                onMouseDown={(event) => {
                                                    event.preventDefault();
                                                }}
                                                onClick={() => {
                                                    selectService(service);
                                                }}
                                            >
                                                <strong>
                                                    {service.title}
                                                </strong>

                                                {service.shortDescription && (
                                                    <small>
                                                        {service.shortDescription}
                                                    </small>
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="home-search-no-results">
                                            No matching services found
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>

                        <p className="home-popular-searches">
                            Popular: AC Repair, Deep Cleaning, Leak Fixing,
                            Electrician
                        </p>
                    </div>

                    <div
                        className="home-hero-visual"
                        aria-hidden="true"
                    >
                        <div className="home-visual-circle">
                            <span>🔧</span>
                        </div>

                        <div className="home-floating-card home-card-top">
                            <span>🟢</span>
                            <div>
                                <strong>Quick Repair</strong>
                                <small>
                                    Explore available services
                                </small>
                            </div>
                        </div>

                        <div className="home-floating-card home-card-bottom">
                            <span>✓</span>
                            <div>
                                <strong>Easy Booking</strong>
                                <small>
                                    Find a service that fits your needs
                                </small>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="home-services-section">
                    <div className="home-section-heading">
                        <div>
                            <h2>Popular Services</h2>
                            <p>
                                Explore our range of home services
                            </p>
                        </div>

                        <button
                            className="home-view-all"
                            onClick={() => navigate("/services")}
                        >
                            View All Services →
                        </button>
                    </div>

                    <div className="home-service-grid">
                        {popularServices.map((service) => (
                            <button
                                className="home-service-card"
                                key={service.name}
                                onClick={() =>
                                    openCategory(service.search)
                                }
                            >
                                <span className="home-service-icon">
                                    {service.icon}
                                </span>

                                <strong>{service.name}</strong>

                                <span className="home-service-description">
                                    {service.description}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                <section
                    className="home-process-section"
                    id="how-it-works"
                >
                    <span className="home-eyebrow">
                        THREE SIMPLE STEPS
                    </span>

                    <h2>
                        Reliable Services at Your Fingertips
                    </h2>

                    <p className="home-process-subtitle">
                        Find the service you need and get started in a
                        few simple steps.
                    </p>

                    <div className="home-process-grid">
                        <article className="home-process-card">
                            <span className="home-step-number">1</span>
                            <h3>Choose a Service</h3>
                            <p>
                                Explore the catalog and select the service
                                that matches your needs.
                            </p>
                        </article>

                        <article className="home-process-card">
                            <span className="home-step-number">2</span>
                            <h3>Review Service Details</h3>
                            <p>
                                Check the available service information
                                before proceeding.
                            </p>
                        </article>

                        <article className="home-process-card">
                            <span className="home-step-number">3</span>
                            <h3>Get Started</h3>
                            <p>
                                Continue to the appropriate next step for
                                your selected service.
                            </p>
                        </article>
                    </div>
                </section>

                <section className="home-cta">
                    <span className="home-cta-label">
                        GET STARTED TODAY
                    </span>

                    <h2>
                        Ready to take care of your home?
                    </h2>

                    <p>
                        Explore available services and find the right
                        option for your needs.
                    </p>

                    <button onClick={() => navigate("/services")}>
                        Explore Services
                    </button>
                </section>
            </main>

            <footer className="home-footer">
                <div className="home-footer-main">
                    <div className="home-footer-brand">
                        <h2>
                            Service<span>Book</span>
                        </h2>

                        <p>
                            Find the home services you need in one place.
                            Explore the catalog to get started.
                        </p>
                    </div>

                    <div className="home-footer-column">
                        <h3>SERVICES</h3>

                        <button onClick={() => navigate("/services")}>
                            Browse Services
                        </button>
                    </div>

                    <div className="home-footer-column">
                        <h3>COMPANY</h3>

                        <button
                            onClick={() =>
                                document
                                    .getElementById("about")
                                    ?.scrollIntoView({
                                        behavior: "smooth",
                                    })
                            }
                        >
                            About Us
                        </button>

                        <button
                            onClick={() =>
                                document
                                    .getElementById("contact")
                                    ?.scrollIntoView({
                                        behavior: "smooth",
                                    })
                            }
                        >
                            Contact Support
                        </button>
                    </div>
                </div>

                <div className="home-footer-bottom">
                    <span>© ServiceBook</span>

                    <button onClick={() => navigate("/services")}>
                        Explore Services
                    </button>
                </div>
            </footer>
        </div>
    );
}

export default Home;