const multer = require("multer")


const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 3 * 1024 * 1024, // 3MB
    },
    fileFilter: (req, file, callback) => {
        const isPdf = file.mimetype === "application/pdf" ||
            file.originalname.toLowerCase().endsWith(".pdf");

        if (!isPdf) {
            return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "resume"));
        }

        callback(null, true);
    },
});

module.exports = upload