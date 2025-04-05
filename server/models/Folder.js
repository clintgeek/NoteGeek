import mongoose from 'mongoose';

const FolderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Folder name cannot be empty'],
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Index for efficient querying by user
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true, // Index for potential sorting/querying
  },
});

// Ensure a user cannot have two folders with the same name
// We can enforce case-insensitivity at the application layer if needed
FolderSchema.index({ userId: 1, name: 1 }, { unique: true });

const Folder = mongoose.model('Folder', FolderSchema);

export default Folder;