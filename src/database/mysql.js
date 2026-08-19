const mysql=require('mysql2/promise');const config=require('../config');
const pool=mysql.createPool({...config.database,waitForConnections:true,queueLimit:0,dateStrings:true,decimalNumbers:true});
async function health(){const connection=await pool.getConnection();try{await connection.ping()}finally{connection.release()}}
async function close(){await pool.end()}
module.exports={pool,health,close};