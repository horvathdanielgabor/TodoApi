const db = require('../config/db');

const migrations = [
    require('./001_create_tasks'),
    require('./002_create_users'),
    // Add more migration files here as nedded
];

migrations.forEach(migration => {
    migration.run(); // create task, user table
});