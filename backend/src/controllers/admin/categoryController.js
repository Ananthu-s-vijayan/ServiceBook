const {
    getAllcategories,
    createCategory,
    updateCategory,
    updateCategoryStatus
} = require("../../services/categoryService");


const create = async (req, res) => {
    try {
        // Use the uploaded file path when a file is provided;
// otherwise, preserve the icon value supplied in the request body.
const category = await createCategory({
    ...req.body,
    ...(req.file && {
        icon: `/uploads/categories/${req.file.filename}`
    })
});

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category
        });
    } catch (error) {
        console.error(
            "Category creation error:",
            error.message
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.message ||
                "Category creation failed"
        });
    }
};

const update = async (req, res) => {
    try {
        const category = await updateCategory(
            req.params.id,
            {
                ...req.body,
                ...(req.file && {
                    icon: `/uploads/categories/${req.file.filename}`
                })
            }
        );

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: category
        });
    } catch (error) {
        console.error(
            "Category update error:",
            error.message
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.message ||
                "Category update failed"
        });
    }
};

const updateStatus = async (req, res) => {
    try {
        const category = await updateCategoryStatus(
            req.params.id,
            req.body.isActive
        );

        return res.status(200).json({
            success: true,
            message: "Category status updated successfully",
            data: category
        });
    } catch (error) {
        console.error(
            "Category status update error:",
            error.message
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Category status update failed"
        });
    }
};

const getAll=async(req,res)=>{
    try{
        const categories=await getAllcategories();
        
        return res.status(200).json({
            success:true,
            data:categories
        })
    }catch(error){
        console.error(
            "Category fetch error:",
            error.message
        )

        return res.status(error.statusCode || 500).json({
            success:false,
            message:error.message|| "Failed to fetch categories"
        });
    }
}

module.exports = {
    create,
    update,
    updateStatus,
    getAll
};