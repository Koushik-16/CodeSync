import express from "express";
import cors from 'cors'
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from './routes/auth.route.js'
import { connectDB } from "./lib/db.js";
import {initializeSocket , getSocketInstance } from './socket/socket.js'
import sessionRoute from './routes/session.route.js'
import http from 'http';
import path from 'path';

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();
const app = express();
const server = http.createServer(app);

app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
      methods : ["GET" , "POST" , "PUT" , "DELETE"],
      allowedHeaders: 'Content-Type,Authorization',
      preflightContinue: false,
      optionsSuccessStatus: 204
    })
  );

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/interview" , sessionRoute);

// if (process.env.NODE_ENV === "production") {
//   const buildPath = path.join(__dirname, "..", "frontend", "build");
//   app.use(express.static(buildPath));

//   app.get(/(.*)/, (req, res) => {
//     res.sendFile(path.join(buildPath, "index.html"));
//   });
// }

initializeSocket(server);



server.listen(PORT, () => {
  connectDB();
    console.log(`server is running on port ${PORT}`);
})
