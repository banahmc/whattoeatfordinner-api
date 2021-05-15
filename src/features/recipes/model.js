const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({ // schema definition
  title: { type: String, required: true },
  url: { type: String, required: true },
  imageUrl: { type: String, required: true },
  dateAdded: { type: String, required: true },
}, { // schema options
  timestamps: true, // this way we include createdAt/updatedAt info
  collection: 'recipes',
  strict: 'throw',
});

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;
