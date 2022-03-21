import { Schema, model } from "mongoose";

const schema = new Schema({
  address: { type: String, lowercase: true, index: true },
  price: { type: Number },
  createdAt: { type: Date, required: true, default: Date.now, expires: 300 }, // 5 minutes
});

export default model("Price", schema);
