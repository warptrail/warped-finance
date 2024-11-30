const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
// const { NODE_ENV } = require('./config');

// Import Routers
const transactionsRouter = require('./routes/transactions');
const categoriesRouter = require('./routes/categories');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Warped Finance Backend');
});

// Routes
app.use('/api/transactions', transactionsRouter);
app.use('/api/categories', categoriesRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
