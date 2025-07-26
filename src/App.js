// Main entry point for Shadow Accord Character Builder
const express = require('express');
const path = require('path');
const { connectDB } = require('./config/database');
const { sessionConfig } = require('./config/session');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(sessionConfig());

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes will go here later
app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

// Start server
app.listen(PORT, () => {
  console.log(`Shadow Accord server running on port ${PORT}`);
});

module.exports = app;