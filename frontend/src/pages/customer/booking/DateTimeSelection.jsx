import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import "./DateTimeSelection.css";

const API_URL = "http://localhost:3000/api";

// Returns today's date in the YYYY-MM-DD format using local time.
const getToday = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Formats an amount as Indian Rupees.
const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

function DateTimeSelection() {
  const { id: serviceId } = useParams();

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const addressId = searchParams.get("addressId");

  const token = localStorage.getItem("token");

  const [selectedDate, setSelectedDate] = useState(getToday);

  const [slots, setSlots] = useState([]);

  const [selectedSlotId, setSelectedSlotId] = useState("");

  const [requestedDurationHours, setRequestedDurationHours] = useState(1);

  const [selectedStartTime, setSelectedStartTime] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [service, setService] = useState(null);

  const [serviceLoading, setServiceLoading] = useState(true);

  const [serviceError, setServiceError] = useState("");

 // Derive service loading and error states from the service ID.
const isServiceLoading = Boolean(serviceId) && serviceLoading;

const displayedServiceError = !serviceId
    ? "Service information is unavailable."
    : serviceError;

  // Redirect unauthenticated customers to login.
  useEffect(() => {
    if (!token) {
      navigate("/login", {
        replace: true,
        state: {
          from: {
            pathname: `/services/${serviceId}/book/slot`,
            search: `?addressId=${encodeURIComponent(
              addressId || ""
            )}`,
          },
        },
      });
    }
  }, [token, navigate, serviceId, addressId]);

  // Fetch service details to display the correct pricing information.
  useEffect(() => {
    if (!serviceId) {
      return;
    }

    const controller = new AbortController();

    const fetchService = async () => {
      try {
        setServiceLoading(true);
        setServiceError("");
        setService(null);

        const response = await fetch(
          `${API_URL}/services/${encodeURIComponent(serviceId)}`,
          {
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to load service details."
          );
        }

        // Support the common { data: service } API response shape.
        const serviceData = result.data;

        if (!serviceData || typeof serviceData !== "object") {
          throw new Error("Invalid service details received from the server.");
        }

        setService(serviceData);

        if(serviceData.durationType === "hourly"){
          const estimatedDuration = Number(serviceData.estimatedDuration);
          
          setRequestedDurationHours(
            Number.isInteger(estimatedDuration) && estimatedDuration > 0
            ? estimatedDuration
            : 1
          );
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setServiceError(
            err.message || "Failed to load service details."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setServiceLoading(false);
        }
      }
    };

    fetchService();

    return () => {
      controller.abort();
    };
  }, [serviceId]);

// Fetch dynamic availability for hourly services and legacy slots for full-day services.
useEffect(() => {
  if (
    !token ||
    !serviceId ||
    !addressId ||
    !selectedDate ||
    !service
  ) {
    return;
  }

  const controller = new AbortController();

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      setError("");
      setSlots([]);
      setSelectedSlotId("");
      setSelectedStartTime("");

      const query = new URLSearchParams({
        serviceId,
        date: selectedDate,
      });

      // Hourly services use dynamic availability.
      // Full-day services retain the existing slot-based flow.
      if (service.durationType === "hourly") {
        query.set(
          "durationHours",
          String(requestedDurationHours)
        );
      }

      const response = await fetch(
        `${API_URL}/availability?${query.toString()}`,
        {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to fetch availability."
        );
      }

      if (!Array.isArray(result.data)) {
        throw new Error(
          "Invalid availability data received from the server."
        );
      }

      setSlots(result.data);
    } catch (err) {
      if (err.name !== "AbortError") {
        setSlots([]);
        setSelectedSlotId("");
        setSelectedStartTime("");

        setError(
          err.message || "Failed to load availability."
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  fetchAvailableSlots();

  return () => {
    controller.abort();
  };
}, [
  token,
  serviceId,
  addressId,
  selectedDate,
  service,
  requestedDurationHours,
]);

  // Calculate the estimated amount for hourly or full-day services.
  const pricing = useMemo(() => {
    if (!service) {
      return {
        valid: false,
        rate: null,
        duration: null,
        amount: null,
      };
    }

    if (service.durationType === "hourly") {
      const pricePerHour = Number(service.pricePerHour);
      const duration = Number(requestedDurationHours);

      if (
        !Number.isFinite(pricePerHour) ||
        pricePerHour < 0 ||
        !Number.isFinite(duration) ||
        duration <= 0
      ) {
        return {
          valid: false,
          rate: null,
          duration: null,
          amount: null,
        };
      }

      return {
        valid: true,
        rate: pricePerHour,
        duration,
        amount: pricePerHour * duration,
      };
    }

    if (service.durationType === "full_day") {
      const pricePerDay = Number(service.pricePerDay);

      if (!Number.isFinite(pricePerDay) || pricePerDay < 0) {
        return {
          valid: false,
          rate: null,
          duration: null,
          amount: null,
        };
      }

      return {
        valid: true,
        rate: pricePerDay,
        duration: null,
        amount: pricePerDay,
      };
    }

    return {
      valid: false,
      rate: null,
      duration: null,
      amount: null,
    };
  }, [service,requestedDurationHours]);

  const handleDateChange = (event) => {
   const nextDate = event.target.value;

   setSelectedDate(nextDate);
   setSelectedSlotId("");
   setSelectedStartTime("");
   setSlots([]);
   setError("");
  };

  const handleSlotSelect = (slot) => {
   if (service?.durationType === "hourly") {
    if (!slot?.startTime || !slot?.endTime) {
      setError("Invalid dynamic availability time.");
      return;
    }

    setSelectedStartTime(slot.startTime);
    setSelectedSlotId("");
    setError("");
    return;
  }

  // Preserve the existing full-day slot selection.
  if (!slot?._id) {
    setError("Invalid availability slot.");
    return;
  }

  setSelectedSlotId(String(slot._id));
  setSelectedStartTime("");
  setError("");
};

  const handleContinue = () => {
  if (!addressId) {
    setError("Please select an address before continuing.");
    return;
  }

  if (!selectedDate || selectedDate < getToday()) {
    setError("Please select a valid service date.");
    return;
  }

  if (!pricing.valid) {
    setError(
      "The service price or duration is invalid. Please contact support."
    );
    return;
  }

  const query = new URLSearchParams({
    addressId,
    date: selectedDate,
  });

  if (service?.durationType === "hourly") {
    if (
      !Number.isInteger(Number(requestedDurationHours)) ||
      Number(requestedDurationHours) < 1
    ) {
      setError(
        "Please select a positive whole number of hours."
      );
      return;
    }

    const selectedTime = slots.find(
      (slot) => slot.startTime === selectedStartTime
    );

    if (!selectedTime) {
      setError("Please select an available start time.");
      return;
    }

    query.set(
      "requestedDurationHours",
      String(requestedDurationHours)
    );

    query.set("startTime", selectedStartTime);
  } else {
    const selectedSlot = slots.find(
      (slot) => String(slot._id) === selectedSlotId
    );

    if (!selectedSlot) {
      setError("Please select an available time slot.");
      return;
    }

    query.set("slotId", selectedSlotId);
  }

  setError("");

  navigate(
    `/services/${serviceId}/book/confirm?${query.toString()}`
  );
};

  if (!token) {
    return <p>Redirecting to login...</p>;
  }

  if (!addressId) {
    return (
      <main className="booking-page">
        <section className="booking-panel">
          <h1>Address Required</h1>

          <p>
            Please select a service address before choosing
            a date and time.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(`/services/${serviceId}/book/address`)
            }
          >
            Select Address
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="booking-page">
      <section className="booking-panel">
        <div className="booking-progress">
          <span className="booking-step">1. Address</span>

          <span className="booking-step active">
            2. Date &amp; Time
          </span>

          <span className="booking-step">3. Payment</span>
        </div>

        <h1>Select Date &amp; Time</h1>

        <p className="booking-subtitle">
          Choose a convenient date and available time slot.
        </p>

        {isServiceLoading ? (
          <p>Loading service pricing...</p>
        ) : displayedServiceError ? (
          <p className="booking-error" role="alert">
            {displayedServiceError}
          </p>
        ) : (
          <section
            className="booking-price-summary"
            aria-label="Service price summary"
          >
            <div>
              <span className="price-summary-label">
                Service
              </span>

              <strong>
                {service.title || "Selected service"}
              </strong>
            </div>

            {service.durationType === "hourly" ? (
              <>
                <div>
                  <span className="price-summary-label">
                    Hourly rate
                  </span>

                  <strong>
                    {pricing.valid
                      ? `${formatMoney(pricing.rate)}/hour`
                      : "Unavailable"}
                  </strong>
                </div>

                <div>
                  <div>
  <label
    className="price-summary-label"
    htmlFor="requestedDurationHours"
  >
    Requested duration
  </label>

  <div>
    <input
      id="requestedDurationHours"
      type="number"
      min="1"
      step="1"
      value={requestedDurationHours}
      onChange={(event) => {
        const value = event.target.value;

        setRequestedDurationHours(
          value === "" ? "" : Number(value)
        );

        setSelectedStartTime("");
        setSelectedSlotId("");
        setError("");
      }}
      required
    />

    <span>
      {Number(requestedDurationHours) === 1
        ? " hour"
        : " hours"}
    </span>
  </div>
</div>

                  <strong>
                    {pricing.valid
                      ? `${pricing.duration} ${
                          pricing.duration === 1 ? "hour" : "hours"
                        }`
                      : "Unavailable"}
                  </strong>
                </div>
              </>
            ) : service.durationType === "full_day" ? (
              <div>
                <span className="price-summary-label">
                  Fixed daily price
                </span>

                <strong>
                  {pricing.valid
                    ? formatMoney(pricing.rate)
                    : "Unavailable"}
                </strong>
              </div>
            ) : null}

            <div className="price-summary-total">
              <span className="price-summary-label">
                Estimated service amount
              </span>

              <strong>
                {pricing.valid
                  ? formatMoney(pricing.amount)
                  : "Unavailable"}
              </strong>
            </div>

            <p className="price-summary-note">
              Final charges are validated by the server and may
              reflect applicable discounts, wallet usage, and taxes.
            </p>
          </section>
        )}

        <div className="form-field">
          <label htmlFor="bookingDate">
            Service Date
          </label>

          <input
            id="bookingDate"
            type="date"
            value={selectedDate}
            min={getToday()}
            onChange={handleDateChange}
            required
          />
        </div>

        {error && (
          <p className="booking-error" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p>Loading available time slots...</p>
        ) : (
          <div className="available-slots">
            <h2>Available Time Slots</h2>

            {slots.length === 0 && !error ? (
              <p>
                No available slots for this date.
                Please select another date.
              </p>
            ) : (
              <div
                className="slot-list"
                role="group"
                aria-label="Available time slots"
              >
                {slots.map((slot) => {
  const isHourly = service?.durationType === "hourly";

  const selectionKey = isHourly
    ? slot.startTime
    : String(slot._id);

  const isSelected = isHourly
    ? selectedStartTime === slot.startTime
    : selectedSlotId === String(slot._id);

  return (
    <button
      key={selectionKey}
      type="button"
      className={`slot-button ${
        isSelected ? "selected" : ""
      }`}
      aria-pressed={isSelected}
      onClick={() => handleSlotSelect(slot)}
    >
      <span>
        {slot.startTime} – {slot.endTime}
      </span>

      <span className="slot-selection-hint">
        {isSelected ? "Selected" : "Select time"}
      </span>
    </button>
  );
})}
              </div>
            )}

            {(selectedStartTime || selectedSlotId) && (
  <p className="selected-slot-summary">
    Selected time:{" "}
    {(() => {
      const selectedTime =
        service?.durationType === "hourly"
          ? slots.find(
              (slot) => slot.startTime === selectedStartTime
            )
          : slots.find(
              (slot) => String(slot._id) === selectedSlotId
            );

      return selectedTime
        ? `${selectedTime.startTime} – ${selectedTime.endTime}`
        : "Please select a time again.";
    })()}
  </p>
)}
          </div>
        )}

        <div className="booking-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate(`/services/${serviceId}/book/address`)
            }
          >
            Back to Address
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={handleContinue}
            disabled={
  loading ||
  serviceLoading ||
  !pricing.valid ||
  (
    service?.durationType === "hourly"
      ? (
          !Number.isInteger(Number(requestedDurationHours)) ||
          Number(requestedDurationHours) < 1 ||
          !selectedStartTime ||
          !slots.some(
            (slot) => slot.startTime === selectedStartTime
          )
        )
      : (
          !selectedSlotId ||
          !slots.some(
            (slot) => String(slot._id) === selectedSlotId
          )
        )
  )
}
          >
            Continue
          </button>
        </div>

        <Link
          className="back-link"
          to={`/services/${serviceId}`}
        >
          ← Back to Service Details
        </Link>
      </section>
    </main>
  );
}

export default DateTimeSelection;