require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const todoRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');

// Moddleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// use routes
app.use('/api/tasks', todoRoutes);
app.use('/api/users', userRoutes);

// Start the todo routes
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});