import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';

// Database configuration matching your MSSQL setup
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME,
    options: {
        encrypt: true, 
        trustServerCertificate: true 
    }
};

/**
 * PATCH: Updates a dealer's status.
 * Used by the Admin Dashboard to move dealers from 'Pending Approval' to 'Active'.
 */
export async function PATCH(request: NextRequest) {
    try {
        const { dealerId, status } = await request.json();

        // Validate required fields
        if (!dealerId || !status) {
            return NextResponse.json(
                { error: "Dealer ID and Status are required." },
                { status: 400 }
            );
        }

        // Connect to MSSQL
        let pool = await sql.connect(config);

        // Execute Update query on the Dealers table
        const result = await pool.request()
            .input('DealerID', sql.Int, dealerId)
            .input('Status', sql.NVarChar(50), status)
            .query(`
                UPDATE Dealers 
                SET Status = @Status 
                WHERE DealerID = @DealerID
            `);

        // Verify if the record existed
        if (result.rowsAffected[0] === 0) {
            return NextResponse.json(
                { error: "Dealer not found." },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: `Dealer status successfully updated to ${status}.` },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("Verification API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}