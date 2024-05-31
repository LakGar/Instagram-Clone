const express = require("express");
const router = express.Router();
const Comment = require("../models/CommentModel");
const Post = require("../models/PostModel");

// Create a new comment
router.post("/", (req, res) => {
  const { content, postId } = req.body;

  const newComment = new Comment({
    content,
    author: req.user.id,
    post: postId,
  });

  newComment
    .save()
    .then((comment) => {
      return Post.findByIdAndUpdate(postId, {
        $push: { comments: comment._id },
      });
    })
    .then(() => res.json(newComment))
    .catch((err) => res.status(500).json({ message: err.message }));
});

// Fetch all comments for a post
router.get("/post/:postId", (req, res) => {
  Comment.find({ post: req.params.postId })
    .populate("author", "username")
    .then((comments) => res.json(comments))
    .catch((err) => res.status(500).json({ message: err.message }));
});

// Fetch a single comment by ID
router.get("/:id", (req, res) => {
  Comment.findById(req.params.id)
    .populate("author", "username")
    .then((comment) => {
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      res.json(comment);
    })
    .catch((err) => res.status(500).json({ message: err.message }));
});

// Update a comment
router.put("/:id", (req, res) => {
  const { content } = req.body;

  Comment.findById(req.params.id)
    .then((comment) => {
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      if (comment.author.toString() !== req.user.id) {
        return res.status(403).json({ message: "User not authorized" });
      }

      comment.content = content || comment.content;
      return comment.save();
    })
    .then((updatedComment) => res.json(updatedComment))
    .catch((err) => res.status(500).json({ message: err.message }));
});

// Delete a comment
router.delete("/:id", (req, res) => {
  Comment.findByIdAndDelete(req.params.id)
    .then((comment) => {
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      return Post.findByIdAndUpdate(comment.post, {
        $pull: { comments: comment._id },
      }).then(() => res.json({ message: "Comment deleted successfully" }));
    })
    .catch((err) => res.status(500).json({ message: err.message }));
});

// Like a comment
router.post("/:id/like", (req, res) => {
  Comment.findById(req.params.id)
    .then((comment) => {
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      if (comment.commetLikes.includes(req.user.id)) {
        return res.status(400).json({ message: "Comment already liked" });
      }

      comment.commetLikes.push(req.user.id);
      return comment.save();
    })
    .then((updatedComment) => res.json(updatedComment))
    .catch((err) => res.status(500).json({ message: err.message }));
});

// Unlike a comment
router.post("/:id/unlike", (req, res) => {
  Comment.findById(req.params.id)
    .then((comment) => {
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      if (!comment.commetLikes.includes(req.user.id)) {
        return res.status(400).json({ message: "Comment not liked yet" });
      }

      comment.commetLikes = comment.commetLikes.filter(
        (userId) => userId.toString() !== req.user.id
      );
      return comment.save();
    })
    .then((updatedComment) => res.json(updatedComment))
    .catch((err) => res.status(500).json({ message: err.message }));
});

module.exports = router;
