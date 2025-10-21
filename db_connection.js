require('dotenv').config();
const mysql = require('mysql2');

const ca =
  (process.env.MYSQL_CA || '').includes('\\n')
    ? process.env.MYSQL_CA.replace(/\\n/g, '\n')  // handle \n-escaped single line
    : process.env.MYSQL_CA;                       // handle real multiline

const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT, 10),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl: {
    ca,
    rejectUnauthorized: true, // Aiven expects TLS verification
    minVersion: 'TLSv1.2'
  }
});

db.connect((err) => {
  if(err) throw err;
  console.log('Connected to Aiven MySQL');

  const sql = `
    CREATE TABLE IF NOT EXISTS patient (
      patientid INT NOT NULL AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      dateOfBirth DATETIME,
      PRIMARY KEY (patientid)
    ) ENGINE=InnoDB;
  `;
  db.query(sql, (e) => { if(e) throw e; console.log('patient table ready'); });
});

module.exports = db;