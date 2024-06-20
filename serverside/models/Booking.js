const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  place: { type: mongoose.Schema.Types.ObjectId, ref: "Place", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalPrice: { type: Number, required: true },
  guest: Number,
});

const BookingModel = mongoose.model("Booking", bookingSchema);

module.exports = BookingModel;
