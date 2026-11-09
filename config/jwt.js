var jwt = require('jsonwebtoken');
require('dotenv').config({url: __dirname + '/../.env'});

console.log( generateToken({ username: "Béla" }) );

function generateToken(payload){
    const signOption = {
        expiresIn: process.env.JWT_EXPIRES_IN
    };
    return jwt.sign(payload, process.env.JWT_SECRET, signOption);
}

function verifyToken(token){
    return jwt.verify(token, process.env.JWT_SECRET);
}

function tokenCheck(req, res, next){
    const authHeader = req.headers['authorization']; // Bearer *token*
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try{
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        console.log(token);
        return res.status(400).json({ error: 'Invalid token or expired token.' });
    }

}

function adminCheck(req, res, next){
    const authHeader = req.headers['authorization']; // Bearer *token*
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try{
        const decoded = verifyToken(token);
        req.user = decoded;
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admins only.' });
        }
        next();
    } catch (error) {
        return res.status(400).json({ error: 'Invalid token or expired token.' });
    }

}

// TODO: auth middleware function

module.exports = {
    generateToken,
    verifyToken,
    tokenCheck,
    adminCheck
}