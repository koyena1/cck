const sql = require('mssql');

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

async function updateDealersTable() {
    try {
        console.log("Connecting to SQL Server...");
        await sql.connect(config);
        console.log("✅ Connected!");

        // Check if columns exist and add them if they don't
        const columnsToAdd = [
            { name: 'BusinessName', type: 'NVARCHAR(255)' },
            { name: 'GSTIN', type: 'NVARCHAR(100)' },
            { name: 'Location', type: 'NVARCHAR(255)' }
        ];

        for (const column of columnsToAdd) {
            try {
                // Check if column exists
                const checkQuery = `
                    SELECT COUNT(*) as count 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'Dealers' 
                    AND COLUMN_NAME = '${column.name}'
                `;
                const result = await sql.query(checkQuery);
                
                if (result.recordset[0].count === 0) {
                    // Column doesn't exist, add it
                    const alterQuery = `ALTER TABLE Dealers ADD ${column.name} ${column.type} NULL`;
                    await sql.query(alterQuery);
                    console.log(`✅ Added column: ${column.name}`);
                } else {
                    console.log(`ℹ️  Column already exists: ${column.name}`);
                }
            } catch (err) {
                console.error(`❌ Error with column ${column.name}:`, err.message);
            }
        }

        console.log("\n✅ Database update complete!");
        process.exit(0);
    } catch (err) {
        console.error("❌ ERROR:", err.message);
        process.exit(1);
    }
}

updateDealersTable();
