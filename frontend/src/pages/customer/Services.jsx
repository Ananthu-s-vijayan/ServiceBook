import { useEffect, useMemo, useState } from "react";
import "./Services.css";
import { useNavigate, useSearchParams } from "react-router-dom";

function Services() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchParams]=useSearchParams();
  const [searchTerm, setSearchTerm] =useState(()=>searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOption, setSortOption] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();
  const SERVICES_PER_PAGE = 3;

  /*
   * Fetch services and categories from the existing backend APIs.
   * This keeps the catalog functionality on the frontend
   * without changing the existing backend contract.
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesResponse, categoriesResponse] =
          await Promise.all([
            fetch("http://localhost:3000/api/services"),
            fetch("http://localhost:3000/api/categories")
          ]);

        const servicesResult =
          await servicesResponse.json();

        const categoriesResult =
          await categoriesResponse.json();

        if (!servicesResponse.ok) {
          throw new Error(
            servicesResult.message ||
              "Failed to fetch services"
          );
        }

        if (!categoriesResponse.ok) {
          throw new Error(
            categoriesResult.message ||
              "Failed to fetch categories"
          );
        }

        setServices(servicesResult.data);
        setCategories(categoriesResult.data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /*
 * Filter services by search/category and then
 * apply the selected price sorting option.
 */
