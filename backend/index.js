require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { pool, testConnection, initializeDatabase } = require("./config/db");
const User = require("./models/user.model");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
];

// Apply CORS with specific options
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Parse JSON bodies - this must come before routes that need req.body
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", JSON.stringify(req.body, null, 2));
  }
  next();
});

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  console.log("Auth middleware called for:", req.method, req.url);
  console.log("Auth header:", authHeader);
  console.log("Token:", token ? "[PRESENT]" : "[MISSING]");

  if (!token) {
    console.log("No token provided");
    return res.sendStatus(401);
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    console.log("JWT decoded user:", { id: user.id, email: user.email });

    const userExists = await User.findById(user.id);
    if (!userExists) {
      console.log("User not found in database:", user.id);
      return res.sendStatus(403);
    }

    console.log("User authenticated successfully:", {
      id: userExists.id,
      email: userExists.email,
    });
    req.user = user;
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    return res.sendStatus(403);
  }
};

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
        missingFields: {
          email: !email,
          password: !password,
        },
      });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      });
    }

    const isPasswordValid = await User.comparePasswords(
      password,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "24h",
    });

    // Return user data (excluding password) and token
    const { password: _, ...userData } = user;
    res.status(200).json({
      user: userData,
      token,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal server error",
      code: "SERVER_ERROR",
    });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: "All fields are required",
        missingFields: {
          email: !email,
          password: !password,
          firstName: !firstName,
          lastName: !lastName,
        },
      });
    }

    const existingUser = await User.findByEmail(email);
    if (
      existingUser &&
      existingUser.name === `${firstName} ${lastName}`.trim()
    ) {
      return res.status(400).json({
        error: "A user with this email and name already exists",
        code: "USER_EXISTS",
      });
    }

    const user = await User.create({
      email,
      password,
      name: `${firstName} ${lastName}`.trim(),
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "24h",
    });

    // Return user data (excluding password) and token
    const { password: _, ...userData } = user;
    res.status(201).json({
      user: userData,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Internal server error",
      code: "SERVER_ERROR",
    });
  }
});

// Protected routes that require authentication
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    // User data is already verified and attached by authenticateToken middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Return user data (excluding password)
    const { password: _, ...userData } = user;
    res.status(200).json({
      user: userData,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({
      error: "Internal server error",
      code: "SERVER_ERROR",
    });
  }
});

app.put("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;

    if (
      name === undefined &&
      email === undefined &&
      (!currentPassword || !newPassword)
    ) {
      return res.status(400).json({
        error: "At least one field (name, email, or password) must be provided",
        providedFields: {
          name: name !== undefined,
          email: email !== undefined,
          password: !!(currentPassword && newPassword),
        },
      });
    }

    let updatedUser;

    if (currentPassword && newPassword) {
      console.log("Attempting password update for user ID:", req.user?.id);
      console.log("Current password provided:", !!currentPassword);
      console.log("New password provided:", !!newPassword);

      try {
        updatedUser = await User.updatePassword(
          req.user.id,
          currentPassword,
          newPassword
        );
        console.log("Password update completed successfully");
      } catch (passwordError) {
        console.error("Password update failed:", passwordError.message);
        throw passwordError;
      }
    } else {
      console.log("Attempting name/email update for user ID:", req.user?.id);
      updatedUser = await User.updateUser(req.user.id, { name, email });
    }

    if (!updatedUser) {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Return updated user data (excluding password)
    const { password: _, ...userData } = updatedUser;
    res.status(200).json({
      user: userData,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    console.error("Error stack:", error.stack);
    console.error("Request body:", req.body);
    console.error("User ID from token:", req.user?.id);

    if (error.message === "Current password is incorrect") {
      return res.status(400).json({
        error: "Current password is incorrect",
        code: "INVALID_CURRENT_PASSWORD",
      });
    }

    if (error.message === "User not found") {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    res.status(500).json({
      error: "Internal server error",
      code: "SERVER_ERROR",
    });
  }
});

app.get("/api", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

async function startServer() {
  try {
    await initializeDatabase();
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error("Failed to connect to the database");
    }

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log("Available routes:");
      console.log(`- GET    http://localhost:${PORT}/api`);
      console.log(`- POST   http://localhost:${PORT}/api/login`);
      console.log(`- POST   http://localhost:${PORT}/api/register`);
      console.log(`- GET    http://localhost:${PORT}/api/auth/me (protected)`);
      console.log(
        `- PUT    http://localhost:${PORT}/api/auth/me (protected) - supports name, email, password updates`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
