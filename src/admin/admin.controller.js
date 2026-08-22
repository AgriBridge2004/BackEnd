import {
  getPlatformStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  verifyUserByAdmin,
  deleteUserByAdmin,
  getRevenueReport,
  getDealGrowthOverTime,
  getRecentOpenDisputes,
} from './admin.service.js';

// ============================================================
// US-43: Platform Overview Dashboard
// ============================================================
export const getPlatformStatsController = async (req, res) => {
  try {
    const { period } = req.query; // 'week' | 'month' (default: 'week')
    const stats = await getPlatformStats(period);
    return res.status(200).json({
      message: 'Platform stats retrieved successfully',
      data: stats,
    });
  } catch (error) {
    console.error('GET PLATFORM STATS ERROR:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// ============================================================
// Deal Growth Over Time (chart data)
// ============================================================
export const getDealGrowthController = async (req, res) => {
  try {
    const { weeks } = req.query;
    const data = await getDealGrowthOverTime(weeks ? Number(weeks) : undefined);
    return res.status(200).json({
      message: 'Deal growth data retrieved successfully',
      data,
    });
  } catch (error) {
    console.error('GET DEAL GROWTH ERROR:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// ============================================================
// Recent Open Disputes (Action Required list)
// ============================================================
export const getRecentDisputesController = async (req, res) => {
  try {
    const { limit } = req.query;
    const data = await getRecentOpenDisputes(limit ? Number(limit) : undefined);
    return res.status(200).json({
      message: 'Recent open disputes retrieved successfully',
      data,
    });
  } catch (error) {
    console.error('GET RECENT DISPUTES ERROR:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// ============================================================
// US-44: Manage Users
// ============================================================
export const getAllUsersController = async (req, res) => {
  try {
    const { role, isSuspended, email, limit, offset } = req.query;

    const filters = {
      role,
      email,
      limit,
      offset,
      isSuspended:
        isSuspended === undefined ? undefined : isSuspended === 'true',
    };

    const result = await getAllUsers(filters);
    return res.status(200).json({
      message: 'Users retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('GET ALL USERS ERROR:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const getUserByIdController = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    return res.status(200).json({
      message: 'User retrieved successfully',
      data: user,
    });
  } catch (error) {
    console.error('GET USER BY ID ERROR:', error);
    if (error.message === 'Invalid user ID format') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const updateUserStatusController = async (req, res) => {
  try {
    const { isSuspended } = req.body;
    const updatedUser = await updateUserStatus(req.params.id, isSuspended, req.user.id);

    return res.status(200).json({
      message: isSuspended
        ? 'User suspended successfully'
        : 'User unsuspended successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('UPDATE USER STATUS ERROR:', error);
    if (error.message === 'Admins cannot suspend their own account') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'Invalid user ID format') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const verifyUserController = async (req, res) => {
  try {
    const updatedUser = await verifyUserByAdmin(req.params.id);
    return res.status(200).json({
      message: 'User verified successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('VERIFY USER ERROR:', error);
    if (error.message === 'Invalid user ID format') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const deleteUserController = async (req, res) => {
  try {
    const result = await deleteUserByAdmin(req.params.id, req.user.id);
    return res.status(200).json({
      message: result.message,
      data: null,
    });
  } catch (error) {
    console.error('DELETE USER ERROR:', error);
    if (error.message === 'Admins cannot delete their own account') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'Invalid user ID format') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// ============================================================
// US-45: Revenue Reports and Financial Overview
// ============================================================
export const getRevenueReportController = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await getRevenueReport({ startDate, endDate });

    return res.status(200).json({
      message: 'Revenue report retrieved successfully',
      data: report,
    });
  } catch (error) {
    console.error('GET REVENUE REPORT ERROR:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};