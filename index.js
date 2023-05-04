import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js"
import authRoutes from "./routes/authRoutes.js";
import urlShortnerRoutes from "./routes/urlShortnerRoutes.js"

const app = express();
const PORT = process.env.PORT || 5000;
connectDB()

// MIDDLEWARES FOR APP
app.use(cors())
app.use(express.json())



// ROUTES
app.use("/auth", authRoutes);
app.use("/urlshort", urlShortnerRoutes);


app.get("/", (req, res)=>{
    res.send("hello bois")
})


app.listen(PORT, ()=>{
    console.log("Server started on 5000");
})