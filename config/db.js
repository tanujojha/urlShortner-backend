import mongoose from "mongoose";


async function dbConnection() {
  try {
    let x = await mongoose.connect(process.env.MONGO_ATLAS_URL);
    x ? console.log("MongoDB connected ✔") : console.log("MongoDB ❌NOT❌ connected");
  } catch (error) {
    console.log(error);
  }
}

export default dbConnection;