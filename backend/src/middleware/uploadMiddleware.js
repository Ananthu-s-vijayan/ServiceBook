const multer = require("multer");
const path = require("path");
const fs = require("fs");

const categoriesUploadPath = path.join(
    __dirname,
    "../../uploads/categories"
);

const profilesUploadPath = path.join(
    __dirname,
    "../../uploads/profiles"
);

// Make sure upload directories exist.
fs.mkdirSync(categoriesUploadPath, {
    recursive: true
});

fs.mkdirSync(profilesUploadPath, {
    recursive: true
});

const createStorage = (destination) => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, destination);
        },

        filename: (req, file, cb) => {
            const extension =
                path.extname(file.originalname);

            const uniqueName =
                `${Date.now()}-${Math.round(
                    Math.random() * 1E9
                )}${extension}`;

            cb(null, uniqueName);
        }
    });
};

const imageFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (
        allowedMimeTypes.includes(
            file.mimetype
        )
    ) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Only JPEG, PNG and WebP images are allowed"
            )
        );
    }
};

const categoryUpload = multer({
    storage: createStorage(
        categoriesUploadPath
    ),

    fileFilter: imageFilter,

    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

const profileUpload = multer({
    storage: createStorage(
        profilesUploadPath
    ),

    fileFilter: imageFilter,

    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = {
    categoryUpload,
    profileUpload
};