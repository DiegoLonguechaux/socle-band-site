import mongoose from 'mongoose';

const ReleaseLinksSchema = new mongoose.Schema(
  {
    spotify: { type: String, default: '' },
    deezer: { type: String, default: '' },
    appleMusic: { type: String, default: '' },
    amazonMusic: { type: String, default: '' },
    youtubeMusic: { type: String, default: '' },
    bandcamp: { type: String, default: '' },
    soundcloud: { type: String, default: '' },
  },
  { _id: false }
);

const ReleaseSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['single', 'ep', 'album'],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    coverUrl: {
      type: String,
      default: '',
      trim: true,
    },
    links: {
      type: ReleaseLinksSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

export default mongoose.models.Release || mongoose.model('Release', ReleaseSchema);
