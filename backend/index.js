require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

let users = [];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg =
        "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }

    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log("Headers:", req.headers);

  if (
    req.body &&
    typeof req.body === "object" &&
    Object.keys(req.body).length > 0
  ) {
    console.log("Body:", JSON.stringify(req.body, null, 2));
  }

  next();
});

const handlePreflight = (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
};

app.options("/api", handlePreflight);
app.options("/api/register", handlePreflight);
app.options("/api/login", handlePreflight);
app.options("/api/profile", handlePreflight);
app.options("/api/auth/me", handlePreflight);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.get("/api", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

app.post("/api/register", async (req, res) => {
  console.log("Registration request received:", req.body);

  res.setHeader("Content-Type", "application/json");

  try {
    if (!req.body) {
      console.log("No request body received");
      return res.status(400).json({ message: "Request body is required" });
    }

    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      console.log("Missing required fields");
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        missingFields: {
          email: !email,
          password: !password,
          name: !name,
        },
      });
    }

    if (users.some((user) => user.email === email)) {
      console.log("User already exists:", email);
      return res.status(400).json({
        success: false,
        message: "User already exists",
        email: email,
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = {
        id: Date.now().toString(),
        email,
        name,
        password: hashedPassword,
      };

      users.push(user);
      console.log("New user registered:", { id: user.id, email: user.email });

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "1h",
      });

      const { password: _, ...userData } = user;

      return res.status(201).json({
        success: true,
        user: userData,
        token,
      });
    } catch (hashError) {
      console.error("Password hashing error:", hashError);
      return res.status(500).json({
        success: false,
        message: "Error processing registration",
        error: hashError.message,
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Error registering user",
      error: error.message,
    });
  }
});

app.get("/api/auth/me", authenticateToken, (req, res) => {
  try {
    const user = users.find((u) => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...userData } = user;
    res.json({ user: userData });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Error fetching user profile" });
  }
});

app.put("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = users.find((u) => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) {
      user.name = name;
    }

    if (currentPassword && newPassword) {
      const validPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!validPassword) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    const { password, ...userData } = user;

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      user: userData,
      token,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Error updating user profile" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    const { password: _, ...userData } = user;
    res.json({ user: userData, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error during login" });
  }
});

app.get("/api/profile", authenticateToken, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.sendStatus(404);

  const { password, ...userData } = user;
  res.json(userData);
});

function startServer() {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("Available routes:");
    console.log(`- POST   http://localhost:${PORT}/api/register`);
    console.log(`- POST   http://localhost:${PORT}/api/login`);
    console.log(
      `- GET    http://localhost:${PORT}/api/profile (requires auth)`
    );
    console.log(
      `- GET    http://localhost:${PORT}/api/auth/me (requires auth)`
    );
    console.log(
      "\nNote: User data is stored in memory and will be cleared when the server stops."
    );
  });
}

startServer();
