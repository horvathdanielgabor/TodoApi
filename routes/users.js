const express = require('express');
const router = express.Router();
const SHA1 = require('sha1');
const db = require('../config/db');
const { generateToken, tokenCheck, verifyToken, adminCheck } = require('../config/jwt');

// -----------------------------------------------
// Auth ENDPOINTS
// -----------------------------------------------

// login
router.post('/login', (req, res) => {
    let table = 'users';
    let data = req.body;
    
    let fields = Object.keys(data);
    let values = Object.values(data);

    let passwdIdx = fields.indexOf('passwd');
    let emailIdx = fields.indexOf('email');

    if (emailIdx < 0|| passwdIdx < 0){
        return res.status(400).json({ error: 'Missing required fields!' });
    }

    db.query(`SELECT * FROM ${table} WHERE email=? AND passwd=?`, [values[emailIdx], SHA1(values[passwdIdx])], (err, results) => {
        if (err){
            return res.status(500).json({ error: err.error });
        }

        if (SHA1(values[passwdIdx]) != results[0].passwd)
        {
            return res.status(400).json({ error: "Password does not match!" });
        }

        // Logged in -> token generate ...
        const token = generateToken({
            ID: results[0].ID,
            name: results[0].name,
            email: results[0].email,
            role: results[0].role
        });

        return res.status(200).json({ token });
    });
});

// register
router.post('/register', (req, res) => {
    let table = 'users';
    let data = req.body;
    
    let fields = Object.keys(data);
    let values = Object.values(data);

    let namedIdx = fields.indexOf('name');
    let passwdIdx = fields.indexOf('passwd');
    let emailIdx = fields.indexOf('email');
    let confirmIdx = fields.indexOf('confirm');

    if (namedIdx < 0 || emailIdx < 0 || passwdIdx < 0 || confirmIdx < 0){
        return res.status(400).json({ error: 'Missing required fields!' });
    }

    if (values[passwdIdx] != values[confirmIdx]){
        return res.status(400).json({ error: 'The passwords doesn\'t match!' });
    }

    db.query(`SELECT * FROM ${table} WHERE email=?`, [values[emailIdx]], (err, results) => {
        if (err){
            return res.status(500).json({ error: err.error });
        }

        if (results.length > 0){
            return res.status(400).json({ error: 'This e-mail already registered' });
        }

        if (passwdIdx > 0)
        {
            values[passwdIdx] = SHA1(values[passwdIdx]);
        }

        fields.splice(confirmIdx, 1);
        values.splice(confirmIdx, 1);

        fields = fields.join(', ')
        values = "'" + values.join("', '") + "'";

        db.query(`INSERT INTO ${table} (${fields}) VALUES(${values})`, (err, results) => {
            if (err){
                return res.status(500).json({ error: err.error });
            }

            return res.status(201).json({ message: 'User registered successfully' });
        });
    });
});

// -----------------------------------------------
// User ENDPOINTS
// -----------------------------------------------

// passmod
router.patch('/passmod', tokenCheck, (req, res) => {
    let table = 'users';
    let user = req.user;
    let data = req.body;

    let fields = Object.keys(data);
    let values = Object.values(data);

    let oldPasswdIdx = fields.indexOf('oldPasswd');
    let newPasswdIdx = fields.indexOf('newPasswd');
    let confirmIdx = fields.indexOf('confirm');

    if (oldPasswdIdx < 0 || newPasswdIdx < 0 || confirmIdx < 0){
        return res.status(400).json({ error: 'Missing required fields!' });
    }

    db.query(`SELECT * FROM ${table} WHERE ID=?`, [user.ID], (err, results) => {
        if (err){
            return res.status(500).json({ error: err.error });
        }

        if (results.length == 0){
            return res.status(400).json({ error: 'This user does not exist!' });
        }

        if (SHA1(values[oldPasswdIdx]) != results[0].passwd)
        {
            return res.status(400).json({ error: "Old password does not match!" });
        }

        if (values[newPasswdIdx] == values[oldPasswdIdx]){
            return res.status(400).json({ error: 'The new and the old password matches!' });
        }

        if (values[newPasswdIdx] != values[confirmIdx]){
            return res.status(400).json({ error: 'The passwords doesn\'t match!' });
        }

        // Build the update query dynamically based on provided fields
        let updatedFields = Object.keys(req.body).map(field => `${field} = ?`).join(', ');
        let updatedValues = Object.values(req.body);

        db.query(`UPDATE ${table} SET ${updatedFields} WHERE ID=?`, [updatedValues,user.ID], (err, results) => {
            if (err){
                return res.status(500).json({ error: err.error });
            }

            return res.status(200).json({ message: "Password changed successfully!" });
        });
    });
});

// profile
router.get('/profile', tokenCheck, (req, res) => {
    let table = 'users';
    let user = req.user;

    db.query(`SELECT * FROM ${table} WHERE ID=?`, [user.ID], (err, results) => {
        if (err){
            return res.status(500).json({ error: err.error });
        }

        if (results.length == 0){
            return res.status(500).json({ error: "No profile found!" });
        }

        let profile = {
            name: results[0].name,
            email: results[0].email
        }

        return res.status(200).json({ user: profile });
    });
});

// update user
router.patch('/profile', tokenCheck, (req, res) => {
    let table = 'users';
    let user = req.user;
    let data = req.body;

    let fields = Object.keys(data);
    let values = Object.values(data);

    let nameIdx = fields.indexOf('name');
    let emailIdx = fields.indexOf('email');

    if (nameIdx < 0 || emailIdx < 0){
        return res.status(400).json({ error: 'Missing required fields!' });
    }

    db.query(`SELECT * FROM ${table} WHERE ID=?`, [user.ID], (err, results) => {
        if (err){
            return res.status(500).json({ error: err.error });
        }

        if (results.length == 0){
            return res.status(400).json({ error: 'This user does not exist!' });
        }

        if (values[nameIdx] == results[0].name || values[emailIdx] == results[0].email){
            return res.status(304).json({ error: 'There were no changes needed!' });
        }

        db.query(`SELECT * FROM ${table} WHERE email=?`, [values[emailIdx]], (err, results) => {
            if (err){
                return res.status(500).json({ error: err.error });
            }

            if (results.length > 0){
                return res.status(401).json({ error: 'This email is already taken!' });
            }

            // Build the update query dynamically based on provided fields
            let updatedFields = Object.keys(req.body).map(field => `${field} = ?`).join(', ');
            let updatedValues = Object.values(req.body);

            db.query(`UPDATE ${table} SET ${updatedFields} WHERE ID=?`, [updatedValues,user.ID], (err, results) => {
                if (err){
                    return res.status(500).json({ error: err.error });
                }

                return res.status(200).json({ message: "Profile successfully updated!" });
            });
        });
    });
});

// delete user
router.delete('/profile', tokenCheck, (req, res) => {
    const table = 'users';
    const user = req.user;

    db.query('DELETE FROM tasks WHERE ID=?', [user.ID], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.error });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "No deletion need to be done!" });
        }
        
        return res.status(200).json({ message: 'User successfuly deleted' });
    });
});

// -----------------------------------------------
// Admin ENDPOINTS
// -----------------------------------------------



module.exports = router;