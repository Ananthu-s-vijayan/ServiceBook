import "./AdminNavbar.css";

function AdminNavbar() {
    return (
        <header className="admin-navbar">

            <div className="admin-navbar-brand">

                <div className="admin-logo">
                    🛠
                </div>

                <span>ServiceBook</span>

            </div>

            

            <div className="admin-navbar-profile">
                <div className="admin-profile-circle">
                    AM
                </div>
            </div>

        </header>
    );
}

export default AdminNavbar;