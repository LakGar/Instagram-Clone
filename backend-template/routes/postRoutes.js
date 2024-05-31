const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const Post = require("../models/PostModel");
const User = require("../models/UserModel");
const auth = require("../middlewares/auth"); // Ensure you have an auth middleware

// Create a new post
router.post("/", auth, (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err });
    }

    const { content } = req.body;
    const images = req.files.images
      ? req.files.images.map((file) => file.path)
      : [];
    const videos = req.files.videos
      ? req.files.videos.map((file) => file.path)
      : [];

    const newPost = new Post({
      content,
      author: req.user.id,
      images,
      videos,
    });

    newPost
      .save()
      .then((post) => {
        return User.findByIdAndUpdate(
          req.user.id,
          { $push: { posts: post._id } },
          { new: true }
        );
      })
      .then(() => res.json(newPost))
      .catch((err) => res.status(500).json({ message: err.message }));
  });
});

// Fetch all posts
router.get("/", (req, res) => {
  Post.find()
    .populate("author", "username") // Populate the author's username
    .then((posts) => res.json(posts))
    .catch((err) => res.status(500).json({ message: err.message }));
});

// Fetch a single post by ID
router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .populate("author", "username") // Populate the author's username
    .then((post) => {
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    })
    .catch((err) => res.status(500).json({ message: err.message }));
});

// Update a post
router.put("/:id", auth, (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err });
    }

    const { content } = req.body;
    const images = req.files.images
      ? req.files.images.map((file) => file.path)
      : [];
    const videos = req.files.videos
      ? req.files.videos.map((file) => file.path)
      : [];

    Post.findById(req.params.id)
      .then((post) => {
        if (!post) {
          return res.status(404).json({ message: "Post not found" });
        }

        // Update the post fields
        post.content = content || post.content;
        post.images = images.length > 0 ? images : post.images;
        post.videos = videos.length > 0 ? videos : post.videos;

        return post.save();
      })
      .then((updatedPost) => res.json(updatedPost))
      .catch((err) => res.status(500).json({ message: err.message }));
  });
});

// Delete a post
router.delete("/:id", auth, (req, res) => {
  Post.findByIdAndDelete(req.params.id)
    .then((post) => {
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      return User.findByIdAndUpdate(req.user.id, {
        $pull: { posts: post._id },
      }).then(() => res.json({ message: "Post deleted successfully" }));
    })
    .catch((err) => res.status(500).json({ message: err.message }));
});

// Like a post
router.post("/:id/like", auth, (req, res) => {
  Post.findById(req.params.id)
    .then((post) => {
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (post.likes.includes(req.user.id)) {
        return res.status(400).json({ message: "Post already liked" });
      }

      post.likes.push(req.user.id);
      return post.save();
    })
    .then((updatedPost) => res.json(updatedPost))
    .catch((err) => res.status(500).json({ message: err.message }));
});

// Unlike a post
router.post("/:id/unlike", auth, (req, res) => {
  Post.findById(req.params.id)
    .then((post) => {
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (!post.likes.includes(req.user.id)) {
        return res.status(400).json({ message: "Post not liked yet" });
      }

      post.likes = post.likes.filter(
        (userId) => userId.toString() !== req.user.id
      );
      return post.save();
    })
    .then((updatedPost) => res.json(updatedPost))
    .catch((err) => res.status(500).json({ message: err.message }));
});

module.exports = router;
