import { useEffect, useState } from "react";

import "./CategoryManagement.css";

function CategoryManagement() {

    const [categories, setCategories] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");

    const [showAddForm, setShowAddForm]=useState(false);

    const [categoryName, setCategoryName]=useState("");
    const [categoryIcon, setCategoryIcon]=useState(null);
    const [categoryDescription, setCategoryDescription]=useState("");

    const [formError, setFormError]=useState("");
    const [submitting, setSubmitting]=useState(false);

    const [editingCategory, setEditingCategory] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {

        const fetchCategories = async () => {

            try {

                setLoading(true);
                setError("");

                const response = await fetch(
                    "http://localhost:3000/api/admin/categories"
                );

                if (!response.ok) {
                    throw new Error(
                        "Failed to load categories"
                    );
                }

                const data = await response.json();

                setCategories(data.data || []);

            } catch (error) {

                console.error(
                    "Category fetch error:",
                    error
                );

                setError(error.message);

            } finally {

                setLoading(false);

            }
        };

        fetchCategories();

    }, []);


   const handleAddCategory = async (event) => {
    event.preventDefault();

    setFormError("");

    if (!categoryName.trim()) {
        setFormError("Category name is required");
        return;
    }

    try {
        setSubmitting(true);

        const formData = new FormData();

        formData.append(
            "name",
            categoryName.trim()
        );

        formData.append(
            "description",
            categoryDescription.trim()
        );

        if (categoryIcon) {
            formData.append(
                "icon",
                categoryIcon
            );
        }

        const response = await fetch(
            "http://localhost:3000/api/admin/categories",
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Failed to create category"
            );
        }

        setCategories((previousCategories) => [
            data.data,
            ...previousCategories
        ]);

        setCategoryName("");
        setCategoryIcon(null);
        setCategoryDescription("");

        setShowAddForm(false);

    } catch (error) {
        console.error(
            "Category creation error:",
            error
        );

        setFormError(error.message);

    } finally {
        setSubmitting(false);
    }
};

const handleEditCategory = async (event) => {
    event.preventDefault();

    setFormError("");

    if (!categoryName.trim()) {
        setFormError("Category name is required");
        return;
    }

    if (!editingCategory) {
        return;
    }

    try {
        setSubmitting(true);

        const formData = new FormData();

        formData.append(
            "name",
            categoryName.trim()
        );

        formData.append(
            "description",
            categoryDescription.trim()
        );

        if (categoryIcon) {
            formData.append(
                "icon",
                categoryIcon
            );
        }

        const response = await fetch(
            `http://localhost:3000/api/admin/categories/${editingCategory._id}`,
            {
                method: "PUT",
                body: formData
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Failed to update category"
            );
        }

        setCategories((previousCategories) =>
            previousCategories.map((category) =>
                category._id === data.data._id
                    ? data.data
                    : category
            )
        );

        setEditingCategory(null);
        setCategoryName("");
        setCategoryIcon(null);
        setCategoryDescription("");
        setFormError("");

    } catch (error) {
        console.error(
            "Category update error:",
            error
        );

        setFormError(error.message);

    } finally {
        setSubmitting(false);
    }
};

