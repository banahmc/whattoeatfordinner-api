const RecipeModel = require('../features/recipes/model');
const recipeValidationSchema = require('../features/recipes/validators');
const { getRecipes } = require('../features/recipes/scraper');

module.exports = function(app) {
  // Get all recipes from database
  app.get('/api/recipes', async(req, res, next) => {
    try {
      const recipes = await RecipeModel.find({});
      res.json(recipes);
    } catch (error) {
      next(error);
    }
  });

  // Get random recipe from database
  app.get('/api/recipes/random', async(req, res, next) => {
    try {
      const { term } = req.query;
      if (term && term.length >= 1) {
        let regExp = '';
        if (Array.isArray(term)) {
          regExp = term.reduce((prev, curr) => `${prev}(?=.*\\b${curr}\\b)`, '');
        } else {
          regExp = `(?=.*\\b${term}\\b)`;
        }
        const filterQuery = { title: { $regex: `^${regExp}.+`, $options: 'gi' } };
        const docCount = await RecipeModel.countDocuments(filterQuery);
        const rand = Math.floor(Math.random() * docCount);
        const recipe = (await RecipeModel.find(filterQuery, null, { skip: rand, limit: 1 })[0]);
        res.json(recipe);
      } else {
        const docCount = await RecipeModel.estimatedDocumentCount();
        const rand = Math.floor(Math.random() * docCount);
        const recipe = await RecipeModel.findOne().skip(rand);
        res.json(recipe);
      }
    } catch (error) {
      next(error);
    }
  });

  // Get recipe from database by id
  app.get('/api/recipes/:id', async(req, res, next) => {
    try {
      const { id } = req.params;
      const recipe = await RecipeModel.findOne({ _id: id });
      if (!recipe) {
        res.sendStatus(404);
      }
      res.json(recipe);
    } catch (error) {
      next(error);
    }
  });

  // Scrape and return all recipes from target website
  app.get('/api/recipes/scrape', async(req, res, next) => {
    try {
      const recipes = await getRecipes();
      res.json(recipes);
    } catch (error) {
      next(error);
    }
  });

  // Scrape and return all recipes from target website for given from-to page numbers
  app.get('/api/recipes/scrape/:fromPage,:toPage', async(req, res, next) => {
    try {
      const { fromPage, toPage } = req.params;
      const recipes = await getRecipes(fromPage, toPage);
      res.json(recipes);
    } catch (error) {
      next(error);
    }
  });

  // Scrape all new recipes from target website and save to database
  app.post('/api/recipes/load', async(req, res, next) => {
    try {
      // todo: load only new recipes
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  // Scrape all recipes from target website and save to database
  // This will delete existing recipes so think of this as full reload
  // Probably not needed but it is here just in case
  app.post('/api/recipes/reload', async(req, res, next) => {
    try {
      const recipes = await getRecipes();
      if (recipes && recipes.length > 0) {
        const exists = await RecipeModel.exists({});
        if (exists) {
          await RecipeModel.deleteMany({});
        }
        const recipeModels = recipes.map((entry) => entry.recipes).flat(2).map(({
          title, url, imageUrl, dateAdded,
        }) => ({
          title,
          url,
          imageUrl,
          dateAdded,
        }));
        await RecipeModel.insertMany(recipeModels);
        res.sendStatus(200);
      }
    } catch (error) {
      next(error);
    }
  });

  // Save new recipe to database
  app.post('/api/recipes', async(req, res, next) => {
    const {
      title,
      url,
      imageUrl,
      dateAdded,
    } = req.body;
    try {
      await recipeValidationSchema.validate({
        title,
        url,
        imageUrl,
        dateAdded,
      });
      const exists = await RecipeModel.exists({ title });
      if (exists) {
        throw new Error('Recipe with this name is already in db.');
      }
      const newRecipe = {
        title,
        url,
        imageUrl,
        dateAdded,
      };
      await RecipeModel.create(newRecipe);
      res.status(201).json(newRecipe);
    } catch (error) {
      next(error);
    }
  });

  // Delete all recipes from database
  app.delete('/api/recipes', async(req, res, next) => {
    try {
      await RecipeModel.deleteMany({});
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Delete recipe from database by id
  app.delete('/api/recipes/:id', async(req, res, next) => {
    try {
      const { id } = req.params;
      const exists = await RecipeModel.exists({ _id: id });
      if (!exists) {
        res.sendStatus(404);
      }
      await RecipeModel.deleteOne({ _id: id });
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });
};
