import { Schema, model } from "mongoose";

const schema = new Schema({
  network: { type: String, index: true },
  id: { type: String, lowercase: true, index: true },
  block: { type: Number },
  timestamp: { type: Date },
  forgeId: { type: String, index: true },
  expiry: { type: Date, index: true },
  underlyingToken: { type: String, lowercase: true, index: true },
  yieldBearingToken: { type: String, lowercase: true, index: true },
  ot: { type: String, lowercase: true, index: true },
  yt: { type: String, lowercase: true, index: true },
});

export default model("YieldContract", schema);
