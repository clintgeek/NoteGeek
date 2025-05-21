import Note from '../models/Note.js';

// @desc    Get all unique tags for the logged-in user
// @route   GET /api/tags
// @access  Private
export const getTags = async (req, res) => {
  const userId = req.user.id;
  console.log('Fetching tags for user:', userId);

  try {
    // Use the distinct() method to get unique tags for the user
    // It operates directly on the 'tags' array field within the notes
    const tags = await Note.distinct('tags', { userId: userId });
    console.log('Found tags:', tags);

    // Sort tags alphabetically for consistency
    tags.sort((a, b) => a.localeCompare(b));

    res.status(200).json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Server error fetching tags' });
  }
};