const handleToggleCategoryStatus = async (category) => {
    try {
        const response = await fetch(
            `http://localhost:3000/api/admin/categories/${category._id}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    isActive: !category.isActive
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Failed to update category status"
            );
        }

        setCategories((previousCategories) =>
            previousCategories.map((item) =>
                item._id === data.data._id
                    ? data.data
                    : item
            )
        );

    } catch (error) {
        console.error(
            "Category status update error:",
            error
        );

        setError(error.message);
    }
};


    const filteredCategories = categories.filter(
        (category) => {

            const search =
                searchTerm
                    .trim()
                    .toLowerCase();

            const matchesSearch =
                !search ||
                category.name
                    ?.toLowerCase()
                    .includes(search) ||
                category.description
                    ?.toLowerCase()
                    .includes(search);


            const matchesStatus =
                selectedStatus === "all" ||
                (selectedStatus === "active" &&
                    category.isActive === true) ||
                (selectedStatus === "inactive" &&
                    category.isActive === false);


            return (
                matchesSearch &&
                matchesStatus
            );
        }
    );


    if (loading) {

        return (
            <div className="admin-category-page">

                <p>Loading categories...</p>

            </div>
        );

    }


    if (error) {

        return (
            <div className="admin-category-page">

                <p>{error}</p>

            </div>
        );

    }


    return (
        <div className="admin-category-page">

            <header className="admin-category-header">

                <div>

                    <h1>Category Management</h1>

                    <p>
                        Manage the categories available
                        for services.
                    </p>

                </div>


                <button className="add-category-btn"
                onClick={()=>{
                    setEditingCategory(null);
                    setCategoryName("");
                    setCategoryIcon(null);
                    setCategoryDescription("");
                    setFormError("");
                    setShowAddForm(true);
                }}>
                    + Add Category
                </button>

            </header>

            {(showAddForm || editingCategory) && (
    <section className="add-category-form-container">

        <div className="add-category-form-header">
            <div>
                <h2>{editingCategory
                    ? "Edit Category" : "Add Category"}</h2>
                <p>
                    {editingCategory
                    ? "update the service category." : "Create a new service category."}
                </p>
            </div>

            <button
                type="button"
                className="close-category-form-btn"
                onClick={() => {
                    setShowAddForm(false);
                    setEditingCategory(null);
                    setCategoryName("");
                    setCategoryIcon(null);
                    setCategoryDescription("");
                    setFormError("");
                }}
            >
                ×
            </button>
        </div>


        <form onSubmit={editingCategory
            ? handleEditCategory : handleAddCategory
        }>

            <div className="category-form-field">

                <label>
                    Category Name
                </label>

                <input
                    type="text"
                    placeholder="Enter category name"
                    value={categoryName}
                    onChange={(event) =>
                        setCategoryName(event.target.value)
                    }
                />

            </div>


            <div className="category-form-field">

                <label>
                    Category Icon
                </label>

                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                        setCategoryIcon(event.target.files[0] || null)
                    }
                />

            </div>


            <div className="category-form-field">

                <label>
                    Description
                </label>

                <textarea
                    placeholder="Enter category description"
                    value={categoryDescription}
                    onChange={(event) =>
                        setCategoryDescription(
                            event.target.value
                        )
                    }
                    rows="4"
                />

            </div>


            {formError && (
                <p className="category-form-error">
                    {formError}
                </p>
            )}


            <div className="category-form-actions">

                <button
                    type="button"
                    className="cancel-category-btn"
                    onClick={() => {
                        setShowAddForm(false);
                        setFormError("");
                    }}
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    className="save-category-btn"
                    disabled={submitting}
                >
                    {submitting
                        ? editingCategory ? "Updating..." : "Creating..." 
                    : editingCategory
                    ? "Update Category" : "Create Category"}
                </button>

            </div>

        </form>

    </section>
)}


            <section className="category-management-content">

                <div className="category-management-toolbar">

                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(
                                event.target.value
                            )
                        }
                    />


                    <select
                        value={selectedStatus}
                        onChange={(event) =>
                            setSelectedStatus(
                                event.target.value
                            )
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


                <div className="category-table-container">

                    <table className="category-table">

                        <thead>

                            <tr>

                                <th>Category</th>

                                <th>Icon</th>

                                <th>Description</th>

                                <th>Status</th>

                                <th>Actions</th>

                            </tr>

                        </thead>


                        <tbody>

                            {filteredCategories.length === 0 ? (

                                <tr>

                                    <td colSpan="5">
                                        No categories found.
                                    </td>

                                </tr>

                            ) : (

                                filteredCategories.map(
                                    (category) => (

                                        <tr
                                            key={category._id}
                                        >

                                            <td>
                                                {category.name}
                                            </td>

                                            <td>
                                                {category.icon ? (
                                                    <img
                                                    src={`http://localhost:3000${category.icon}`}
                                                    alt={category.name}
                                                    className="category-icon-image"
                                                    />
                                                ) : (
                                                    "-"
                                                    )}
                                            </td>

                                            <td>
                                                {category.description || "-"}
                                            </td>

                                            <td>

                                                <span
                                                    className={
                                                        `status ${
                                                            category.isActive
                                                                ? "active"
                                                                : "inactive"
                                                        }`
                                                    }
                                                >
                                                    {category.isActive
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>

                                            </td>

                                            <td>

                                                <button
                                                type="button"
                                                onClick={()=>{
                                                    setEditingCategory(category);
                                                    setCategoryName(category.name || "");
                                                    setCategoryIcon(null);
                                                    setCategoryDescription(
                                                        category.description || ""
                                                    );
                                                    setFormError("");
                                                }}>
                                                    Edit
                                                </button>

                                                <button 
                                                type="button"
                                                onClick={()=>
                                                    handleToggleCategoryStatus(category)
                                                }>
                                                    {category.isActive
                                                        ? "Deactivate"
                                                        : "Activate"}
                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </section>

        </div>
    );
}

export default CategoryManagement;