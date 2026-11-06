import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ServiceDetails.css";

function ServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/services/${id}`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to fetch service"
          );
        }

        setService(result.data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id]);

  if (loading) {
    return (
      <main className="service-details-page">
        <p className="service-details-message">
          Loading service...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="service-details-page">
        <p className="service-details-message service-details-error">
          {error}
        </p>
      </main>
    );
  }

  if (!service) {
    return (
      <main className="service-details-page">
        <p className="service-details-message">
          Service not found.
        </p>
      </main>
    );
  }

  return (
    <main className="service-details-page">

      <div className="service-details-container">

        <div className="service-details-breadcrumb">
          <button
            type="button"
            onClick={() => navigate("/services")}
          >
            Services
          </button>

          <span>/</span>

          <span>{service.title}</span>
        </div>

        <section className="service-details-card">

          <div className="service-details-image-wrapper">
            {service.imageUrl ? (
              <img
                src={service.imageUrl}
                alt={service.title}
                className="service-details-image"
              />
            ) : (
              <div className="service-details-image-placeholder">
                Service
              </div>
            )}
          </div>

          <div className="service-details-content">

            <span className="service-details-category">
              {service.categoryId?.name || "Home Services"}
            </span>

            <h1>{service.title}</h1>

            <div className="service-details-price">
              ₹{service.pricePerHour ?? "—"}
              <span>/ hour</span>
            </div>

            <p className="service-details-short-description">
              {service.shortDescription}
            </p>

            <div className="service-details-info">

              <div>
                <span>Pricing</span>
                <strong>
                  {service.pricingType || "—"}
                </strong>
              </div>

              <div>
                <span>Estimated duration</span>
                <strong>
                  {service.estimatedDuration
                    ? `${service.estimatedDuration} min`
                    : "To be confirmed"}
                </strong>
              </div>

            </div>

            <div className="service-details-description">

              <h2>About this service</h2>

              <p>
                {service.description ||
                  service.shortDescription ||
                  "Professional home service."}
              </p>

            </div>

            <button
              type="button"
              className="service-details-book-button"
              onClick={()=>{
                const token = localStorage.getItem("token");
                const user =  localStorage.getItem("user");

                const bookingPath = `/services/${service._id}/book/address`;

                if(!token || !user){
                  navigate("/login",{
                    state:{
                      from:bookingPath
                    }
                  });
                  console.log("UPDATED ServiceDetails component loaded");
                  return;
                }
                navigate(bookingPath);
              }}
            >
              Book Now
            </button>

          </div>

        </section>

      </div>

    </main>
  );
}

export default ServiceDetails;