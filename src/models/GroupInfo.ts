import mongoose from 'mongoose';

const LinksSchema = new mongoose.Schema(
  {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    tiktok: { type: String, default: '' },
    youtube: { type: String, default: '' },
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

const GroupInfoSchema = new mongoose.Schema(
  {
    bandName: {
      type: String,
      required: true,
      default: '',
      trim: true,
    },
    bio: {
      type: String,
      default: '',
    },
    groupPhotoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    logoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    contactEmail: {
      type: String,
      default: '',
      trim: true,
    },
    links: {
      type: LinksSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

export default mongoose.models.GroupInfo || mongoose.model('GroupInfo', GroupInfoSchema);
