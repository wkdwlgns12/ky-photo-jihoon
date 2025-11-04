const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const path = require("path");
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONT_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB 연결 성공"))
  .catch((err) => console.error("MongoDB 연결 실패:", err.message));

app.get("/", (_req, res) => res.send("PhotoMemo API OK"));

app.use("/api/auth", require("./routes/authroutes"));
app.use("/api/events", require("./routes/events"));

app.use((req, res) => res.status(404).json({ message: "Not Found" }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ message: "서버 오류" }); });

app.listen(PORT, () => { console.log(`Server running: http://localhost:${PORT}`); });
