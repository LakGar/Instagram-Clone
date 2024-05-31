const mongoose = require("mongoose");
const { Schema } = mongoose;

const postSchema = new Schema({
  content: {
    type: String,
    trim: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  images: [
    {
      type: String,
    },
  ],
  videos: [
    {
      type: String,
    },
  ],
  likes: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  comments: [
    {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware to update the updatedAt field
postSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Export the Post model
const Post = mongoose.model("Post", postSchema);
module.exports = Post;
