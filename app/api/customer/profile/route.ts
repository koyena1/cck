import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

function normalizeCustomerRow(customer: any) {
  return {
    id: customer.customer_id,
    full_name: customer.full_name,
    email: customer.email,
    phone: customer.phone_number,
    address: customer.address,
    pincode: customer.pincode,
    city: customer.city ?? null,
    landmark: customer.landmark ?? null,
    district: customer.district ?? null,
    state: customer.state ?? null,
  }
}

async function getCustomerColumns(pool: any) {
  const result = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'customers'`
  )
  return new Set(result.rows.map((row: any) => row.column_name))
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerEmail = searchParams.get('customerEmail')?.trim().toLowerCase()

    if (!customerEmail) {
      return NextResponse.json({ success: false, error: 'Customer email is required' }, { status: 400 })
    }

    const pool = getPool()
    const columns = await getCustomerColumns(pool)
    const optionalColumns = ['city', 'landmark', 'district', 'state'].filter((col) => columns.has(col))
    const selectColumns = [
      'customer_id',
      'full_name',
      'email',
      'phone_number',
      'address',
      'pincode',
      ...optionalColumns,
    ].join(', ')
    const result = await pool.query(
      `SELECT ${selectColumns}
       FROM customers
       WHERE email = $1 AND is_active = true`,
      [customerEmail]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      customer: normalizeCustomerRow(result.rows[0]),
    })
  } catch (error: any) {
    console.error('Error fetching customer profile:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch customer profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const customerEmail = String(body.customerEmail || '').trim().toLowerCase()
    const full_name = String(body.full_name ?? body.fullName ?? '').trim()
    const phone = String(body.phone ?? body.phone_number ?? '').trim()
    const address = String(body.address ?? '').trim()
    const pincode = String(body.pincode ?? '').trim()
    const city = String(body.city ?? '').trim()
    const landmark = String(body.landmark ?? '').trim()
    const district = String(body.district ?? '').trim()
    const state = String(body.state ?? '').trim()

    if (!customerEmail) {
      return NextResponse.json({ success: false, error: 'Customer email is required' }, { status: 400 })
    }

    const pool = getPool()
    const columns = await getCustomerColumns(pool)
    const setClauses = [
      'full_name = COALESCE($2, full_name)',
      'phone_number = COALESCE($3, phone_number)',
      'address = COALESCE($4, address)',
      'pincode = COALESCE($5, pincode)',
    ]
    const values = [
      customerEmail,
      full_name || null,
      phone || null,
      address || null,
      pincode || null,
    ]
    let paramIndex = values.length + 1

    const optionalUpdates: Array<[string, string]> = [
      ['city', city],
      ['landmark', landmark],
      ['district', district],
      ['state', state],
    ]

    optionalUpdates.forEach(([column, value]) => {
      if (columns.has(column)) {
        setClauses.push(`${column} = COALESCE($${paramIndex}, ${column})`)
        values.push(value || null)
        paramIndex += 1
      }
    })

    const optionalColumns = ['city', 'landmark', 'district', 'state'].filter((col) => columns.has(col))
    const selectColumns = [
      'customer_id',
      'full_name',
      'email',
      'phone_number',
      'address',
      'pincode',
      ...optionalColumns,
    ].join(', ')

    const result = await pool.query(
      `UPDATE customers
       SET ${setClauses.join(', ')}
       WHERE email = $1 AND is_active = true
       RETURNING ${selectColumns}`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      customer: normalizeCustomerRow(result.rows[0]),
      message: 'Profile updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating customer profile:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update customer profile' },
      { status: 500 }
    )
  }
}