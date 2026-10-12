import { Outlet } from "react-router-dom";

import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";


import "./AdminLayout.css";

function AdminLayout() {
    return (
        <div className="admin-layout">

            <AdminNavbar />

            <div className="admin-layout-body">

                <AdminSidebar />

                <main className="admin-main-content">
                    <Outlet />
                </main>

            </div>

        </div>
    );
}

export default AdminLayout;