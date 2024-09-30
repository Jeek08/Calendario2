import mysql from 'mysql2/promise';

const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'db_escuela',
});

export default connection;
