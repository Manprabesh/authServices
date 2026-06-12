import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();

// --- Core Middlewares ---
app.use(express.json()); // parse JSON body
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());
app.set("trust proxy", true);
import authRouter from "./routes/auth-router.js";
app.use("/api/v1/auth",authRouter);

app.get("/api/v1/hello",(req,res)=>{
  console.log(req)
  return res.json("hello ")
})
// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});
export default app;
