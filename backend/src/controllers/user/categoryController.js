const {
    getActiveCategories,
    getCategoryById
} = require("../../services/categoryService");

const getCategories = async (req, res) => {
    try {
        const categories = await getActiveCategories();

        return res.status(200).json({
            success: true,
            message: "Categories fetched successfully",
            data: categories
        });
    } catch (error) {
        console.error(
            "Category fetch error:",
            error.message
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch categories"
        });
    }
};

const getCategory = async (req, res) => {
    try {
        const category = await getCategoryById(
            req.params.id
        );

        return res.status(200).json({
            success: true,
            message: "Category fetched successfully",
            data: category
        });
    } catch (error) {
        console.error(
            "Category fetch error:",
            error.message
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch category"
        });
    }
};

module.exports = {
    getCategories,
    getCategory
};