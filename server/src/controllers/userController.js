// src/controllers/userController.js
import User from '../models/UserModel.js';
import cloudinary from '../config/cloudinary.js'; // 1. Import Cloudinary config
import DatauriParser from 'datauri/parser.js'; // 2. Import DataURI
import path from 'path';

 // -------------------------------- Get All user Dashboard-------------------------------



export const getAllUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    
    // 1. Get filter and pagination options from the URL query
    const { location, availability, skillsOffered, page = 1, limit = 15 } = req.query;

    // 2. Build the base query object
    const query = { _id: { $ne: loggedInUserId } };

    // 3. Dynamically add filters to the query if they exist
    if (location) {
      query.location = new RegExp(location, 'i'); // Case-insensitive search
    }
    if (availability) {
      query.availability = availability;
    }
    if (skillsOffered) {
      query.skillsOffered = new RegExp(skillsOffered, 'i');
    }
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // 4. Get the total count for the filtered query
    const totalUsers = await User.countDocuments(query);

    // 5. Find the users using the combined query with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalUsers / limitNum),
      }
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ... (The rest of your userController is the same)


// ----------------------------------Get UserByID-------------------------------

export const getUserById  = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error)
{
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


//--------------------------Update Profile------------------------------------------------------

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    // Text data now comes from req.body
    const { name, location, skillsOffered, skillsWanted, availability, github, linkedin } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // --- NEW IMAGE UPLOAD LOGIC ---
    if (req.file) {
      const parser = new DatauriParser();
      // Format the buffer from multer into a data URI
      const dataUri = parser.format(path.extname(req.file.originalname).toString(), req.file.buffer);
      
      // Upload the image to Cloudinary
      const result = await cloudinary.uploader.upload(dataUri.content, {
        folder: "skillswap_profiles" // Optional: organize uploads in a folder
      });
      
      // Save the public URL from Cloudinary to the user profile
      user.profilePicture = result.secure_url;
    }

    // Update text fields
    user.name = name ?? user.name;
    user.location = location ?? user.location;
    user.skillsOffered = skillsOffered ?? user.skillsOffered;
    user.skillsWanted = skillsWanted ?? user.skillsWanted;
    user.availability = availability ?? user.availability;
    user.github = github ?? user.github;
    user.linkedin = linkedin ?? user.linkedin;

    const updatedUser = await user.save();
    
    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: userResponse,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

//----------------------------------AddReview----------------------------------------
export const addReviewToUser = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const reviewedUserId = req.params.id; // The ID of the user being reviewed
    const reviewerId = req.user.id; // The ID of the logged-in user (reviewer)
    const reviewerName = req.user.name; // The name of the logged-in user

    if (reviewedUserId === reviewerId) {
      return res.status(400).json({ success: false, message: 'You cannot review yourself.' });
    }

    const userToReview = await User.findById(reviewedUserId);

    if (!userToReview) {
      return res.status(404).json({ success: false, message: 'User to review not found' });
    }
    
    // Check if the user has already reviewed this person
    const alreadyReviewed = userToReview.reviews.find(
      (r) => r.reviewerId.toString() === reviewerId.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this user.' });
    }

    // Create the new review object
    const review = {
      reviewerId,
      reviewerName,
      rating: Number(rating),
      comment,
    };

    // Add the new review to the user's reviews array
    userToReview.reviews.unshift(review);

    await userToReview.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};