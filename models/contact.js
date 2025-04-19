const mongoose = require("mongoose")

const contactSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    orderRef: {
      type: String,
      required: false,
    },
    message: {
      type: String,
      required: true,
    },
    attachment: {
      filename: String,
      path: String,
      contentType: String,
    },
    status: {
      type: String,
      enum: ["new", "in_progress", "resolved"],
      default: "new",
    },
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Contact", contactSchema)
