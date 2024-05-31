const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("common"));

const mongoURI = process.env.MONGO_URI;
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Static folder for uploaded files
app.use("/uploads", express.static("uploads"));

// Routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);
const postRoutes = require("./routes/postRoutes");
app.use("/api/posts", postRoutes);
const commentRoutes = require("./routes/commentRoutes");
app.use("/api/:postId/comments", commentRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the Social Media App API");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// app.get("/test-env", (req, res) => {
//   res.json({ JWT_SECRET: process.env.JWT_SECRET });
// });
