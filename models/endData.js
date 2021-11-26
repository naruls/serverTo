const mongoose = require('mongoose');

const endDataSchema = new mongoose.Schema({
  temper {
    type Number,
  },
  wind {
    type Number,
  },
});

temper: json.main.temp, wind: json.wind.speed

module.exports = mongoose.model('enddata', endDataSchema);