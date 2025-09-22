import mongoose from 'mongoose';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import Joi from 'joi';

// MongoDB Schema for blog posts
const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  date: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  imagePublicId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

let BlogPost;
try {
  BlogPost = mongoose.model('BlogPost');
} catch {
  BlogPost = mongoose.model('BlogPost', blogSchema);
}

// Validation schema
const blogValidationSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  date: Joi.string().required(),
  content: Joi.string().min(1).required()
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Database connection
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);
    cachedDb = db;
    return db;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// Upload image to Cloudinary
async function uploadToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        public_id: `blog_images/${Date.now()}_${filename}`,
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    await connectToDatabase();

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

// Get all blog posts
async function handleGet(req, res) {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 });
    return res.status(200).json({ posts });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch posts' });
  }
}

// Create new blog post
async function handlePost(req, res) {
  return new Promise((resolve) => {
    upload.single('uploadimage')(req, res, async (err) => {
      if (err) {
        return resolve(res.status(400).json({ error: err.message }));
      }

      try {
        const { title, date, content } = req.body;

        // Validate input
        const { error } = blogValidationSchema.validate({ title, date, content });
        if (error) {
          return resolve(res.status(400).json({ error: error.details[0].message }));
        }

        let imageUrl = null;
        let imagePublicId = null;

        // Upload image if provided
        if (req.file) {
          try {
            const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);
            imageUrl = uploadResult.secure_url;
            imagePublicId = uploadResult.public_id;
          } catch (uploadError) {
            console.error('Image upload error:', uploadError);
            return resolve(res.status(500).json({ error: 'Failed to upload image' }));
          }
        }

        // Create blog post
        const blogPost = new BlogPost({
          title,
          date,
          content,
          imageUrl,
          imagePublicId
        });

        await blogPost.save();

        return resolve(res.status(201).json({ 
          message: 'Post created successfully', 
          post: blogPost 
        }));
      } catch (error) {
        console.error('Post creation error:', error);
        return resolve(res.status(500).json({ error: 'Failed to create post' }));
      }
    });
  });
}

// Delete blog post
async function handleDelete(req, res) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Post ID is required' });
    }

    const post = await BlogPost.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Delete image from Cloudinary if it exists
    if (post.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(post.imagePublicId);
      } catch (error) {
        console.error('Failed to delete image from Cloudinary:', error);
      }
    }

    await BlogPost.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete post' });
  }
}