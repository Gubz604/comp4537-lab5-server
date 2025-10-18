const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'pass',
    database: 'comp4537_lab5'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
    let sql = `CREATE TABLE IF NOT EXISTS patient (
  patientid INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  dateOfBirth DATETIME,
  PRIMARY KEY (patientid)
) ENGINE=InnoDB;`;

    db.query(sql, (err, result) => {
        if (err) throw err;
        console.log("Table patient ensured to exist or created\n");
    });
});

module.exports = db;