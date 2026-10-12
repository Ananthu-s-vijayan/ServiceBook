import { NavLink } from "react-router-dom";

import "./AdminSidebar.css";

function AdminSidebar() {
    return (
        <aside className="admin-sidebar">

            <div className="admin-sidebar-brand">

                <div className="admin-sidebar-logo">
                    🛠
                </div>

                <div>
                    <strong>ServiceBook</strong>
                    <span>ADMIN CONSOLE</span>
                </div>

            </div>


            <div className="admin-user">

                <div className="admin-user-avatar">
                    AM
                </div>

                <div className="admin-user-info">

                    <strong>Alex Morgan</strong>

                    <span>SUPER ADMIN</span>

                </div>

            </div>


            <nav className="admin-sidebar-navigation">

                {/* Main */}

                <NavLink
                    to="/admin/dashboard"
                    className={({ isActive }) =>
                        `admin-nav-item ${
                            isActive ? "active" : ""
                        }`
                    }
                >
                    <span>▦</span>
                    <span>Dashboard</span>
                </NavLink>


                {/* Catalog */}

                <div className="admin-nav-section-title">
                    CATALOG
                </div>

                <NavLink
                    to="/admin/categories"
                    className={({ isActive }) =>
                        `admin-nav-item ${
                            isActive ? "active" : ""
                        }`
                    }
                >
                    <span>◈</span>
                    <span>Categories</span>
                </NavLink>


                <NavLink
                    to="/admin/services"
                    className={({ isActive }) =>
                        `admin-nav-item ${
                            isActive ? "active" : ""
                        }`
                    }
                >
                    <span>⚒</span>
                    <span>Services</span>
                </NavLink>


                <NavLink
                    to="/admin/availability"
                    className={({ isActive }) =>
                        `admin-nav-item ${
                            isActive ? "active" : ""
                        }`
                    }
                >
                    <span>☷</span>
                    <span>Availability</span>
                </NavLink>


                {/* Operations */}

                <div className="admin-nav-section-title">
                    OPERATIONS
                </div>

                <NavLink
                    to="/admin/bookings"
                    className={({ isActive }) =>
                        `admin-nav-item ${
                            isActive ? "active" : ""
                        }`
                    }
                >
                    <span>▣</span>
                    <span>Bookings</span>
                </NavLink>


                {/* Management */}

                <div className="admin-nav-section-title">
                    MANAGEMENT
                </div>

                <NavLink
                    to="/admin/users"
                    className={({ isActive }) =>
                        `admin-nav-item ${
                            isActive ? "active" : ""
                        }`
                    }
                >
                    <span>♙</span>
                    <span>Users</span>
                </NavLink>


                {/* Reporting */}

                <div className="admin-nav-section-title">
                    REPORTING
                </div>

                <NavLink
                    to="/admin/sales"
                    className={({ isActive }) =>
                        `admin-nav-item ${
                            isActive ? "active" : ""
                        }`
                    }
                >
                    <span>▤</span>
                    <span>Sales Report</span>
                </NavLink>


                {/* Marketing */}

                <div className="admin-nav-section-title">
                    MARKETING
                </div>

                <NavLink
                    to="/admin/coupons"
                    className={({ isActive }) =>
                        `admin-nav-item ${
                            isActive ? "active" : ""
                        }`
                    }
                >
                    <span>◇</span>
                    <span>Coupons & Offers</span>
                </NavLink>

            </nav>


            <button className="admin-logout">

                <span>↪</span>

                <span>Log Out</span>

            </button>

        </aside>
    );
}

export default AdminSidebar;