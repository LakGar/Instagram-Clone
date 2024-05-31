const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const auth = require("../middlewares/auth"); // Assuming you have an auth middleware

const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
  const { username, email, password, firstName, lastName } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    await user.save();

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET, // Use the secret from environment variables
      { expiresIn: "1h" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login a user
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Fetch the authenticated user's profile
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Fetch a user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update the authenticated user's profile
router.put("/", auth, async (req, res) => {
  const { firstName, lastName, bio, profilePicture, coverPhoto } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.bio = bio || user.bio;
    user.profilePicture = profilePicture || user.profilePicture;
    user.coverPhoto = coverPhoto || user.coverPhoto;

    await user.save();

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a user
router.delete("/", auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send a friend request
router.post("/friend-request/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const recipient = await User.findById(req.params.id);

    if (!recipient) {
      return res.status(404).json({ message: "User not found" });
    }

    if (recipient.friendRequestsReceived.includes(user.id)) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    recipient.friendRequestsReceived.push(user.id);
    user.friendRequestsSent.push(recipient.id);

    await user.save();
    await recipient.save();

    res.json({ message: "Friend request sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Accept a friend request
router.post("/accept-friend-request/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const requester = await User.findById(req.params.id);

    if (!requester) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.friendRequestsReceived.includes(requester.id)) {
      return res.status(400).json({ message: "Friend request not found" });
    }

    user.friends.push(requester.id);
    requester.friends.push(user.id);

    user.friendRequestsReceived = user.friendRequestsReceived.filter(
      (id) => id.toString() !== requester.id.toString()
    );
    requester.friendRequestsSent = requester.friendRequestsSent.filter(
      (id) => id.toString() !== user.id.toString()
    );

    await user.save();
    await requester.save();

    res.json({ message: "Friend request accepted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Decline a friend request
router.post("/decline-friend-request/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const requester = await User.findById(req.params.id);

    if (!requester) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.friendRequestsReceived.includes(requester.id)) {
      return res.status(400).json({ message: "Friend request not found" });
    }

    user.friendRequestsReceived = user.friendRequestsReceived.filter(
      (id) => id.toString() !== requester.id.toString()
    );
    requester.friendRequestsSent = requester.friendRequestsSent.filter(
      (id) => id.toString() !== user.id.toString()
    );

    await user.save();
    await requester.save();

    res.json({ message: "Friend request declined" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
