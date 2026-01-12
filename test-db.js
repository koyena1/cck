const sql = require('mssql');
// We will manually put your credentials here for one quick test
const config = {
    user: 'cck_admin',
    password: '123456789',
    database: 'CCTV_Platform',
    server: 'localhost', 
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function test() {
    try {
        console.log("Attempting to connect to SQL Server...");
        await sql.connect(config);
        console.log("✅ SUCCESS: Connected to SQL Server!");
        process.exit(0);
    } catch (err) {
        console.error("❌ ERROR MESSAGE:", err.message);
        console.error("❌ ERROR CODE:", err.code);
        process.exit(1);
    }
}
test();