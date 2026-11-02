const db = require('../config/db');

const migrations = [
    require('./001_create_tasks'),
    // Add more migration files here as nedded
];

migrations.forEach(migration => {
    migration.run(); // create task table
});