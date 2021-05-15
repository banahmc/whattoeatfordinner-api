const yup = require('yup');

const recipeValidationSchema = yup.object().shape({
  title: yup.string().trim().required(),
  url: yup.string().trim().url().required(),
  imageUrl: yup.string().trim().url().required(),
});

module.exports = recipeValidationSchema;
