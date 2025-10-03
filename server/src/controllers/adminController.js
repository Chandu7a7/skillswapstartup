// server/src/controllers/adminController.js
import User from '../models/UserModel.js';
import SkillSwap from '../models/SkillSwapModel.js';
import Session from '../models/Session.js';
import { subDays, format } from 'date-fns'; 

export const getSiteStats = async (req, res) => {
  try {
    const [userCount, swapCount, sessionCount] = await Promise.all([
      User.countDocuments(),
      SkillSwap.countDocuments(),
      Session.countDocuments(),
    ]);
    res.status(200).json({
      success: true,
      data: { users: userCount, swaps: swapCount, sessions: sessionCount },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


export const getUserSignupsByDay = async (req, res) => {
    try {
        const sevenDaysAgo = subDays(new Date(), 7);

        const signupData = await User.aggregate([
            // 1. Find users created in the last 7 days
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            // 2. Group them by the date they were created
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            // 3. Sort by date
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({ success: true, data: signupData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


export const getSwapStatusDistribution = async (req, res) => {
    try {
        const swapData = await SkillSwap.aggregate([
            {
                $group: {
                    _id: '$status', // Group by the 'status' field
                    count: { $sum: 1 }
                }
            }
        ]);
        res.status(200).json({ success: true, data: swapData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};