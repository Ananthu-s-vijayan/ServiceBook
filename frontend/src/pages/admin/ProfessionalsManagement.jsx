import { useEffect, useState } from "react";
import { handleAdminAuthError } from "../../utils/adminAuth";
import "./ProfessionalsManagement.css";

const API_BASE_URL = "http://localhost:3000/api/admin";

const DAYS_OF_WEEK = [
{ value: 0, label: "Sunday" },
{ value: 1, label: "Monday" },
{ value: 2, label: "Tuesday" },
{ value: 3, label: "Wednesday" },
{ value: 4, label: "Thursday" },
{ value: 5, label: "Friday" },
{ value: 6, label: "Saturday" }
];

// Creates an initial schedule with all days marked as non-working.
// The admin can enable only the days this professional actually works.
const createEmptySchedule = () =>
DAYS_OF_WEEK.map(({ value }) => ({
dayOfWeek: value,
startTime: "09:00",
endTime: "18:00",
breaks: [],
isWorking: false
}));

// Converts the schedule returned by MongoDB into seven editable days.
const normalizeSchedule = (workingSchedule = []) => {
const schedule = createEmptySchedule();


workingSchedule.forEach((entry) => {
    const dayIndex = schedule.findIndex(
        (day) => day.dayOfWeek === entry.dayOfWeek
    );

    if (dayIndex !== -1) {
        schedule[dayIndex] = {
            dayOfWeek: entry.dayOfWeek,
            startTime: entry.startTime || "09:00",
            endTime: entry.endTime || "18:00",
            breaks: Array.isArray(entry.breaks)
                ? entry.breaks.map((item) => ({
                    startTime: item.startTime || "",
                    endTime: item.endTime || ""
                }))
                : [],
            isWorking: entry.isWorking !== false
        };
    }
});

return schedule;


};

function ProfessionalsManagement() {
const [services, setServices] = useState([]);
const [selectedServiceId, setSelectedServiceId] = useState("");


const [professionals, setProfessionals] = useState([]);
const [selectedProfessionalId, setSelectedProfessionalId] = useState("");

const [schedule, setSchedule] = useState(createEmptySchedule);

const [loadingServices, setLoadingServices] = useState(true);
const [loadingProfessionals, setLoadingProfessionals] = useState(false);
const [saving, setSaving] = useState(false);

const [error, setError] = useState("");
const [success, setSuccess] = useState("");

// Loads the available services when the page opens.
useEffect(() => {
    const fetchServices = async () => {
        try {
            setLoadingServices(true);
            setError("");

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error(
                    "Authentication token is missing. Please log in again."
                );
            }

            const response = await fetch(
                `${API_BASE_URL}/services`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.status === 401) {
                handleAdminAuthError(response.status);
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load services."
                );
            }

            const loadedServices = data.data || [];
            setServices(loadedServices);

            const firstActiveService = loadedServices.find(
                (service) => service.isActive
            );

            if (firstActiveService) {
                setSelectedServiceId(firstActiveService._id);
            }
        } catch (err) {
            console.error("Professionals page service fetch error:", err);
            setError(err.message);
        } finally {
            setLoadingServices(false);
        }
    };

    fetchServices();
}, []);

