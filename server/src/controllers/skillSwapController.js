// server/src/controllers/skillSwapController.js

import SkillSwap from '../models/SkillSwapModel.js';
import User from '../models/UserModel.js';
import { checkAchievements } from '../services/achievementService.js';
import { sendEmail } from '../services/emailService.js';

//----------------------- Create new Swap loged in user  -----------------------

export const createSwapRequest = async (req, res) => {
  try {
    const { receiverId, skillOffered, skillWanted, message, preferredTime } = req.body;
    const requesterId = req.user.id;

    // --- Validation logic is the same and correct ---
    if (!receiverId || !skillOffered || !skillWanted || !message) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }
    if (requesterId === receiverId) {
      return res.status(400).json({ success: false, message: 'You cannot swap skills with yourself.' });
    }
    const receiverExists = await User.findById(receiverId);
    if (!receiverExists) {
      return res.status(404).json({ success: false, message: 'The user you are trying to swap with does not exist.' });
    }

    const newSwap = new SkillSwap({
      requester: requesterId,
      receiver: receiverId,
      skillOffered,
      skillWanted,
      message,
      preferredTime,
    });

    const savedSwap = await newSwap.save();
     const receiver = await User.findById(savedSwap.receiver);

      if (receiver && receiver.email) {
      await sendEmail({
        to: receiver.email,
        subject: 'You have a new Skill Swap request!',
        text: `Hi ${receiver.name}, ${req.user.name} has sent you a request to swap skills. Log in to your SkillSwap account to respond.`,
        html: `
          <h1>New Skill Swap Request!</h1>
          <p>Hi ${receiver.name},</p>
          <p><strong>${req.user.name}</strong> has sent you a request to learn <strong>${savedSwap.skillWanted}</strong> in exchange for <strong>${savedSwap.skillOffered}</strong>.</p>
          <p>Log in to your SkillSwap account to accept or decline the request.</p>
        `
      });
    }
    
    // --- THIS IS THE NEW REAL-TIME NOTIFICATION PART ---
    // 1. Get the real-time server objects from the request
    const { io, userSocketMap } = req;

    // 2. Find the socket ID of the user who is RECEIVING the request
    const receiverSocketId = userSocketMap[savedSwap.receiver.toString()];

    // 3. If the receiver is currently online, send them a notification
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newSwapRequest", {
        message: `You have a new swap request from ${req.user.name}!`,
        swapId: savedSwap._id,
      });
      console.log(`Notification sent to receiver ${savedSwap.receiver.toString()}`);
    }

    res.status(201).json({
      success: true,
      message: 'Swap request sent successfully!',
      data: savedSwap,
    });
  } catch (error) {
    console.error('Error creating swap request:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


//-------------- Get all swaps related to the logged-in user  -----------------------

export const getMySwaps = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all swaps where the user is either the requester OR the receiver
    const swaps = await SkillSwap.find({ $or: [{ requester: userId }, { receiver: userId }] })
      .populate('requester', 'name profilePicture location reviews')
      .populate('receiver', 'name profilePicture location reviews')
      .sort({ createdAt: -1 }); // Show the newest swaps first

    res.status(200).json({
      success: true,
      count: swaps.length,
      data: swaps,
    });
  } catch (error) {
    console.error('Error fetching swaps:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


//-----------------Update the status of a swap request ------------------------------

export const updateSwapStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const swapId = req.params.id;
    const userId = req.user.id;

    const allowedStatus = ['accepted', 'rejected', 'completed', 'cancelled'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update.' });
    }

    const swap = await SkillSwap.findById(swapId);

    if (!swap) {
      return res.status(404).json({ success: false, message: 'Swap request not found.' });
    }

    // --- Authorization Check with CORRECTED LOGIC ---
    // Only the receiver can accept or reject a pending request
    if (swap.status === 'pending' && (status === 'accepted' || status === 'rejected')) {
      if (swap.receiver.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'You are not authorized to perform this action.' });
      }
    }
    // Either user can cancel an accepted request
    else if (swap.status === 'accepted' && status === 'cancelled') {
      if (swap.requester.toString() !== userId && swap.receiver.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'You are not authorized to perform this action.' });
      }
    }
    // Add logic here later for 'completed' if needed
    else if (swap.status === 'accepted' && status === 'completed') {
      // You might want to check if either user is part of the swap
      if (swap.requester.toString() !== userId && swap.receiver.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'You are not authorized to perform this action.' });
      }
    }
    else {
      // If the transition is not allowed (e.g., trying to accept an already accepted swap), send an error
      return res.status(400).json({ success: false, message: `Cannot change status from ${swap.status} to ${status}.` });
    }

     if (status === 'completed') {
    // This part updates the 'swapsCompleted' count
    await User.updateMany(
      { _id: { $in: [swap.requester, swap.receiver] } },
      { $inc: { swapsCompleted: 1 } }
    );
    
    // --- NEW: Check for achievements for both users ---
    await checkAchievements(swap.requester.toString());
    await checkAchievements(swap.receiver.toString());
  }
  
    swap.status = status;
    const updatedSwap = await swap.save();

    res.status(200).json({
      success: true,
      message: `Swap request has been ${status}.`,
      data: updatedSwap,
    });
  } catch (error) {
    console.error('Error updating swap status:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


//-----------------GetSwap By ID----------------------

export const getSwapById = async (req, res) => {
  try {
    const swapId = req.params.id;
    const userId = req.user.id;

    const swap = await SkillSwap.findById(swapId)
      .populate('requester', '-password') // Populate with full user details, except password
      .populate('receiver', '-password');

    if (!swap) {
      return res.status(404).json({ success: false, message: 'Swap not found.' });
    }

    // Authorization: Make sure the logged-in user is part of this swap
    const isParticipant = swap.requester.id === userId || swap.receiver.id === userId;
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this swap.' });
    }

    res.status(200).json({ success: true, data: swap });
  } catch (error) {
    console.error('Error fetching swap by ID:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

//----------------------markRequestsAsRead ---------------------
export const markRequestsAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await SkillSwap.updateMany(
            { receiver: userId, isRead: false },
            { $set: { isRead: true } }
        );
        res.status(200).json({ success: true, message: "All requests marked as read." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};