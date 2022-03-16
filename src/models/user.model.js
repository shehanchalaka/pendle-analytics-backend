import { Schema, model } from "mongoose";

const schema = new Schema({
  network: { type: String, index: true },
  address: { type: String, index: true },
  name: { type: String, index: true },
});

export default model("User", schema);
