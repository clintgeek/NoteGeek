import Note from '../models/Note.js';

// @desc    Search notes for the logged-in user based on query
// @route   GET /api/search?q=query
// @access  Private
export const searchNotes = async (req, res) => {
  const userId = req.user.id;
  const searchQuery = req.query.q;

  if (!searchQuery || searchQuery.trim().length === 0) {
    return res.status(400).json({ message: 'Search query cannot be empty' });
  }

  try {
    // Perform text search using the text index on Note model
    // Filter results by userId
    // Project score to potentially sort by relevance
    const notes = await Note.find(
      {
        userId: userId,
        $text: { $search: searchQuery.trim() },
      },
      {
        score: { $meta: 'textScore' }, // Include relevance score
      }
    ).sort({ score: { $meta: 'textScore' } }); // Sort by relevance score

    // Similar to getNotes, handle locked/encrypted notes if needed (exclude sensitive data)
    // For now, returning full matching notes (except locked)
    const results = notes.map(note => {
        if (note.isLocked) {
            return {
                 _id: note._id,
                title: note.title,
                userId: note.userId,
                folderId: note.folderId,
                tags: note.tags,
                isLocked: note.isLocked,
                isEncrypted: note.isEncrypted,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
                score: note.score, // Include relevance score
                message: 'Note is locked. Content not available.'
            }
        }
        // Add decryption logic here later if needed
        return note;
    })

    res.status(200).json(results);
  } catch (error) {
    console.error('Error searching notes:', error);
    res.status(500).json({ message: 'Server error searching notes' });
  }
};