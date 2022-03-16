import { Schema, model } from "mongoose";

const schema = new Schema({
  network: { type: String, index: true },
  id: { type: String, index: true },
  block: { type: Number },
  timestamp: { type: Date },
  forgeId: { type: String, index: true },
  expiry: { type: Date, index: true },
  underlyingToken: { type: String, index: true },
  yieldBearingToken: { type: String, index: true },
  ot: { type: String, index: true },
  yt: { type: String, index: true },
});

export default model("YieldContract", schema);
