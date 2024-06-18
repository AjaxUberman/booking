const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const download = require("image-downloader");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = process.env.JWT_SECRET;

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);

mongoose.connect(process.env.MONGO_URL);

app.get("/register", (req, res) => {
  res.json("test");
});

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const newUser = await User.create({
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    await newUser.save();
    res.json(newUser);
  } catch (error) {
    res.status(422).json(error);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userDoc = await User.findOne({ email });

    if (userDoc) {
      const passOk = bcrypt.compareSync(password, userDoc.password);
      if (passOk) {
        jwt.sign(
          { email: userDoc.email, id: userDoc._id },
          jwtSecret,
          {},
          (error, token) => {
            if (error) {
              throw error;
            } else {
              res.cookie("token", token).json(userDoc);
            }
          }
        );
      } else {
        res.status(422).json("pass not ok");
      }
    } else {
      res.status(404).json("not found");
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.json(null);
  }

  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) {
      console.error("JWT verification failed:", err);
      return res.status(401).json({ error: "Unauthorized" });
    } else {
      const { email, _id } = await User.findById(userData.id);
      res.json({ email, _id });
    }
  });
});

app.post("/logout", (req, res) => {
  res.clearCookie("token").json(true);
});

app.post("/upload-by-link", async (req, res) => {
  const { link } = req.body;
  const newName = "photo" + uuidv4() + ".jpg";
  if (link) {
    await download.image({
      url: link,
      dest: __dirname + "/uploads/" + newName,
    });
  }
  res.json(newName);
});

const photosMiddleware = multer({ dest: "uploads/" });
app.post("/upload", photosMiddleware.array("photos", 10), (req, res) => {
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const { path: tempPath, originalname } = req.files[i];
    const ext = path.extname(originalname);
    const newPath = tempPath + ext;
    fs.renameSync(tempPath, newPath);
    const relativePath = path.relative("uploads", newPath);
    uploadedFiles.push(relativePath);
  }
  res.json(uploadedFiles);
});

const PORT = process.env.LOCAL_PORT || 4000;
app.listen(PORT, () => {
  console.log("Server is Running");
});
