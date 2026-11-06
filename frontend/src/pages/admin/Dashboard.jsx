import "./Dashboard.css";

function Dashboard() {
    return (
        <div className="admin-dashboard">
            <div className="admin-dashboard-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Welcome to your ServiceBook admin console.</p>
                </div>
            </div>

            <section className="admin-dashboard-welcome">
                <h2>Welcome to ServiceBook</h2>
                <p>
                    Manage your service catalog, availability, and bookings
                    from one place.
                </p>
            </section>

            <section className="admin-dashboard-sections">
                <h2>Management Overview</h2>

                <div className="admin-dashboard-grid">
                    <div className="admin-dashboard-card">
                        <h3>Categories</h3>
                        <p>Organize the services offered on ServiceBook.</p>
                    </div>

                    <div className="admin-dashboard-card">
                        <h3>Services</h3>
                        <p>Create and manage your service catalog.</p>
                    </div>

                    <div className="admin-dashboard-card">
                        <h3>Availability</h3>
                        <p>Manage professional availability and time slots.</p>
                    </div>

                    <div className="admin-dashboard-card">
                        <h3>Bookings</h3>
                        <p>Review and manage customer bookings.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Dashboard;