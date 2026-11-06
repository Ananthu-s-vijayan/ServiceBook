import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import "./AddressSelection.css";

const API_URL = "http://localhost:3000/api";

const initialFormData = {
  label: "Home",
  houseFlat: "",
  roadArea: "",
  landmark: "",
  city: "",
  pincode: "",
  isDefault: false,
};

function AddressSelection() {
  const { id: serviceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("token");

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] =
    useState("");

  const [formData, setFormData] =
    useState(initialFormData);

  const [showAddressForm, setShowAddressForm] =
    useState(false);

  const [editingAddressId,setEditingAddressId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  // Fetch addresses belonging to the authenticated customer.
  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchAddresses = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/user/addresses`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to fetch addresses."
          );
        }

        const savedAddresses = result.data || [];

        setAddresses(savedAddresses);

        // Prefer the customer's default address.
        const defaultAddress = savedAddresses.find(
          (address) => address.isDefault
        );

        setSelectedAddressId(
          defaultAddress?._id ||
            savedAddresses[0]?._id ||
            ""
        );

        setFormData((previous) => ({
          ...previous,
          isDefault: savedAddresses.length === 0,
        }));
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [token]);

  const handleChange = (event) => {
    const { name, value, checked, type } =
      event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
    setSuccessMessage("");
  };

  // Opens the existing address form with the selected address's current values.
const handleEditAddress = (address) => {
  setEditingAddressId(address._id);

  setFormData({
    label: address.label || "Home",
    houseFlat: address.houseFlat || "",
    roadArea: address.roadArea || "",
    landmark: address.landmark || "",
    city: address.city || "",
    pincode: address.pincode || "",
    isDefault: Boolean(address.isDefault),
  });

  setShowAddressForm(true);
  setError("");
  setSuccessMessage("");
};

// Deletes only the authenticated customer's selected address.
const handleDeleteAddress = async (address) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete your ${address.label} address?`
  );

  if (!confirmed) {
    return;
  }

  if (!token) {
    setError("Please log in to delete an address.");
    return;
  }

  try {
    setSaving(true);
    setError("");
    setSuccessMessage("");

    const response = await fetch(
      `${API_URL}/user/addresses/${address._id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to delete address."
      );
    }

    setAddresses((previous) =>
      previous.filter((item) => item._id !== address._id)
    );

    // Clear the selection if the deleted address was selected.
    if (selectedAddressId === address._id) {
      setSelectedAddressId("");
    }

    // Close the edit form if it belongs to the deleted address.
    if (editingAddressId === address._id) {
      setEditingAddressId(null);
      setShowAddressForm(false);
      setFormData({ ...initialFormData });
    }

    setSuccessMessage("Address deleted successfully.");
  } catch (error) {
    setError(error.message);
  } finally {
    setSaving(false);
  }
};

// Updates an existing address using the backend's PUT endpoint.
const handleUpdateAddress = async (event) => {
  event.preventDefault();

  if (!token || !editingAddressId) {
    setError("Unable to identify the address being edited.");
    return;
  }

  try {
    setSaving(true);
    setError("");
    setSuccessMessage("");

    const response = await fetch(
      `${API_URL}/user/addresses/${editingAddressId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to update address."
      );
    }

    // Use the updated address returned by the API.
    const updatedAddress = result.data;

    setAddresses((previous) =>
      previous.map((address) => {
        if (address._id === editingAddressId) {
          return updatedAddress;
        }

        // Keep the default-address badge consistent if the edited
        // address became the default.
        if (formData.isDefault) {
          return { ...address, isDefault: false };
        }

        return address;
      })
    );

    setEditingAddressId(null);
    setShowAddressForm(false);
    setFormData({ ...initialFormData });

    setSuccessMessage("Address updated successfully.");
  } catch (error) {
    setError(error.message);
  } finally {
    setSaving(false);
  }
};

  // Save a new address using the existing backend API.
  const handleAddAddress = async (event) => {
    event.preventDefault();

    if (!token) {
      setError("Please log in to save an address.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `${API_URL}/user/addresses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to save address."
        );
      }

      const newAddress = result.data;

      // If the new address is default, remove the old
      // default selection from the frontend list.
      setAddresses((previous) => {
        const updatedAddresses = formData.isDefault
          ? previous.map((address) => ({
              ...address,
              isDefault: false,
            }))
          : previous;

        return [newAddress, ...updatedAddresses];
      });

      setSelectedAddressId(newAddress._id);

      setFormData({
        ...initialFormData,
        isDefault: false,
      });

      setShowAddressForm(false);

      setSuccessMessage(
        "Address saved and selected successfully."
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = () => {
    if (!selectedAddressId) {
      setError("Please select an address to continue.");
      return;
    }

    setError("");

    // Preserve the selected address for the next stage.
    const query = new URLSearchParams({
      addressId: selectedAddressId,
    });

    navigate(
      `/services/${serviceId}/book/slot?${query.toString()}`
    );
  };

  if (!token) {
    return (
      <main className="booking-page">
        <section className="booking-panel">
          <h1>Login Required</h1>

          <p>
            Please log in to select or add your service
            address.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/login", {
                state: {
                  from: location,
                },
              })
            }
          >
            Log In to Continue
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="booking-page">
      <section className="booking-panel">
        <div className="booking-progress">
          <span className="booking-step active">
            1. Address
          </span>

          <span className="booking-step">
            2. Date & Time
          </span>

          <span className="booking-step">
            3. Payment
          </span>
        </div>

        <h1>Select Service Address</h1>

        <p className="booking-subtitle">
          Where should we provide your service?
        </p>

        {error && (
          <p className="booking-error" role="alert">
            {error}
          </p>
        )}

        {successMessage && (
          <p
            className="booking-success"
            role="status"
          >
            {successMessage}
          </p>
        )}

        {loading ? (
          <p>Loading your saved addresses...</p>
        ) : (
          <>
            <div className="address-list">
              {addresses.map((address) => (
                <div
                  key={address._id}
                  className={`address-card ${
                    selectedAddressId === address._id
                      ? "selected"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="selectedAddress"
                    value={address._id}
                    checked={
                      selectedAddressId === address._id
                    }
                    onChange={() =>
                      setSelectedAddressId(address._id)
                    }
                  />

                  <div className="address-card-content"
                  onClick={()=>setSelectedAddressId(address._id)}>
                    
                    <div className="address-card-heading">
                      <strong>{address.label}</strong>

                      {address.isDefault && (
                        <span className="default-badge">
                          Default
                        </span>
                      )}
                    </div>

                    <p>{address.houseFlat}</p>
                    <p>{address.roadArea}</p>

                    {address.landmark && (
                      <p>Landmark: {address.landmark}</p>
                    )}

                    <p>
                      {address.city} - {address.pincode}
                    </p>
                  </div>

                  <div className="address-card-actions">
  <button
    type="button"
    className="address-action-button edit-address-button"
    onClick={(event) => {
      event.preventDefault();
      event.stopPropagation();
      handleEditAddress(address);
    }}
    disabled={saving}
  >
    Edit
  </button>

  <button
    type="button"
    className="address-action-button delete-address-button"
    onClick={(event) => {
      event.preventDefault();
      event.stopPropagation();
      handleDeleteAddress(address);
    }}
    disabled={saving}
  >
    Delete
  </button>
</div>
                </div>
              ))}

              {addresses.length === 0 &&
                !showAddressForm && (
                  <p>
                    You haven't saved an address yet.
                    Add one to continue.
                  </p>
                )}
            </div>

            <button
  type="button"
  className="secondary-button"
  onClick={() => {
    if (showAddressForm) {
      // Close the form and clear any editing state.
      setShowAddressForm(false);
      setEditingAddressId(null);
      setFormData({ ...initialFormData });
    } else {
      // Open a fresh form for adding an address.
      setEditingAddressId(null);
      setFormData({ ...initialFormData });
      setShowAddressForm(true);
    }

    setError("");
    setSuccessMessage("");
  }}
>
  {showAddressForm ? "Cancel" : "+ Add New Address"}
</button>
             

            {showAddressForm && (
              <form
                className="address-form"
                onSubmit={
                    editingAddressId
                    ? handleUpdateAddress
                    : handleAddAddress
                }
              >
                <h2>
                    {editingAddressId ? "Edit Address" : "New Address"}
                </h2>

                <div className="form-field">
                  <label htmlFor="label">
                    Address Type
                  </label>

                  <select
                    id="label"
                    name="label"
                    value={formData.label}
                    onChange={handleChange}
                    required
                  >
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="houseFlat">
                    House / Flat
                  </label>

                  <input
                    id="houseFlat"
                    name="houseFlat"
                    value={formData.houseFlat}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="roadArea">
                    Road / Area
                  </label>

                  <input
                    id="roadArea"
                    name="roadArea"
                    value={formData.roadArea}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="landmark">
                    Landmark (optional)
                  </label>

                  <input
                    id="landmark"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="city">
                    City
                  </label>

                  <input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="pincode">
                    PIN Code
                  </label>

                  <input
                    id="pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                  />
                </div>

                <label className="default-checkbox">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleChange}
                  />

                  Set as default address
                </label>

                <button
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingAddressId
                      ? "Save Changes"
                     : "Save Address"}
                </button>
              </form>
            )}

            <button
              type="button"
              className="primary-button"
              onClick={handleContinue}
              disabled={
                !selectedAddressId || loading
              }
            >
              Continue to Date & Time
            </button>
          </>
        )}

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

export default AddressSelection;