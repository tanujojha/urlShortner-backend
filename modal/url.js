import mongoose from "mongoose";

const urlSchema = new mongoose.Schema({
    longurl: {
        type: String,
        required: true
    },
    shorturl: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    count: {
        type: Number,
        default: 0
    }
},{timestamps: true})


const Url = mongoose.model("Url", urlSchema)

export default Url;