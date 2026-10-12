import { useEffect, useState } from "react";


import "./ServiceManagement.css";

function ServiceManagement() {

    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [editingService, setEditingService]=useState(null);
    const [editForm, setEditForm]=useState({
        categoryId:"",
        title:"",
        sku:"",
        shortDescription:"",
        description:"",
        pricingType:"",
        pricePerHour:"",
        estimatedDuration:""
    });

    const [savingEdit, setSavingEdit]=useState(false);

    const [showCreateForm, setShowCreateForm]=useState(false);
    const [savingCreate, setSavingCreate]=useState(false);

    const [createFormError, setCreateFormError]=useState("");
    const [editFormError, setEditFormError]=useState("");

    const [createForm, setCreateForm]=useState({
        categoryId:"",
        title:"",
        sku:"",
        shortDescription:"",
        description:"",
        pricingType:"",
        pricePerHour:"",
        estimatedDuration:""

    });


    useEffect(() => {

        const fetchData = async () => {

            try {

                setLoading(true);
                setError("");

                const [servicesResponse, categoriesResponse] =
                    await Promise.all([
                        fetch("http://localhost:3000/api/admin/services"),
                        fetch("http://localhost:3000/api/categories")
                    ]);

                if (
                    !servicesResponse.ok ||
                    !categoriesResponse.ok
                ) {
                    throw new Error(
                        "Failed to load service management data"
                    );
                }

                const servicesData =
                    await servicesResponse.json();

                const categoriesData =
                    await categoriesResponse.json();

                setServices(servicesData.data || []);
                setCategories(categoriesData.data || []);

            } catch (error) {

                console.error(
                    "Service management fetch error:",
                    error
                );

                setError(error.message);

            } finally {

                setLoading(false);

            }
        };

        fetchData();

    }, []);

    const getCategoryName = (categoryId) => {
    const category = categories.find(
        (item) => item._id === categoryId
    );

    return category?.name || "Category unavailable";
};


const handleToggleServiceStatus = async (service) => {
    try {
        const response = await fetch(
            `http://localhost:3000/api/admin/services/${service._id}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    isActive: !service.isActive
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Failed to update service status"
            );
        }

        setServices((previousServices) =>
            previousServices.map((item) =>
                item._id === data.data._id
                    ? data.data
                    : item
            )
        );

    } catch (error) {
        console.error(
            "Service status update error:",
            error
        );

        setError(error.message);
    }
};

const handleEditService = (service) => {
    setEditFormError("");
    setShowCreateForm(false);
    setCreateFormError("");
    setEditingService(service);

    setEditForm({
        categoryId:service.categoryId || "",
        title:service.title || "",
        sku:service.sku || "",
        shortDescription: service.shortDescription || "",
        description: service.description || "",
        pricingType: service.pricingType || "",
        pricePerHour: service.pricePerHour ?? "",
        estimatedDuration: service.estimatedDuration ?? ""
    })
};

const handleCancelEdit = () => {
    setEditFormError("");
    setEditingService(null);
};

const handleEditFormChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previousForm) => ({
        ...previousForm,
        [name]: value
    }));
};

const handleCreateFormChange = (event) => {
    const { name, value } = event.target;

    setCreateForm((previousForm) => ({
        ...previousForm,
        [name]: value
    }));
};
const handleSaveCreate = async (event) => {
    event.preventDefault();

    setCreateFormError("");

    if(
        !createForm.categoryId ||
        !createForm.title.trim() ||
        !createForm.sku.trim() ||
        !createForm.pricingType.trim()
    ){
        setCreateFormError(
            "Category, service title, SKU and pricing type are required."
        );
        return;
    }

    try {
        setSavingCreate(true);
        setError("");

        const response = await fetch(
            "http://localhost:3000/api/admin/services",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    categoryId: createForm.categoryId,
                    title: createForm.title,
                    sku: createForm.sku,
                    shortDescription:
                        createForm.shortDescription,
                    description:
                        createForm.description,
                    pricingType:
                        createForm.pricingType,
                    pricePerHour:
                        createForm.pricePerHour === ""
                            ? null
                            : Number(createForm.pricePerHour),
                    estimatedDuration:
                        createForm.estimatedDuration === ""
                            ? null
                            : Number(createForm.estimatedDuration)
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Failed to create service"
            );
        }

        setServices((previousServices) => [
            data.data,
            ...previousServices
        ]);

        setCreateForm({
            categoryId: "",
            title: "",
            sku: "",
            shortDescription: "",
            description: "",
            pricingType: "",
            pricePerHour: "",
            estimatedDuration: ""
        });

        setShowCreateForm(false);

    } catch (error) {
        console.error(
            "Service creation error:",
            error
        );

        setCreateFormError(error.message);

    } finally {
        setSavingCreate(false);
    }
};

const handleSaveEdit = async (event) => {
    event.preventDefault();

    if (!editingService) {
        return;
    }
    setEditFormError("");

    if(
        !editForm.categoryId ||
        !editForm.title.trim() ||
        !editForm.sku.trim() ||
        !editForm.pricingType.trim()
    ){
        setEditFormError(
            "Category, service title, SKU and pricing type are required."
        );
        return;
    }

    try {
        setSavingEdit(true);
        setError("");

        const response = await fetch(
            `http://localhost:3000/api/admin/services/${editingService._id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    categoryId: editForm.categoryId,
                    title: editForm.title,
                    sku: editForm.sku,
                    shortDescription: editForm.shortDescription,
                    description: editForm.description,
                    pricingType: editForm.pricingType,
                    pricePerHour:
                        editForm.pricePerHour === ""
                            ? null
                            : Number(editForm.pricePerHour),
                    estimatedDuration:
                        editForm.estimatedDuration === ""
                            ? null
                            : Number(editForm.estimatedDuration)
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Failed to update service"
            );
        }

        setServices((previousServices) =>
            previousServices.map((service) =>
                service._id === data.data._id
                    ? data.data
                    : service
            )
        );

        setEditingService(null);

    } catch (error) {
        console.error(
            "Service update error:",
            error
        );

        setEditFormError(error.message);

    } finally {
        setSavingEdit(false);
    }
};

    const filteredServices = services.filter((service) => {

        const search = searchTerm
            .trim()
            .toLowerCase();

        const matchesSearch =
            !search ||
            service.title
                ?.toLowerCase()
                .includes(search) ||
            service.sku
                ?.toLowerCase()
                .includes(search);


        const matchesCategory =
            selectedCategory === "all" ||
            service.categoryId === selectedCategory;


        const matchesStatus =
            selectedStatus === "all" ||
            (selectedStatus === "active" &&
                service.isActive === true) ||
            (selectedStatus === "inactive" &&
                service.isActive === false);


        return (
            matchesSearch &&
            matchesCategory &&
            matchesStatus
        );
    });


    if (loading) {
        return (
            <div className="admin-service-page">
                <p>Loading services...</p>
            </div>
        );
    }


    if (error) {
        return (
            <div className="admin-service-page">
                <p>{error}</p>
            </div>
        );
    }


    return (
        <div className="admin-service-page">

            <header className="admin-service-header">

                <div>
                    <h1>Service Management</h1>

                    <p>
                        Manage the services available to customers.
                    </p>
                </div>

                <button 
                type="button"
                onClick={()=>{
                    setCreateFormError("");
                    setShowCreateForm(true);
                    setEditingService(null);
                }}>Add New Service</button>
                
            </header>


            <section className="service-management-content">

                {showCreateForm && (
    <div className="service-edit-form">

        <div className="service-edit-header">

            <div>
                <h2>Add New Service</h2>

                <p>
                    Create a service under an existing category.
                </p>
            </div>

            <button
                type="button"
                onClick={() => setShowCreateForm(false)}
            >
                Cancel
            </button>

        </div>

        <form onSubmit={handleSaveCreate}>

            <div className="service-edit-grid">

                <div className="service-edit-field">

                    <label htmlFor="create-title">
                        Service Title
                    </label>

                    <input
                        id="create-title"
                        name="title"
                        type="text"
                        value={createForm.title}
                        onChange={handleCreateFormChange}
                        required
                    />

                </div>


                <div className="service-edit-field">

                    <label htmlFor="create-category">
                        Category
                    </label>

                    <select
                        id="create-category"
                        name="categoryId"
                        value={createForm.categoryId}
                        onChange={handleCreateFormChange}
                        required
                    >

                        <option value="">
                            Select Category
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

                </div>


                <div className="service-edit-field">

                    <label htmlFor="create-sku">
                        SKU
                    </label>

                    <input
                        id="create-sku"
                        name="sku"
                        type="text"
                        value={createForm.sku}
                        onChange={handleCreateFormChange}
                        required
                    />

                </div>


                <div className="service-edit-field">

                    <label htmlFor="create-pricing-type">
                        Pricing Type
                    </label>

                    <input
                        id="create-pricing-type"
                        name="pricingType"
                        type="text"
                        value={createForm.pricingType}
                        onChange={handleCreateFormChange}
                        required
                    />

                </div>


                <div className="service-edit-field">

                    <label htmlFor="create-price">
                        Price / Hour
                    </label>

                    <input
                        id="create-price"
                        name="pricePerHour"
                        type="number"
                        min="0"
                        value={createForm.pricePerHour}
                        onChange={handleCreateFormChange}
                    />

                </div>


                <div className="service-edit-field">

                    <label htmlFor="create-duration">
                        Estimated Duration
                    </label>

                    <input
                        id="create-duration"
                        name="estimatedDuration"
                        type="number"
                        min="0"
                        value={createForm.estimatedDuration}
                        onChange={handleCreateFormChange}
                    />

                </div>


                <div className="service-edit-field service-edit-full">

                    <label htmlFor="create-short-description">
                        Short Description
                    </label>

                    <input
                        id="create-short-description"
                        name="shortDescription"
                        type="text"
                        value={createForm.shortDescription}
                        onChange={handleCreateFormChange}
                    />

                </div>


                <div className="service-edit-field service-edit-full">

                    <label htmlFor="create-description">
                        Description
                    </label>

                    <textarea
                        id="create-description"
                        name="description"
                        rows="4"
                        value={createForm.description}
                        onChange={handleCreateFormChange}
                    />

                </div>

            </div>

            {editFormError && (
                <p role="alert" className="category-form-error"> 
                {editFormError}
                </p>
            )}

            {createFormError  && (
                <p role="alert" className="category-form-error">
                    {createFormError}
                </p>
            )}


            <div className="service-edit-actions">

                <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    disabled={savingCreate}
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={savingCreate}
                >
                    {savingCreate
                        ? "Publishing..."
                        : "Save & Publish Service"}
                </button>

            </div>

        </form>

    </div>
)}

                {editingService && (
    <div className="service-edit-form">

        <div className="service-edit-header">
            <div>
                <h2>Edit Service</h2>
                <p>
                    Update the details of the selected service.
                </p>
            </div>

            <button
                type="button"
                onClick={handleCancelEdit}
            >
                Cancel
            </button>
        </div>

        <form onSubmit={handleSaveEdit}>

            <div className="service-edit-grid">

                <div className="service-edit-field">
                    <label htmlFor="edit-title">
                        Service Title
                    </label>

                    <input
                        id="edit-title"
                        name="title"
                        type="text"
                        value={editForm.title}
                        onChange={handleEditFormChange}
                    />
                </div>


                <div className="service-edit-field">
                    <label htmlFor="edit-category">
                        Category
                    </label>

                    <select
                        id="edit-category"
                        name="categoryId"
                        value={editForm.categoryId}
                        onChange={handleEditFormChange}
                    >
                        <option value="">
                            Select Category
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
                </div>


                <div className="service-edit-field">
                    <label htmlFor="edit-sku">
                        SKU
                    </label>

                    <input
                        id="edit-sku"
                        name="sku"
                        type="text"
                        value={editForm.sku}
                        onChange={handleEditFormChange}
                    />
                </div>


                <div className="service-edit-field">
                    <label htmlFor="edit-pricing-type">
                        Pricing Type
                    </label>

                    <input
                        id="edit-pricing-type"
                        name="pricingType"
                        type="text"
                        value={editForm.pricingType}
                        onChange={handleEditFormChange}
                    />
                </div>


                <div className="service-edit-field">
                    <label htmlFor="edit-price">
                        Price / Hour
                    </label>

                    <input
                        id="edit-price"
                        name="pricePerHour"
                        type="number"
                        min="0"
                        value={editForm.pricePerHour}
                        onChange={handleEditFormChange}
                    />
                </div>


                <div className="service-edit-field">
                    <label htmlFor="edit-duration">
                        Estimated Duration
                    </label>

                    <input
                        id="edit-duration"
                        name="estimatedDuration"
                        type="number"
                        min="0"
                        value={editForm.estimatedDuration}
                        onChange={handleEditFormChange}
                    />
                </div>


                <div className="service-edit-field service-edit-full">
                    <label htmlFor="edit-short-description">
                        Short Description
                    </label>

                    <input
                        id="edit-short-description"
                        name="shortDescription"
                        type="text"
                        value={editForm.shortDescription}
                        onChange={handleEditFormChange}
                    />
                </div>


                <div className="service-edit-field service-edit-full">
                    <label htmlFor="edit-description">
                        Description
                    </label>

                    <textarea
                        id="edit-description"
                        name="description"
                        rows="4"
                        value={editForm.description}
                        onChange={handleEditFormChange}
                    />
                </div>

            </div>


            <div className="service-edit-actions">

                <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={savingEdit}
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={savingEdit}
                >
                    {savingEdit
                        ? "Saving..."
                        : "Save Changes"}
                </button>

            </div>

        </form>

    </div>
)}

                <div className="service-management-toolbar">

                    <input
                        type="text"
                        placeholder="Search services..."
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(event.target.value)
                        }
                    />


                    <select
                        value={selectedCategory}
                        onChange={(event) =>
                            setSelectedCategory(event.target.value)
                        }
                    >

                        <option value="all">
                            All Categories
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


                    <select
                        value={selectedStatus}
                        onChange={(event) =>
                            setSelectedStatus(event.target.value)
                        }
                    >

                        <option value="all">
                            All Status
                        </option>

                        <option value="active">
                            Active
                        </option>

                        <option value="inactive">
                            Inactive
                        </option>

                    </select>

                </div>


                <div className="service-table-container">

                    <table className="service-table">

                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>Category</th>
                                <th>SKU</th>
                                <th>Price / Hour</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>


                        <tbody>

                            {filteredServices.length === 0 ? (

                                <tr>
                                    <td colSpan="6">
                                        No services found.
                                    </td>
                                </tr>

                            ) : (

                                filteredServices.map((service) => (

                                    <tr key={service._id}>

                                        <td>
                                            {service.title}
                                        </td>

                                        <td>
                                            {getCategoryName(service.categoryId)}
                                        </td>

                                        <td>
                                            {service.sku}
                                        </td>

                                        <td>
                                            ₹{service.pricePerHour}
                                        </td>

                                        <td>

                                            <span
                                                className={
                                                    `status ${
                                                        service.isActive
                                                            ? "active"
                                                            : "inactive"
                                                    }`
                                                }
                                            >
                                                {service.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>

                                        </td>

                                        <td>

                                            <button type="button"
                                            onClick={()=> handleEditService(service)}>
                                                Edit
                                            </button>

                                            <button type="button"
                                            onClick={()=>handleToggleServiceStatus(service)}>
                                                {service.isActive
                                                    ? "Pause"
                                                    : "Activate"}
                                            </button>

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </section>

        </div>
    );
}

export default ServiceManagement;