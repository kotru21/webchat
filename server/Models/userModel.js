import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 60, // bcrypt хеши всегда имеют длину 60 символов
    },
    avatar: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["online", "away", "dnd", "invisible", "offline"],
      default: "offline",
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    verificationTokenExpires: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      default: "",
    },
    banner: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for optimized queries
// Note: unique: true in schema already creates unique indexes on username and email
// Adding explicit indexes for queries
userSchema.index({ status: 1 }); // For filtering online users
userSchema.index({ lastActivity: -1 }); // For sorting by activity
userSchema.index({ createdAt: -1 }); // For sorting by registration date

export default mongoose.model("User", userSchema);
