import { useEffect, useState } from "react";
import {
useNavigate,
useParams,
useSearchParams,
} from "react-router-dom";

import "./BookingConfirmation.css";

const API_URL = "http://localhost:3000/api";

function BookingConfirmation() {
const { id: serviceId } = useParams();
const navigate = useNavigate();
const [searchParams] = useSearchParams();


// Read the customer's selected booking details from the URL.
const addressId = searchParams.get("addressId");
const selectedDate = searchParams.get("date");
const slotId = searchParams.get("slotId");
const startTime = searchParams.get("startTime");

const requestedDurationHours = Number(
    searchParams.get("requestedDurationHours")
);

// Identify which booking flow the customer selected.
const isHourlyBooking =
    startTime !== null &&
    Number.isInteger(requestedDurationHours) &&
    requestedDurationHours > 0;

// Validate the booking information received through URL parameters.
const hasValidBookingTime = isHourlyBooking || Boolean(slotId);

const hasValidBookingDetails = Boolean(
    serviceId && addressId && selectedDate && hasValidBookingTime
);

const token = localStorage.getItem("token");

const [service, setService] = useState(null);
const [address, setAddress] = useState(null);
const [selectedSlot, setSelectedSlot] = useState(null);

const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

// Show loading only when the booking information is valid.
const showLoading = hasValidBookingDetails && loading;

useEffect(() => {
    if (!token) {
        navigate("/login", {
            replace: true,
            state: {
                from: {
                    pathname: `/services/${serviceId}/book/confirm`,
                    search: window.location.search,
                },
            },
        });

        return;
    }

if(!hasValidBookingDetails){
    return;
}

    const controller = new AbortController();

    const fetchBookingDetails = async () => {
        try {
            setLoading(true);
            setError("");

            // Build the availability query for the selected booking type.
const query = new URLSearchParams({
    serviceId,
    date: selectedDate,
});

// Hourly bookings require the requested duration.
if (isHourlyBooking) {
    query.set(
        "durationHours",
        String(requestedDurationHours)
    );
}

const [
    serviceResponse,
    addressResponse,
    slotsResponse,
] = await Promise.all([
    fetch(`${API_URL}/services/${encodeURIComponent(serviceId)}`, {
        signal: controller.signal,
    }),

    fetch(`${API_URL}/user/addresses`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
    }),

    fetch(`${API_URL}/availability?${query.toString()}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
    }),
]);
            

            const [
                serviceResult,
                addressResult,
                slotsResult,
            ] = await Promise.all([
                serviceResponse.json(),
                addressResponse.json(),
                slotsResponse.json(),
            ]);

            if (!serviceResponse.ok) {
                throw new Error(
                    serviceResult.message ||
                        "Failed to fetch service details."
                );
            }

            if (!addressResponse.ok) {
                throw new Error(
                    addressResult.message ||
                        "Failed to fetch addresses."
                );
            }

            if (!slotsResponse.ok) {
                throw new Error(
                    slotsResult.message ||
                        "Failed to fetch availability."
                );
            }

            const selectedAddress = addressResult.data?.find(
                (item) => item._id === addressId
            );

            // Find the selected appointment based on the booking type.
const selectedSlot = isHourlyBooking
    ? slotsResult.data?.find(
          (item) => item.startTime === startTime
      )
    : slotsResult.data?.find(
          (item) => String(item._id) === slotId
      );

            if (!serviceResult.data) {
                throw new Error("Service details could not be found.");
            }

            if (!selectedAddress) {
                throw new Error(
                    "The selected address could not be found. Please select an address again."
                );
            }

            if (!selectedSlot) {
                throw new Error(
                    "The selected time slot could not be found. Please select another time."
                );
            }

            setService(serviceResult.data);
            setAddress(selectedAddress);
            setSelectedSlot(selectedSlot);
        } catch (error) {
            if (error.name !== "AbortError") {
                setError(
                    error.message ||
                        "Something went wrong while loading your booking details."
                );
            }
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        }
    };

    fetchBookingDetails();

    return () => {
        controller.abort();
    };
}, [
    token,
    serviceId,
    addressId,
    selectedDate,
    slotId,
    startTime,
    requestedDurationHours,
    isHourlyBooking,
    hasValidBookingDetails,
    navigate,
]);

const handleReturnToBooking = () => {
    const query = new URLSearchParams();

    if (addressId) {
        query.set("addressId", addressId);
    }

    const search = query.toString();

    navigate(
        `/services/${serviceId}/book${search ? `?${search}` : ""}`
    );
};

const formatDate = (date) => {
    if (!date) {
        return "";
    }

    const [year, month, day] = date.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "long",
            year: "numeric",
        }
    );
};

return (
    <main className="booking-page">
        <section className="booking-panel">
            <div className="booking-progress">
                <span className="booking-step">
                    1. Address
                </span>

                <span className="booking-step">
                    2. Date &amp; Time
                </span>

                <span className="booking-step active">
                    3. Review
                </span>
            </div>

            <h1>Review Your Booking</h1>

            <p className="booking-subtitle">
                Review your selected service, address, date, and time
                before continuing.
            </p>

            {showLoading && (
                <p role="status">
                    Loading your booking details...
                </p>
            )}

            {!showLoading && (!hasValidBookingDetails || error) && (
                <div className="booking-error" role="alert">
                    <p>
                        {!hasValidBookingDetails
                        ? "Your booking information is incomplete. Please select your address and time again."
                        : error}
                    </p>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={handleReturnToBooking}
                    >
                        Return to Booking
                    </button>
                </div>
            )}

            {!showLoading &&
                hasValidBookingDetails &&
                !error &&
                service &&
                address &&
                selectedSlot && (
                    <>
                        <div className="booking-review-details">
                            <section className="booking-review-section">
                                <h2>Selected Service</h2>

                                <h3>{service.title}</h3>

                                {service.shortDescription && (
                                    <p>{service.shortDescription}</p>
                                )}

                                {service.durationType === "hourly" &&
                                    service.pricePerHour != null && (
                                        <p>
                                            Rate: ₹
                                            {service.pricePerHour} per
                                            hour
                                        </p>
                                    )}

                                {service.durationType === "full_day" &&
                                    service.pricePerDay != null && (
                                        <p>
                                            Rate: ₹
                                            {service.pricePerDay} per day
                                        </p>
                                    )}
                            </section>

                            <section className="booking-review-section">
                                <h2>Service Address</h2>

                                <p>{address.label}</p>
                                <p>{address.houseFlat}</p>
                                <p>{address.roadArea}</p>

                                {address.landmark && (
                                    <p>
                                        Landmark: {address.landmark}
                                    </p>
                                )}

                                <p>
                                    {address.city} - {address.pincode}
                                </p>
                            </section>

                            <section className="booking-review-section">
                                <h2>Appointment Details</h2>

                                <p>
                                    <strong>Date:</strong>{" "}
                                    {formatDate(selectedDate)}
                                </p>

                                <p>
                                    <strong>Time:</strong>{" "}
                                    {selectedSlot.startTime} –{" "}
                                    {selectedSlot.endTime}
                                </p>
                            </section>
                        </div>

                        <div className="booking-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={handleReturnToBooking}
                            >
                                Back to Booking
                            </button>

                            <button
                                type="button"
                                className="primary-button"
                                disabled
                                title="Booking creation and payment are not implemented yet."
                            >
                                Continue to Payment
                            </button>
                        </div>

                        <p className="booking-subtitle">
                            Your booking has not been created yet.
                            Payment will be available after booking
                            creation is implemented.
                        </p>
                    </>
                )}
        </section>
    </main>
);


}

export default BookingConfirmation;
