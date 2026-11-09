const express = require('express');
const router = express.Router();
const SHA1 = require('sha1');
const db = require('../config/db');
const { generateToken, tokenCheck, verifyToken, adminCheck } = require('../config/jwt');

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
            id: results[0].id,
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

    if (values[newPasswdIdx] != values[confirmIdx]){
        return res.status(400).json({ error: 'The passwords doesn\'t match!' });
    }
    
    return res.status(200).json({ message: user });

    /*
    db.query(`SELECT * FROM ${table} WHERE ID=?`, [verifyToken(id)], (err, results) => {
        if (err){
            return res.status(500).json({ error: err.error });
        }

        if (results.length > 0){
            return res.status(400).json({ error: 'This e-mail already registered' });
        }

        if (oldPasswdIdx > 0)
        {
            values[oldPasswdIdx] = SHA1(values[oldPasswdIdx]);
        }
    });
    */
});

// profile
router.post('/:id', tokenCheck, (req, res) => {

});

// update user
router.patch('/:id', tokenCheck, (req, res) => {

});

// delete user
router.delete('/:id', tokenCheck, (req, res) => {

});

module.exports = router;