const filteredServices = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    // Match service titles first to avoid unrelated description matches.
    let filtered = services;

    if (search) {
        const titleMatches = services.filter((service) =>
            service.title?.toLowerCase().includes(search)
        );

        if (titleMatches.length > 0) {
            filtered = titleMatches;
        } else {
            filtered = services.filter((service) =>
                service.shortDescription
                    ?.toLowerCase()
                    .includes(search) ||
                service.description
                    ?.toLowerCase()
                    .includes(search)
            );
        }
    }

    // Apply category filtering while excluding services with inactive categories.
    filtered = filtered.filter((service) => {
        const serviceCategoryId =
            typeof service.categoryId === "object"
                ? service.categoryId?._id
                : service.categoryId;

        const categoryIsActive = categories.some(
            (category) =>
                category._id === serviceCategoryId
        );

        const matchesCategory =
            selectedCategory === "all" ||
            serviceCategoryId === selectedCategory;

        return categoryIsActive && matchesCategory;
    });

    // Apply the selected price sorting option.
    if (sortOption === "price-low") {
        return [...filtered].sort(
            (a, b) =>
                (a.pricePerHour ?? Infinity) -
                (b.pricePerHour ?? Infinity)
        );
    }

    if (sortOption === "price-high") {
        return [...filtered].sort(
            (a, b) =>
                (b.pricePerHour ?? -Infinity) -
                (a.pricePerHour ?? -Infinity)
        );
    }

    return filtered;
}, [
    services,
    categories,
    searchTerm,
    selectedCategory,
    sortOption
]);

  /*
   * Calculate pagination values.
   */
  const totalPages = Math.ceil(
    filteredServices.length / SERVICES_PER_PAGE
  );

  const startIndex =
    (currentPage - 1) * SERVICES_PER_PAGE;

  const currentServices = filteredServices.slice(
    startIndex,
    startIndex + SERVICES_PER_PAGE
  );

  /*
   * Loading state
   */
  if (loading) {
    return (
      <main className="services-page">
        <p className="services-message">
          Loading services...
        </p>
      </main>
    );
  }

  /*
   * Error state
   */
  if (error) {
    return (
      <main className="services-page">
        <p className="services-message services-error">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="services-page">

      {/* Breadcrumb */}
      <div className="services-container">
        <div className="breadcrumb">
          <span>Home</span>
          <span>/</span>
          <span className="breadcrumb-current">
            Services
          </span>
        </div>
      </div>

      {/* Page heading */}
      <section className="services-header">
        <div className="services-container">
          <h1>
            Explore Our Professional Services
          </h1>

          <p>
            Find the right service for your home.
          </p>
        </div>
      </section>

      {/* Search, category filter and sorting */}
      <section className="services-container services-controls">
{/* Search with service-name suggestions */}
<div className="search-box">
  <span className="search-icon">⌕</span>

  <input
    type="text"
    placeholder="Search or select a service..."
    value={searchTerm}
    autoComplete="off"
    onChange={(event) => {setSearchTerm(event.target.value);
      setCurrentPage(1);
    }}
  />

  {searchTerm.trim() && (
    <div className="search-suggestions">
      {services
        .filter((service) =>
          service.title
            ?.toLowerCase()
            .includes(searchTerm.trim().toLowerCase())
        )
        .slice(0, 8)
        .map((service) => (
          <button
            type="button"
            key={service._id}
            className="search-suggestion-item"
            onClick={() => {setSearchTerm(service.title);
              setCurrentPage(1);
            }}
          >
            {service.title}
          </button>
        ))}

      {!services.some((service) =>
        service.title
          ?.toLowerCase()
          .includes(searchTerm.trim().toLowerCase())
      ) && (
        <div className="search-no-suggestions">
          No matching services found
        </div>
      )}
    </div>
  )}
</div>
        {/* Category filter */}
        <select
          className="category-select"
          value={selectedCategory}
          onChange={(event) =>{
            setSelectedCategory(event.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">
            All Services
          </option>

          {categories.map((category) => (
            <option
              key={category._id}
              value={category._id}
            >
              {category.name}
            </option>
          ))}
        </select>

        {/* Price sorting */}
        <select
          className="sort-select"
          value={sortOption}
          onChange={(event) =>{
            setSortOption(event.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="default">
            Sort by
          </option>

          <option value="price-low">
            Price: Low to High
          </option>

          <option value="price-high">
            Price: High to Low
          </option>
        </select>

      </section>

      {/* Service count */}
      <section className="services-container services-meta">
        <p>
          {filteredServices.length === 0
            ? "No services found"
            : `Showing ${startIndex + 1}–${Math.min(
                startIndex + SERVICES_PER_PAGE,
                filteredServices.length
              )} of ${filteredServices.length} services`}
        </p>
      </section>

      {/* Service cards */}
      <section className="services-container service-grid">

        {currentServices.length === 0 ? (
          <p className="services-message">
            No services available.
          </p>
        ) : (
          currentServices.map((service) => (
            <article
              className="service-card"
              key={service._id}
            >

              {/* Service image */}
              <div className="service-image-wrapper">

                {service.imageUrl ? (
                  <img
                    src={service.imageUrl}
                    alt={service.title}
                    className="service-image"
                  />
                ) : (
                  <div className="service-image-placeholder">
                    Service
                  </div>
                )}

              </div>

              {/* Service information */}
              <div className="service-card-content">

                <h2>
                  {service.title}
                </h2>

                <p className="service-description">
                  {service.shortDescription ||
                    service.description}
                </p>

                {/* Price and duration */}
                <div className="service-details">

                  <div>
                    <span className="service-label">
                      Starting price
                    </span>

                    <strong>
                      ₹{service.pricePerHour ?? "—"}
                    </strong>
                  </div>

                  <div>
                    <span className="service-label">
                      Estimated duration
                    </span>

                    <strong>
                      {service.estimatedDuration
                        ? `${service.estimatedDuration} min`
                        : "—"}
                    </strong>
                  </div>

                </div>

                {/* Booking button */}
                <button
                  type="button"
                  className="book-button"
                  onClick={()=>navigate(`/services/${service._id}`)}
                >
                  Book Now
                </button>

              </div>
            </article>
          ))
        )}

      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="services-container pagination">

          {/* Previous button */}
          <button
            type="button"
            className="pagination-button"
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage(
                (page) => page - 1
              )
            }
          >
            Previous
          </button>

          {/* Page numbers */}
          <div className="pagination-pages">

            {Array.from(
              { length: totalPages },
              (_, index) => index + 1
            ).map((page) => (
              <button
                type="button"
                key={page}
                className={`pagination-number ${
                  currentPage === page
                    ? "pagination-number-active"
                    : ""
                }`}
                onClick={() =>
                  setCurrentPage(page)
                }
              >
                {page}
              </button>
            ))}

          </div>

          {/* Next button */}
          <button
            type="button"
            className="pagination-button"
            disabled={
              currentPage === totalPages
            }
            onClick={() =>
              setCurrentPage(
                (page) => page + 1
              )
            }
          >
            Next
          </button>

        </div>
      )}

    </main>
  );
}

export default Services;