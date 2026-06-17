const ImageKit = require("imagekit");
const path = require('path');

let imagekit = null;
try {
    if (process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT) {
        imagekit = new ImageKit({
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
        });
    } else {
        console.warn("⚠️ ImageKit credentials missing. Uploads will fail until keys are provided in .env");
    }
} catch (error) {
    console.error("⚠️ Failed to initialize ImageKit:", error.message);
}

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file provided' });
        }

        if (!imagekit) {
            return res.status(500).json({ success: false, message: 'ImageKit is not configured on the server. Please add API keys to .env' });
        }

        const folderPath = req.body.folder || '/rehablito/documents';
        
        // Ensure it has an extension for ImageKit to infer MIME type correctly
        const ext = path.extname(req.file.originalname) || '';
        const fileName = `doc_${Date.now()}${ext}`;

        const uploadResponse = await new Promise((resolve, reject) => {
            imagekit.upload({
                file: req.file.buffer.toString('base64'),
                fileName: fileName,
                folder: folderPath,
                useUniqueFileName: true
            }, function(error, result) {
                if (error) reject(error);
                else resolve(result);
            });
        });

        res.status(200).json({ 
            success: true, 
            message: 'File uploaded successfully', 
            url: uploadResponse.url 
        });

    } catch (error) {
        console.error('File Upload Error:', error);
        res.status(500).json({ success: false, message: 'Server Error during upload', error: error.message });
    }
};
