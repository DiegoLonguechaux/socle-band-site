import mongoose from 'mongoose';

const ConcertSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    link: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Concert || mongoose.model('Concert', ConcertSchema);
