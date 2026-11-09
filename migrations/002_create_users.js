const db = require('../config/db');

const run = () => {
    return new Promise((resolve, reject) =>{
        db.query(`CREATE TABLE IF NOT EXISTS users (
            ID INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            passwd VARCHAR(255) NOT NULL,
            role ENUM('user','admin') DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`, (err, results) => {
            if (err) {
                console.error('Error creating tasks table:', err);
            } else {
                console.log('Tasks table created or already exists.');
            }
        });

    });
}

module.exports = { run };