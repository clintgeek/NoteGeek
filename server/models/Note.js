import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      // required: [true, 'Note title cannot be empty'], // Decided against making title required for flexibility
    },
    content: {
      type: String,
      required: [true, 'Note content cannot be empty'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Index for efficient querying by user
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      index: true, // Index for efficient querying by folder
      default: null, // Allow notes to exist outside folders
    },
    tags: {
      type: [String],
      index: true, // Index for efficient querying by tags
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    isEncrypted: {
      // Note: Actual encryption happens in controller/service layer
      type: Boolean,
      default: false,
    },
    lockHash: {
      // Stores bcrypt hash of note-specific password if isLocked is true
      type: String,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Add indexes for timestamps for sorting/querying
NoteSchema.index({ createdAt: 1 });
NoteSchema.index({ updatedAt: 1 });

// Add text index for search (as per plan section 2.9)
NoteSchema.index({ title: 'text', content: 'text' });

const Note = mongoose.model('Note', NoteSchema);

export default Note;