const Category = require("../models/Category");



const getAllcategories=async()=>{
    return await Category.find().sort({
        createdAt:-1
    });
}
const getActiveCategories = async () => {
    return await Category.find({
        isActive: true
    }).sort({
        name: 1
    });
};

const getCategoryById = async (categoryId) => {
    const category = await Category.findById(categoryId);

    if (!category) {
        const error = new Error("Category not found");
        error.statusCode = 404;
        throw error;
    }

    return category;
};

const createCategory = async ({ name, icon, description }) => {
    if (!name) {
        const error = new Error("Category name is required");
        error.statusCode = 400;
        throw error;
    }

    const normalizedName = name.trim();

    const existingCategory = await Category.findOne({
        name: normalizedName
    });

    if (existingCategory) {
        const error = new Error("Category already exists");
        error.statusCode = 409;
        throw error;
    }

    return await Category.create({
        name: normalizedName,
        icon: icon || null,
        description: description ? description.trim() : null
    });
};

const updateCategory = async (
    categoryId,
    { name, icon, description }
) => {
    const category = await Category.findById(categoryId);

    if (!category) {
        const error = new Error("Category not found");
        error.statusCode = 404;
        throw error;
    }

    if (name !== undefined) {
        const normalizedName = name.trim();

        const existingCategory = await Category.findOne({
            name: normalizedName,
            _id: { $ne: categoryId }
        });

        if (existingCategory) {
            const error = new Error("Category already exists");
            error.statusCode = 409;
            throw error;
        }

        category.name = normalizedName;
    }

    if (icon !== undefined) {
        category.icon = icon;
    }

    if (description !== undefined) {
        category.description = description;
    }

    return await category.save();
};

const updateCategoryStatus = async (categoryId, isActive) => {
    if (typeof isActive !== "boolean") {
        const error = new Error("isActive must be a boolean");
        error.statusCode = 400;
        throw error;
    }

    const category = await Category.findByIdAndUpdate(
        categoryId,
        { isActive },
        {
            returnDocument:"after",
            runValidators: true
        }
    );

    if (!category) {
        const error = new Error("Category not found");
        error.statusCode = 404;
        throw error;
    }

    return category;
};

module.exports = {
    getAllcategories,
    getActiveCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    updateCategoryStatus
};