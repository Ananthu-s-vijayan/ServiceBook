import { useEffect, useState } from "react";
import { handleAdminAuthError } from "../../utils/adminAuth";
import "./AvailabilityManagement.css";




function AvailabilityManagement() {
    const [services, setServices] = useState([]);
    const [selectedServiceId, setSelectedServiceId] = useState("");

    const [availabilitySlots,setAvailabilitySlots]=useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const [professionals, setProfessionals] = useState([]);
    const [loadingProfessionals, setLoadingProfessionals] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");

    const [showForm, setShowForm] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        serviceId: "",
        professionalId: "",
        date: "",
        startTime: "",
        endTime: "",
        capacity: "1"
    });

    useEffect(() => {
        const fetchServices = async () => {
            try {
                setLoading(true);
                setError("");

                const token = localStorage.getItem("token");

                if (!token) {
                    throw new Error(
                        "Authentication token is missing. Please log in again."
                    );
                }

                const response = await fetch(
                    "http://localhost:3000/api/admin/services",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Failed to load services."
                    );
                }

                const loadedServices = data.data || [];

                setServices(loadedServices);

                if (loadedServices.length > 0) {
                    const defaultServiceId = loadedServices[0]._id;

                    setSelectedServiceId(defaultServiceId);

                    //Fetch availability for the initially selected service.
                    await fetchAvailabilitySlots(defaultServiceId);
                }
            } catch (error) {
                console.error(
                    "Availability services fetch error:",
                    error
                );

                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, []);



    const fetchProfessionals = async (serviceId) => {
    if (!serviceId) {
        setProfessionals([]);
        return;
    }

    try {
        setLoadingProfessionals(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
            throw new Error(
                "Authentication token is missing. Please log in again."
            );
        }

        const response = await fetch(
            `http://localhost:3000/api/admin/professionals?serviceId=${serviceId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to load professionals."
            );
        }

        setProfessionals(data.data || []);
    } catch (error) {
        console.error("Professionals fetch error:", error);
        setProfessionals([]);
        setError(error.message);
    } finally {
        setLoadingProfessionals(false);
    }
};

// Fetch availability slots for the selected service.
async function fetchAvailabilitySlots(serviceId) {
    
 {
    if (!serviceId) {
        setAvailabilitySlots([]);
        return;
    }

    try {
        setLoadingSlots(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
            throw new Error(
                "Authentication token is missing. Please log in again."
            );
        }

        const response = await fetch(
            `http://localhost:3000/api/admin/availability/service/${serviceId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if(response.status === 401){
            handleAdminAuthError(response.status);
            return;
        }
        if(!response.ok){
            throw new Error(
                data.message || "Failed to load availability slots."
            );
        }

        setAvailabilitySlots(data.data || []);
    } catch (error) {
        console.error("Availability fetch error:", error);
        setAvailabilitySlots([]);
        setError(error.message);
    } finally {
        setLoadingSlots(false);
    }
}}


    const handleFormChange = (event) => {
        const { name, value } = event.target;

        setForm((previousForm) => ({
            ...previousForm,
            [name]: value
        }));
    };

    // Submit the form and create an availability slot through the backend API.
const handleSaveAvailability = async (event) => {
    event.preventDefault();

    try {
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
            throw new Error(
                "Authentication token is missing. Please log in again."
            );
        }

        if (form.endTime <= form.startTime) {
            throw new Error(
                "End time must be later than start time."
            );
        }

        const selectedService = services.find(
            (service) => service._id === form.serviceId
        );

        if (!selectedService) {
            throw new Error("Please select a valid service.");
        }

        const url = editingSlot
    ? `http://localhost:3000/api/admin/availability/${editingSlot._id}`
    : "http://localhost:3000/api/admin/availability";

const response = await fetch(url, {
    method: editingSlot ? "PUT" : "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
        serviceId: form.serviceId,
        professionalId: form.professionalId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        slotType: selectedService.durationType,
        capacity: Number(form.capacity)
    })
});

        const data = await response.json();

        if(response.status === 401){
            handleAdminAuthError(response.status);
            return;
        }

        if(!response.ok){
            throw new Error(
                data.message || "Failed to save availability."
            );
        }

        await fetchAvailabilitySlots(form.serviceId);

        alert(
            editingSlot
                 ? "Availability updated successfully!"
                 : "Availability created successfully!"
        );

        closeForm();
    } catch (error) {
        console.error("Create availability error:", error);
        setError(error.message);
    }
};

