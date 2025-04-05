import Note from '../models/Note.js';
import Folder from '../models/Folder.js'; // Needed for validation
import bcrypt from 'bcrypt';

// --- Helper Functions (Consider moving to a service/util file later) ---

// Basic check for valid ObjectId format
const isValidObjectId = (id) => {
  return id && /^[0-9a-fA-F]{24}$/.test(id);
};

// --- Controller Functions ---

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private (requires auth)
export const createNote = async (req, res) => {
  const {
    title,
    content,
    folderId,
    tags,
    isLocked,
    isEncrypted, // Placeholder for now - encryption logic not yet implemented
    lockPassword, // Password specifically for locking this note
  } = req.body;

  // Get userId from the authenticated user (attached by protect middleware)
  const userId = req.user._id;

  // --- Basic Input Validation ---
  if (!content) {
    return res.status(400).json({ message: 'Note content cannot be empty' });
  }

  // --- Optional Field Validation ---
  // Validate Folder ID if provided
  if (folderId) {
    if (!isValidObjectId(folderId)) {
      return res.status(400).json({ message: 'Invalid Folder ID format' });
    }
    try {
      const folder = await Folder.findOne({ _id: folderId, userId: userId });
      if (!folder) {
        return res.status(404).json({ message: 'Folder not found or does not belong to user' });
      }
    } catch (error) {
      console.error('Error checking folder:', error);
      return res.status(500).json({ message: 'Server error checking folder' });
    }
  }

  // Validate locking fields
  let lockHash = undefined;
  if (isLocked) {
    if (!lockPassword || lockPassword.length < 4) { // Require a lock password if locked (min length 4 for example)
      return res.status(400).json({ message: 'A password of at least 4 characters is required to lock the note' });
    }
    try {
      const salt = await bcrypt.genSalt(10);
      lockHash = await bcrypt.hash(lockPassword, salt);
    } catch (error) {
      console.error('Error hashing lock password:', error);
      return res.status(500).json({ message: 'Server error handling lock password' });
    }
  }

  // Note: Encryption logic using process.env.SECRET_KEY would go here if isEncrypted is true
  // For now, we just save the flag.

  // --- Create Note ---
  try {
    const note = await Note.create({
      userId,
      title: title || 'Untitled Note', // Default title if empty
      content, // Add encryption here later if needed
      folderId: folderId || null,
      tags: tags || [],
      isLocked: isLocked || false,
      isEncrypted: isEncrypted || false,
      lockHash: lockHash,
    });

    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    // Handle potential validation errors from Mongoose
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error creating note' });
  }
};

// @desc    Get all notes for the logged-in user
// @route   GET /api/notes
// @access  Private
export const getNotes = async (req, res) => {
  const userId = req.user._id;
  // Get filter criteria from query parameters
  const { folderId, tag } = req.query;

  const filter = { userId: userId };

  // Add folderId to filter if provided and valid
  if (folderId) {
      if (!isValidObjectId(folderId)) {
         return res.status(400).json({ message: 'Invalid Folder ID format for filtering' });
      }
      // Optional: Check if folder actually belongs to user? Maybe not necessary for just filtering.
      filter.folderId = folderId;
  }

  // Add tag to filter if provided (tags is an array field)
  if (tag) {
      filter.tags = tag; // Mongoose handles matching element in array
  }

  try {
    // Find notes based on the combined filter
    const notes = await Note.find(filter).sort({ updatedAt: -1 });

    // Note: For locked/encrypted notes, we only send metadata here.
    // Content decryption/unlocking happens when fetching a single note or requires a password.
    // We might want to map the results to exclude sensitive fields later.

    res.status(200).json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Server error fetching notes' });
  }
};

