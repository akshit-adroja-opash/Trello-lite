import mongoose from 'mongoose';

/**
 * Initializes and returns the MongoDB Atlas GridFSBucket instance.
 */
export const getGridFSBucket = () => {
  if (!mongoose.connection || !mongoose.connection.db) {
    throw new Error('MongoDB database connection is not ready');
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
};

/**
 * Uploads a file buffer directly into MongoDB Atlas GridFS.
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Unique filename (e.g. uuid.png)
 * @param {string} mimetype - Content-Type (e.g. image/png)
 * @param {string} category - Category subfolder name (e.g. 'avatars', 'cards', 'reports')
 * @returns {Promise<string>} - Resolves to relative URL path e.g. /uploads/avatars/filename.png
 */
export const uploadBufferToGridFS = (buffer, filename, mimetype, category = 'general') => {
  return new Promise((resolve, reject) => {
    try {
      const bucket = getGridFSBucket();
      const uploadStream = bucket.openUploadStream(filename, {
        contentType: mimetype,
        metadata: { category, uploadedAt: new Date() }
      });

      uploadStream.on('error', (err) => {
        console.error('GridFS Upload Error:', err);
        reject(err);
      });

      uploadStream.on('finish', () => {
        const relativeUrl = category ? `/uploads/${category}/${filename}` : `/uploads/${filename}`;
        resolve(relativeUrl);
      });

      uploadStream.end(buffer);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Opens a writable stream to directly upload data (e.g. PDF generation) into GridFS.
 * @param {string} filename - Unique filename
 * @param {string} mimetype - Content-Type
 * @param {string} category - Category name
 * @returns {import('mongodb').GridFSBucketWriteStream}
 */
export const openGridFSUploadStream = (filename, mimetype, category = 'general') => {
  const bucket = getGridFSBucket();
  return bucket.openUploadStream(filename, {
    contentType: mimetype,
    metadata: { category, uploadedAt: new Date() }
  });
};

/**
 * Deletes a file from GridFS by its filename.
 * @param {string} filename - Filename to delete
 * @returns {Promise<boolean>}
 */
export const deleteFromGridFS = async (filename) => {
  try {
    if (!mongoose.connection || !mongoose.connection.db) return false;
    const bucket = getGridFSBucket();
    const files = await bucket.find({ filename }).toArray();
    if (!files || files.length === 0) {
      return false;
    }
    for (const file of files) {
      await bucket.delete(file._id);
    }
    return true;
  } catch (error) {
    console.error(`Failed to delete file ${filename} from GridFS:`, error.message);
    return false;
  }
};

/**
 * Express middleware to serve files stored in GridFS.
 * Intercepts GET /uploads/:category/:filename or GET /uploads/:filename
 */
export const serveGridFSFile = async (req, res, next) => {
  try {
    const { category, filename } = req.params;
    const targetFilename = filename || category;

    if (!mongoose.connection || !mongoose.connection.db) {
      return next();
    }

    const bucket = getGridFSBucket();
    const files = await bucket.find({ filename: targetFilename }).toArray();

    if (!files || files.length === 0) {
      return next(); // Fallback to disk static storage or 404
    }

    const file = files[0];
    let contentType = file.contentType || file.metadata?.contentType;
    if (!contentType) {
      if (targetFilename.endsWith('.pdf')) contentType = 'application/pdf';
      else if (targetFilename.endsWith('.png')) contentType = 'image/png';
      else if (targetFilename.match(/\.(jpg|jpeg)$/i)) contentType = 'image/jpeg';
      else contentType = 'application/octet-stream';
    }
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', file.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    const downloadStream = bucket.openDownloadStreamByName(targetFilename);
    downloadStream.on('error', (err) => {
      console.error('GridFS stream error:', err);
      if (!res.headersSent) {
        res.status(500).send('Error streaming file from Atlas storage');
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('serveGridFSFile error:', error.message);
    next();
  }
};
