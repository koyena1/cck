import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

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

        const pool = getPool();
        
        // Execute Update query on the dealers table
        const result = await pool.query(
            'UPDATE dealers SET status = $1 WHERE dealer_id = $2',
            [status, dealerId]
        );

        // Verify if the record existed
        if (result.rowCount === 0) {
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