// @desc    Get a single note by ID
// @route   GET /api/notes/:id
// @access  Private
export const getNoteById = async (req, res) => {
  const userId = req.user._id;
  const noteId = req.params.id;

  // Validate ID format
  if (!isValidObjectId(noteId)) {
    return res.status(400).json({ message: 'Invalid Note ID format' });
  }

  try {
    const note = await Note.findOne({ _id: noteId, userId: userId });

    if (!note) {
      return res.status(404).json({ message: 'Note not found or does not belong to user' });
    }

    // If note is locked, return only metadata (no content or lockHash)
    if (note.isLocked) {
        // Consider adding a specific status or flag indicating it's locked
        return res.status(200).json({
            _id: note._id,
            title: note.title,
            userId: note.userId,
            folderId: note.folderId,
            tags: note.tags,
            isLocked: note.isLocked,
            isEncrypted: note.isEncrypted,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            // Explicitly exclude content and lockHash
            message: 'Note is locked. Content not available without unlock.'
        });
    }

    // Note: Decryption logic would go here if note.isEncrypted is true

    // Return the full note if not locked
    res.status(200).json(note);

  } catch (error) {
    console.error('Error fetching note by ID:', error);
    res.status(500).json({ message: 'Server error fetching note' });
  }
};

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
export const updateNote = async (req, res) => {
  const userId = req.user._id;
  const noteId = req.params.id;
  const { title, content, folderId, tags } = req.body;

  // Validate ID format
  if (!isValidObjectId(noteId)) {
    return res.status(400).json({ message: 'Invalid Note ID format' });
  }

  try {
    // Find the note and ensure it belongs to the user
    const note = await Note.findOne({ _id: noteId, userId: userId });

    if (!note) {
      return res.status(404).json({ message: 'Note not found or does not belong to user' });
    }

    // Prevent updates if the note is locked
    if (note.isLocked) {
      return res.status(403).json({ message: 'Cannot update a locked note. Please unlock first.' }); // 403 Forbidden
    }

    // Prevent updates if the note is encrypted (until decryption logic is implemented)
    if (note.isEncrypted) {
        return res.status(403).json({ message: 'Cannot update an encrypted note yet.'});
    }

    // Validate Folder ID if it is being updated
    if (folderId !== undefined) {
        if (folderId === null) {
             // Allow unsetting the folder
             note.folderId = null;
        } else {
            if (!isValidObjectId(folderId)) {
                return res.status(400).json({ message: 'Invalid Folder ID format' });
            }
            const folder = await Folder.findOne({ _id: folderId, userId: userId });
            if (!folder) {
                return res.status(404).json({ message: 'Folder not found or does not belong to user' });
            }
            note.folderId = folderId;
        }
    }

    // Update fields if they are provided in the request body
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content; // Add encryption here later if needed
    if (tags !== undefined) note.tags = tags;

    // Save the updated note
    const updatedNote = await note.save();

    res.status(200).json(updatedNote);

  } catch (error) {
    console.error('Error updating note:', error);
     if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error updating note' });
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
export const deleteNote = async (req, res) => {
  const userId = req.user._id;
  const noteId = req.params.id;

  // Validate ID format
  if (!isValidObjectId(noteId)) {
    return res.status(400).json({ message: 'Invalid Note ID format' });
  }

  try {
    // Find the note and ensure it belongs to the user
    const note = await Note.findOne({ _id: noteId, userId: userId });

    if (!note) {
      return res.status(404).json({ message: 'Note not found or does not belong to user' });
    }

    // Prevent deletion if the note is locked (as a safety measure)
    if (note.isLocked) {
      return res.status(403).json({ message: 'Cannot delete a locked note. Please unlock first.' }); // 403 Forbidden
    }

    // Prevent deletion if note is encrypted (consistency with update)
     if (note.isEncrypted) {
        return res.status(403).json({ message: 'Cannot delete an encrypted note yet.'});
    }

    // Delete the note
    await Note.deleteOne({ _id: noteId, userId: userId }); // Re-confirm ownership in delete

    res.status(200).json({ message: 'Note deleted successfully' });

  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Server error deleting note' });
  }
};

// --- Other controller functions (deleteNote) will be added below ---