// Loads professionals whenever the selected service changes.
useEffect(() => {
    const fetchProfessionals = async () => {
        if (!selectedServiceId) {
            setProfessionals([]);
            setSelectedProfessionalId("");
            setSchedule(createEmptySchedule());
            return;
        }

        try {
            setLoadingProfessionals(true);
            setError("");
            setSuccess("");

            setProfessionals([]);
            setSelectedProfessionalId("");
            setSchedule(createEmptySchedule());

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error(
                    "Authentication token is missing. Please log in again."
                );
            }

            const response = await fetch(
                `${API_BASE_URL}/professionals?serviceId=${encodeURIComponent(selectedServiceId)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.status === 401) {
                handleAdminAuthError(response.status);
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load professionals."
                );
            }

            const loadedProfessionals = data.data || [];
            setProfessionals(loadedProfessionals);

            if (loadedProfessionals.length > 0) {
                setSelectedProfessionalId(loadedProfessionals[0]._id);
                setSchedule(
                    normalizeSchedule(
                        loadedProfessionals[0].workingSchedule || []
                    )
                );
            }
        } catch (err) {
            console.error("Professionals fetch error:", err);
            setError(err.message);
        } finally {
            setLoadingProfessionals(false);
        }
    };

    fetchProfessionals();
}, [selectedServiceId]);



const handleScheduleChange = (dayOfWeek, field, value) => {
    setSchedule((previousSchedule) =>
        previousSchedule.map((day) =>
            day.dayOfWeek === dayOfWeek
                ? { ...day, [field]: value }
                : day
        )
    );

    setError("");
    setSuccess("");
};

const handleBreakChange = (dayOfWeek, breakIndex, field, value) => {
    setSchedule((previousSchedule) =>
        previousSchedule.map((day) => {
            if (day.dayOfWeek !== dayOfWeek) {
                return day;
            }

            return {
                ...day,
                breaks: day.breaks.map((breakItem, index) =>
                    index === breakIndex
                        ? { ...breakItem, [field]: value }
                        : breakItem
                )
            };
        })
    );

    setError("");
    setSuccess("");
};

const addBreak = (dayOfWeek) => {
    setSchedule((previousSchedule) =>
        previousSchedule.map((day) =>
            day.dayOfWeek === dayOfWeek
                ? {
                    ...day,
                    breaks: [
                        ...day.breaks,
                        { startTime: "", endTime: "" }
                    ]
                }
                : day
        )
    );

    setError("");
    setSuccess("");
};

const removeBreak = (dayOfWeek, breakIndex) => {
    setSchedule((previousSchedule) =>
        previousSchedule.map((day) =>
            day.dayOfWeek === dayOfWeek
                ? {
                    ...day,
                    breaks: day.breaks.filter(
                        (_, index) => index !== breakIndex
                    )
                }
                : day
        )
    );

    setError("");
    setSuccess("");
};

// Validates the schedule before sending it to the backend.
const validateSchedule = () => {
    for (const day of schedule) {
        if (!day.isWorking) {
            continue;
        }

        if (!day.startTime || !day.endTime) {
            return `${DAYS_OF_WEEK[day.dayOfWeek].label}: enter both working hours.`;
        }

        if (day.startTime >= day.endTime) {
            return `${DAYS_OF_WEEK[day.dayOfWeek].label}: end time must be later than start time.`;
        }

        for (const breakItem of day.breaks) {
            if (!breakItem.startTime || !breakItem.endTime) {
                return `${DAYS_OF_WEEK[day.dayOfWeek].label}: complete or remove each break.`;
            }

            if (breakItem.startTime >= breakItem.endTime) {
                return `${DAYS_OF_WEEK[day.dayOfWeek].label}: break end time must be later than its start time.`;
            }

            if (
                breakItem.startTime < day.startTime ||
                breakItem.endTime > day.endTime
            ) {
                return `${DAYS_OF_WEEK[day.dayOfWeek].label}: breaks must be within working hours.`;
            }
        }

        const sortedBreaks = [...day.breaks].sort(
            (a, b) => a.startTime.localeCompare(b.startTime)
        );

        for (let index = 1; index < sortedBreaks.length; index += 1) {
            if (
                sortedBreaks[index].startTime <
                sortedBreaks[index - 1].endTime
            ) {
                return `${DAYS_OF_WEEK[day.dayOfWeek].label}: breaks must not overlap.`;
            }
        }
    }

    return "";
};

// Saves the weekly schedule for the selected professional.
const handleSaveSchedule = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedProfessionalId) {
        setError("Please select a professional.");
        return;
    }

    const validationError = validateSchedule();

    if (validationError) {
        setError(validationError);
        return;
    }

    try {
        setSaving(true);

        const token = localStorage.getItem("token");

        if (!token) {
            throw new Error(
                "Authentication token is missing. Please log in again."
            );
        }

        const workingSchedule = schedule.map((day) => ({
            dayOfWeek: day.dayOfWeek,
            startTime: day.startTime,
            endTime: day.endTime,
            breaks: day.breaks,
            isWorking: day.isWorking
        }));

        const response = await fetch(
            `${API_BASE_URL}/professionals/${selectedProfessionalId}/schedule`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ workingSchedule })
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            handleAdminAuthError(response.status);
            return;
        }

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to save the working schedule."
            );
        }

        const updatedProfessional = data.data;

        setProfessionals((previousProfessionals) =>
            previousProfessionals.map((professional) =>
                professional._id === selectedProfessionalId
                    ? {
                        ...professional,
                        ...updatedProfessional,
                        workingSchedule:
                            updatedProfessional.workingSchedule ||
                            workingSchedule
                    }
                    : professional
            )
        );

        setSchedule(
            normalizeSchedule(
                updatedProfessional.workingSchedule || workingSchedule
            )
        );

        setSuccess("Weekly working schedule saved successfully.");
    } catch (err) {
        console.error("Schedule save error:", err);
        setError(err.message);
    } finally {
        setSaving(false);
    }
};

const selectedProfessional = professionals.find(
    (professional) => professional._id === selectedProfessionalId
);

if (loadingServices) {
    return (
        <div className="admin-professionals-page">
            <p>Loading services...</p>
        </div>
    );
}

return (
    <div className="admin-professionals-page">
        <header className="professionals-page-header">
            <div>
                <h1>Professionals Management</h1>
                <p>
                    Manage professionals and configure their weekly
                    working schedules.
                </p>
            </div>
        </header>

        {error && (
            <p className="professionals-message professionals-error" role="alert">
                {error}
            </p>
        )}

        {success && (
            <p
                className="professionals-message professionals-success"
                role="status"
            >
                {success}
            </p>
        )}

        <section className="professionals-selection-panel">
            <div className="professionals-field">
                <label htmlFor="professional-service">Service</label>
                <select
                    id="professional-service"
                    value={selectedServiceId}
                    onChange={(event) =>
                        setSelectedServiceId(event.target.value)
                    }
                >
                    <option value="">Select a service</option>

                    {services
                        .filter((service) => service.isActive)
                        .map((service) => (
                            <option key={service._id} value={service._id}>
                                {service.title}
                            </option>
                        ))}
                </select>
            </div>

            <div className="professionals-field">
                <label htmlFor="professional-select">Professional</label>
                <select
                    id="professional-select"
                    value={selectedProfessionalId}
                    onChange={(event) => {
    const professionalId = event.target.value;

    setSelectedProfessionalId(professionalId);

    const professional = professionals.find(
        (item) => item._id === professionalId
    );

    if (professional) {
        setSchedule(
            normalizeSchedule(professional.workingSchedule || [])
        );
    } else {
        setSchedule(createEmptySchedule());
    }

    setError("");
    setSuccess("");
}}
                    disabled={
                        !selectedServiceId ||
                        loadingProfessionals ||
                        professionals.length === 0
                    }
                >
                    <option value="">
                        {loadingProfessionals
                            ? "Loading professionals..."
                            : professionals.length === 0
                                ? "No professionals available"
                                : "Select a professional"}
                    </option>

                    {professionals.map((professional) => (
                        <option
                            key={professional._id}
                            value={professional._id}
                        >
                            {professional.name}
                        </option>
                    ))}
                </select>
            </div>
        </section>

        {selectedProfessional && (
            <section className="professionals-schedule-panel">
                <div className="professionals-schedule-header">
                    <div>
                        <h2>{selectedProfessional.name}</h2>
                        <p>
                            Configure the days and hours this professional
                            is available for bookings.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSaveSchedule}>
                    <div className="professionals-schedule-list">
                        {schedule.map((day) => (
                            <article
                                className={`professionals-day-card ${
                                    day.isWorking ? "is-working" : ""
                                }`}
                                key={day.dayOfWeek}
                            >
                                <div className="professionals-day-heading">
                                    <label className="professionals-day-toggle">
                                        <input
                                            type="checkbox"
                                            checked={day.isWorking}
                                            onChange={(event) =>
                                                handleScheduleChange(
                                                    day.dayOfWeek,
                                                    "isWorking",
                                                    event.target.checked
                                                )
                                            }
                                        />
                                        <span>
                                            {
                                                DAYS_OF_WEEK.find(
                                                    (item) =>
                                                        item.value ===
                                                        day.dayOfWeek
                                                ).label
                                            }
                                        </span>
                                    </label>

                                    <span
                                        className={`professionals-day-status ${
                                            day.isWorking
                                                ? "working"
                                                : "not-working"
                                        }`}
                                    >
                                        {day.isWorking
                                            ? "Working"
                                            : "Day off"}
                                    </span>
                                </div>

                                {day.isWorking && (
                                    <>
                                        <div className="professionals-hours-grid">
                                            <div className="professionals-field">
                                                <label
                                                    htmlFor={`start-${day.dayOfWeek}`}
                                                >
                                                    Start time
                                                </label>
                                                <input
                                                    id={`start-${day.dayOfWeek}`}
                                                    type="time"
                                                    value={day.startTime}
                                                    onChange={(event) =>
                                                        handleScheduleChange(
                                                            day.dayOfWeek,
                                                            "startTime",
                                                            event.target.value
                                                        )
                                                    }
                                                    required
                                                />
                                            </div>

                                            <div className="professionals-field">
                                                <label
                                                    htmlFor={`end-${day.dayOfWeek}`}
                                                >
                                                    End time
                                                </label>
                                                <input
                                                    id={`end-${day.dayOfWeek}`}
                                                    type="time"
                                                    value={day.endTime}
                                                    onChange={(event) =>
                                                        handleScheduleChange(
                                                            day.dayOfWeek,
                                                            "endTime",
                                                            event.target.value
                                                        )
                                                    }
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="professionals-breaks">
                                            <div className="professionals-breaks-heading">
                                                <strong>Breaks</strong>
                                                <button
                                                    type="button"
                                                    className="professionals-text-button"
                                                    onClick={() =>
                                                        addBreak(day.dayOfWeek)
                                                    }
                                                >
                                                    + Add break
                                                </button>
                                            </div>

                                            {day.breaks.length === 0 && (
                                                <p className="professionals-no-breaks">
                                                    No breaks configured.
                                                </p>
                                            )}

                                            {day.breaks.map(
                                                (breakItem, breakIndex) => (
                                                    <div
                                                        className="professionals-break-row"
                                                        key={breakIndex}
                                                    >
                                                        <div className="professionals-field">
                                                            <label
                                                                htmlFor={`break-start-${day.dayOfWeek}-${breakIndex}`}
                                                            >
                                                                Break starts
                                                            </label>
                                                            <input
                                                                id={`break-start-${day.dayOfWeek}-${breakIndex}`}
                                                                type="time"
                                                                value={breakItem.startTime}
                                                                onChange={(event) =>
                                                                    handleBreakChange(
                                                                        day.dayOfWeek,
                                                                        breakIndex,
                                                                        "startTime",
                                                                        event.target.value
                                                                    )
                                                                }
                                                                required
                                                            />
                                                        </div>

                                                        <div className="professionals-field">
                                                            <label
                                                                htmlFor={`break-end-${day.dayOfWeek}-${breakIndex}`}
                                                            >
                                                                Break ends
                                                            </label>
                                                            <input
                                                                id={`break-end-${day.dayOfWeek}-${breakIndex}`}
                                                                type="time"
                                                                value={breakItem.endTime}
                                                                onChange={(event) =>
                                                                    handleBreakChange(
                                                                        day.dayOfWeek,
                                                                        breakIndex,
                                                                        "endTime",
                                                                        event.target.value
                                                                    )
                                                                }
                                                                required
                                                            />
                                                        </div>

                                                        <button
                                                            type="button"
                                                            className="professionals-remove-break"
                                                            onClick={() =>
                                                                removeBreak(
                                                                    day.dayOfWeek,
                                                                    breakIndex
                                                                )
                                                            }
                                                            aria-label={`Remove break ${breakIndex + 1} on ${DAYS_OF_WEEK[day.dayOfWeek].label}`}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </>
                                )}
                            </article>
                        ))}
                    </div>

                    <div className="professionals-form-actions">
                        <button
                            type="submit"
                            className="professionals-save-button"
                            disabled={saving}
                        >
                            {saving ? "Saving schedule..." : "Save Schedule"}
                        </button>
                    </div>
                </form>
            </section>
        )}

        {!loadingProfessionals &&
            selectedServiceId &&
            professionals.length === 0 && (
                <div className="professionals-empty-state">
                    <h2>No professionals found</h2>
                    <p>
                        There are no active professionals associated with
                        this service yet.
                    </p>
                </div>
            )}
    </div>
);


}

export default ProfessionalsManagement;
