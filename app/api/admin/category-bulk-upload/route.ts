import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getPool } from '@/lib/db';
import { getCategoryUploadConfig, type CategoryField } from '@/lib/category-bulk-upload';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

function normalizeHeader(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function parsePriceInput(value: unknown) {
  const normalized = String(value ?? '').replace(/,/g, '').trim();
  const match = normalized.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return { amount: null as number | null, note: '' };

  const amount = Number(match[1]);
  const note = normalized.slice(normalized.indexOf(match[1]) + match[1].length).trim();
  return { amount: Number.isFinite(amount) ? amount : null, note };
}

function parseBoolean(value: unknown, defaultValue: boolean) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;

  const normalized = String(value).trim().toLowerCase();
  if (['yes', 'y', 'true', '1', 'active', 'enabled'].includes(normalized)) return true;
  if (['no', 'n', 'false', '0', 'inactive', 'disabled'].includes(normalized)) return false;
  return defaultValue;
}

function parseSpecs(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value ?? '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getCellValue(row: Record<string, unknown>, header: string) {
  const expected = normalizeHeader(header);
  const foundKey = Object.keys(row).find((key) => normalizeHeader(key) === expected);
  return foundKey ? row[foundKey] : undefined;
}

function coerceFieldValue(field: CategoryField, rawValue: unknown, priceFallback?: number) {
  const empty = rawValue === undefined || rawValue === null || rawValue === '';
  const value = empty ? field.defaultValue : rawValue;

  if (field.column === 'price') {
    const parsed = parsePriceInput(value);
    return { value: parsed.amount, note: parsed.note };
  }

  if (field.column === 'original_price' && empty && priceFallback !== undefined) {
    return { value: priceFallback, note: '' };
  }

  if (field.type === 'number') {
    const parsed = parsePriceInput(value);
    return { value: parsed.amount, note: parsed.note };
  }

  if (field.type === 'integer') {
    const parsed = parseInt(String(value ?? ''), 10);
    return { value: Number.isFinite(parsed) ? parsed : null, note: '' };
  }

  if (field.type === 'boolean') {
    return { value: parseBoolean(value, Boolean(field.defaultValue)), note: '' };
  }

  if (field.type === 'specs') {
    return { value: parseSpecs(value), note: '' };
  }

  if (value === null) {
    return { value: null, note: '' };
  }

  return { value: String(value ?? '').trim(), note: '' };
}

function buildInsertQuery(table: string, columns: string[], rowCount: number) {
  const quotedColumns = columns.map((column) => `"${column}"`).join(', ');
  const placeholders: string[] = [];
  let paramIndex = 1;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const rowPlaceholders = columns.map(() => `$${paramIndex++}`);
    placeholders.push(`(${rowPlaceholders.join(', ')})`);
  }

  return `INSERT INTO ${table} (${quotedColumns}) VALUES ${placeholders.join(', ')} RETURNING id`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = String(searchParams.get('category') || '');
  const config = getCategoryUploadConfig(category);

  if (!config) {
    return NextResponse.json({ success: false, error: 'Invalid category selected' }, { status: 400 });
  }

  const headers = config.fields.map((field) => field.header);
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);
  worksheet['!cols'] = headers.map((header) => ({ wch: Math.max(header.length + 4, 16) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `${config.label} Products`.slice(0, 31));

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const fileName = `${category}-product-sample.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const category = String(formData.get('category') || '');
  const config = getCategoryUploadConfig(category);

  if (!config) {
    return NextResponse.json({ success: false, error: 'Invalid category selected' }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ success: false, error: 'No Excel file provided' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  if (rows.length === 0) {
    return NextResponse.json({ success: false, error: 'No product rows found in Excel file' }, { status: 400 });
  }

  const uploadedHeaders = new Set(Object.keys(rows[0]).map(normalizeHeader));
  const missingHeaders = config.fields
    .filter((field) => field.required)
    .map((field) => field.header)
    .filter((header) => !uploadedHeaders.has(normalizeHeader(header)));

  if (missingHeaders.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: `Missing required Excel columns: ${missingHeaders.join(', ')}`,
        expectedColumns: config.fields.map((field) => field.header),
      },
      { status: 400 }
    );
  }

  const errors: string[] = [];
  const payloadRows: unknown[][] = [];
  const columns = [...config.fields.map((field) => field.column), 'price_note'];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const valuesByColumn = new Map<string, unknown>();
    let priceValue: number | undefined;
    let priceNote = '';

    for (const field of config.fields) {
      const rawValue = getCellValue(row, field.header);
      const coerced = coerceFieldValue(field, rawValue, priceValue);

      if (field.column === 'price') {
        priceValue = typeof coerced.value === 'number' ? coerced.value : undefined;
        priceNote = coerced.note;
      }

      if (field.required && (coerced.value === null || coerced.value === '')) {
        errors.push(`Row ${rowNumber}: ${field.header} is required`);
      }

      if ((field.type === 'number' || field.type === 'integer') && coerced.value === null && field.required) {
        errors.push(`Row ${rowNumber}: ${field.header} must be a valid number`);
      }

      valuesByColumn.set(field.column, coerced.value);
    }

    if (valuesByColumn.has('original_price') && (valuesByColumn.get('original_price') === null || valuesByColumn.get('original_price') === '')) {
      valuesByColumn.set('original_price', priceValue ?? null);
    }

    valuesByColumn.set('price_note', priceNote || null);

    payloadRows.push(columns.map((column) => valuesByColumn.get(column)));
  });

  if (errors.length > 0) {
    return NextResponse.json(
      { success: false, error: 'Excel validation failed', errors },
      { status: 400 }
    );
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await client.query(buildInsertQuery(config.table, columns, payloadRows.length), payloadRows.flat());
    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      category: config.label,
      inserted: result.rowCount,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error bulk uploading ${config.label} products:`, error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to upload products' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