// Update an availability slot's status between available and paused.
const handleStatusChange = async (slot) => {
    try {
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
            throw new Error(
                "Authentication token is missing. Please log in again."
            );
        }

        const newStatus =
            slot.status === "paused" ? "available" : "paused";

        const response = await fetch(
            `http://localhost:3000/api/admin/availability/${slot._id}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to update availability status."
            );
        }

        const serviceId =
            typeof slot.serviceId === "object"
                ? slot.serviceId?._id
                : slot.serviceId;

        await fetchAvailabilitySlots(serviceId);

        alert(
            newStatus === "paused"
                ? "Availability paused successfully."
                : "Availability activated successfully."
        );
    } catch (error) {
        console.error("Availability status update error:", error);
        setError(error.message);
    }
};

    const openCreateForm = () => {
    setError("");
    setEditingSlot(null);

    setForm({
        serviceId: selectedServiceId,
        professionalId: "",
        date: "",
        startTime: "",
        endTime: "",
        capacity: "1"
    });

    // Load professionals for the preselected service.
    fetchProfessionals(selectedServiceId);

    setShowForm(true);
};

// Open the existing form with the selected slot's values.
const openEditForm = (slot) => {
    setError("");
    setEditingSlot(slot);

    const serviceId =
        typeof slot.serviceId === "object"
            ? slot.serviceId?._id
            : slot.serviceId;

    const professionalId =
        typeof slot.professionalId === "object"
            ? slot.professionalId?._id
            : slot.professionalId;

    setForm({
        serviceId: serviceId || "",
        professionalId: professionalId || "",
        date: slot.date
            ? new Date(slot.date).toISOString().slice(0, 10)
            : "",
        startTime: slot.startTime || "",
        endTime: slot.endTime || "",
        capacity: String(slot.capacity ?? 1)
    });

    fetchProfessionals(serviceId);
    setShowForm(true);
};

    const closeForm = () => {
        setShowForm(false);
        setEditingSlot(null);
    };
    // Calculate summary counts from the loaded availability records.
const totalSlots = availabilitySlots.length;

const availableSlots = availabilitySlots.filter(
    (slot) => slot.status === "available"
).length;

const pausedSlots = availabilitySlots.filter(
    (slot) => slot.status === "paused"
).length;

const fullSlots = availabilitySlots.filter(
    (slot) => slot.status === "full"
).length;

// Filter availability records by search term and selected status.
const filteredSlots = availabilitySlots.filter((slot) => {
    const serviceId =
        typeof slot.serviceId === "object"
            ? slot.serviceId?._id
            : slot.serviceId;

    const service = services.find(
        (item) => item._id === serviceId
    );

    const professionalName =
        typeof slot.professionalId === "object"
            ? slot.professionalId?.name || ""
            : "";

    const serviceName = service?.title || "";

    const searchValue = searchTerm.trim().toLowerCase();

    const matchesSearch =
        serviceName.toLowerCase().includes(searchValue) ||
        professionalName.toLowerCase().includes(searchValue);

    const matchesStatus =
        selectedStatus === "all" ||
        (slot.status || "available") === selectedStatus;

    return matchesSearch && matchesStatus;
});

    if (loading) {
        return (
            <div className="admin-availability-page">
                <p>Loading availability management...</p>
            </div>
        );
    }

    if (error && services.length === 0) {
        return (
            <div className="admin-availability-page">
                <p role="alert" className="availability-error">
                    {error}
                </p>
            </div>
        );
    }

    return (
        <div className="admin-availability-page">
            <header className="admin-availability-header">
                <div>
                    <h1>Availability Management</h1>
                    <p>
                        Manage service availability and booking slots.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreateForm}
                    disabled={services.length === 0}
                >
                    Add Availability
                </button>
            </header>

            {error && (
                <p role="alert" className="availability-error">
                    {error}
                </p>
            )}

            <section className="availability-summary-grid">
                <article className="availability-summary-card">
                    <p>TOTAL SLOTS</p>
                    <h2>{totalSlots}</h2>
                </article>

                <article className="availability-summary-card">
                    <p>AVAILABLE</p>
                    <h2>{availableSlots}</h2>
                </article>

                <article className="availability-summary-card">
                    <p>PAUSED</p>
                    <h2>{pausedSlots}</h2>
                </article>

                <article className="availability-summary-card">
                    <p>FULL</p>
                    <h2>{fullSlots}</h2>
                </article>
            </section>

            {showForm && (
                <section className="availability-form-panel">
                    <div className="availability-form-header">
                        <h2>
                            {editingSlot
                                ? "Edit Availability"
                                : "Add Availability"}
                        </h2>

                        <button
                            type="button"
                            className="availability-secondary-button"
                            onClick={closeForm}
                        >
                            Cancel
                        </button>
                    </div>

                    <form
                        onSubmit={handleSaveAvailability}
                    >
                        <div className="availability-form-grid">
                            <div className="availability-form-field">
                                <label htmlFor="availability-service">
                                    Service
                                </label>

                                <select
                                    id="availability-service"
                                    name="serviceId"
                                    value={form.serviceId}
                                    onChange={(event)=>{
                                        const serviceId = event.target.value;

                                        setForm((previousForm)=>({
                                            ...previousForm,
                                            serviceId,
                                            professionalId: ""
                                        }));

                                        fetchProfessionals(serviceId);
                                    }}
                                    required
                                >
                                    <option value="">
                                        Select a service
                                    </option>

                                    {services
                                        .filter(
                                            (service) => service.isActive
                                        )
                                        .map((service) => (
                                            <option
                                                key={service._id}
                                                value={service._id}
                                            >
                                                {service.title}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="availability-form-field">
                                <label htmlFor="availability-professional">
                                    Professional
                                </label>

                                <select
                                    id="availability-professional"
                                    name="professionalId"
                                    value={form.professionalId}
                                    onChange={handleFormChange}
                                    required
                                    disabled={!form.serviceId || loadingProfessionals}
                                >
                                    <option value="">
                                        {loadingProfessionals
                                           ? "Loading professionals..."
                                           : professionals.length === 0
                                               ? "No professionals available"
                                               : "Select a professional"}
                                    </option>

                                    {professionals.map((professional)=>(
                                        <option
                                            key={professional._id}
                                            value={professional._id}
                                        >
                                            {professional.name}
                                        </option>
                                    ))}
                                </select>

                               
                            </div>

                            <div className="availability-form-field">
                                <label htmlFor="availability-date">
                                    Date
                                </label>

                                <input
                                    id="availability-date"
                                    name="date"
                                    type="date"
                                    value={form.date}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>

                            <div className="availability-form-field">
                                <label htmlFor="availability-start">
                                    Start Time
                                </label>

                                <input
                                    id="availability-start"
                                    name="startTime"
                                    type="time"
                                    value={form.startTime}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>

                            <div className="availability-form-field">
                                <label htmlFor="availability-end">
                                    End Time
                                </label>

                                <input
                                    id="availability-end"
                                    name="endTime"
                                    type="time"
                                    value={form.endTime}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>

                            <div className="availability-form-field">
                                <label htmlFor="availability-capacity">
                                    Capacity
                                </label>

                                <input
                                    id="availability-capacity"
                                    name="capacity"
                                    type="number"
                                    min="1"
                                    value={form.capacity}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="availability-form-actions">
                            <button
                                type="button"
                                className="availability-secondary-button"
                                onClick={closeForm}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="availability-primary-button"
                                disabled={loadingProfessionals || !form.professionalId}
                            >
                                Save Availability
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <section className="availability-content-panel">
                <div className="availability-toolbar">
                    <input
                        type="search"
                        placeholder="Search services..."
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(event.target.value)
                        }
                        aria-label="Search services"
                    />

                    <select
                        value={selectedServiceId}
                        onChange={(event) =>{
                            const serviceId = event.target.value;

                            setSelectedServiceId(serviceId);

                            if(serviceId){
                                fetchAvailabilitySlots( serviceId);
                            }else{
                                setAvailabilitySlots([]);
                                setLoadingSlots(false);
                            }
                        }}
                        aria-label="Filter by service"
                    >
                        <option value="">All Services</option>

                        {services.map((service) => (
                            <option
                                key={service._id}
                                value={service._id}
                            >
                                {service.title}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(event) =>
                            setSelectedStatus(event.target.value)
                        }
                        aria-label="Filter by status"
                    >
                        <option value="all">All Statuses</option>
                        <option value="available">Available</option>
                        <option value="paused">Paused</option>
                        <option value="full">Full</option>
                    </select>
                </div>

                <div className="availability-table-wrapper">
                    <table className="availability-table">
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>Professional</th>
                                <th>Date</th>
                                <th>Operating Hours</th>
                                <th>Capacity</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
 
<tbody>
    {loadingSlots ? (
        <tr>
            <td colSpan="7" className="availability-empty-state">
                Loading availability records...
            </td>
        </tr>
    ) : filteredSlots.length === 0 ? (
        <tr>
            <td colSpan="7" className="availability-empty-state">
                {searchTerm.trim() || selectedStatus !== "all"
                 ? "No availability records match your search or selected status."
                 : "No availability records found."}
            </td>
        </tr>
    ) : (
        filteredSlots.map((slot) => {
            const serviceId =
                typeof slot.serviceId === "object"
                    ? slot.serviceId?._id
                    : slot.serviceId;

            const service = services.find(
                (item) => item._id === serviceId
            );

            const professionalName =
                typeof slot.professionalId === "object"
                    ? slot.professionalId?.name
                    : professionals.find(
                        (item)=> item._id === slot.professionalId
                    )?.name;

          
            return (
                <tr key={slot._id}>
                    <td>{service?.title || "Unknown service"}</td>
                    <td>{professionalName || "Unknown professional"}</td>
                    <td>
                        {slot.date
                            ? new Date(slot.date).toLocaleDateString()
                            : "—"}
                    </td>
                    <td>
                        {slot.startTime} – {slot.endTime}
                    </td>
                    <td>
                        {`${slot.bookedCount ?? 0} / ${slot.capacity}`}
                    </td>
                    <td>{slot.status || "available"}</td>
                    <td>
                        <button
                            type="button"
                            onClick={()=> openEditForm(slot)}
                            >
                                Edit

                        </button>

                        {slot.status !== "full" && (
                            <button
                            type="button"
                            onClick={()=>handleStatusChange(slot)}
                            >
                                {slot.status === "paused" ? "Activate" : "pause"}
                            </button>
                        )}
                    </td>
                </tr>
            );
        })
    )}
</tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

export default AvailabilityManagement;