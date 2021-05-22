const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const { applyCustomMiddlewares } = require('./middlewares');

const startServer = async() => {
  const app = express();
  app.use(cors());
  app.use(helmet());
  app.use(morgan('combined'));
  app.use(express.json());
  // eslint-disable-next-line global-require
  require('./routes')(app);
  applyCustomMiddlewares(app);

  try {
    const mongoDbUri = process.env.MONGO_URI;
    const mongoDbConnectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    await mongoose.connect(mongoDbUri, mongoDbConnectionOptions);
    console.info(`Connected to database on Worker process: ${process.pid}`);
  } catch (error) {
    console.error(`Database connection error: ${error.stack} on Worker process: ${process.pid}`);
    process.exit(1);
  }

  const port = process.env.PORT || 50000;
  app.listen(port, () => {
    console.log(`Running application in ${process.env.NODE_ENV} environment`);
    console.log(`Listening at http://localhost:${port}`);
  });
};

startServer();
