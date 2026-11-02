const express = require('express');
const router = express.Router();
const db = require('../config/db');

/**
 * GET      https://localhostz:3000/api/todos/ -> all todos
 * GET      https://localhostz:3000/api/todos/:id -> all todos
 * POST     https://localhostz:3000/api/todos/ -> all todos
 * PATCH    https://localhostz:3000/api/todos/:id -> all todos
 * DELETE   https://localhostz:3000/api/todos/:id -> all todos
 * DELETE   https://localhostz:3000/api/todos/ -> all todos
*/


// GET all rodo;
router.get('/', (req, res) => {
    db.query('SELECT * FROM tasks', (err, results) => {
        if (err) {
            return res.status(500).json({ error: '[SELECT]Failed to fetch todos' });
        }
        return res.status(200).json(results);
    });
});

// GET a single task by ID
router.get('/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM tasks WHERE ID=?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: '[SELECT]Failed to fetch todos' });
        }

        if (results.length === 0) {
            return res.status(400).json({ error: "Todo not found" });
        }
        
        return res.status(200).json(results);
    });
});

// POST new todo
router.post('/', (req, res) => {
    const { title, description, deadline } = req.body
    db.query('INSERT INTO tasks (title, description, deadline) VALUES (?, ?, ?)', [title, description, deadline], (err, results) => {
        if (err) {
            return res.status(500).json({ error: '[INSERT]Failed to insert todos' });
        }
        
        return res.status(200).json({ message: 'Task created successfully' });
    });
});

// PATCH todo by ID
router.patch('/:id', (req, res) => {
    const id = req.params.id;

    // Build the update query dynamically based on provided fields
    let updatedFields = Object.keys(req.body).map(field => `${field} = ?`).join(', ');
    let updatedValues = Object.values(req.body);

    db.query(`UPDATE tasks SET ${updatedFields} WHERE ID=?`, [...updatedValues,id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: '[UDATE]Failed to update todos' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Todo not found" });
        }
        
        return res.status(200).json({ message: 'Task updated successfully' });
    });
});

// DELETE a todo by ID
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM tasks WHERE ID=?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: '[DELETE]Failed to delete todos' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Todo not found" });
        }
        
        return res.status(200).json({ message: 'Todo deleted' });
    });
});

// DELETE all todos
router.delete('/', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM tasks', (err, results) => {
        if (err) {
            return res.status(500).json({ error: '[DELETE]Failed to delete todos' });
        }
        
        return res.status(200).json({ message: 'All todo deleted' });
    });
});

module.exports = router;