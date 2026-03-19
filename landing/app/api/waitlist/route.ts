import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'waitlist.json');

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    // Ensure data directory exists
    await mkdir(DATA_DIR, { recursive: true });

    // Read existing entries
    let list: { email: string; joinedAt: string }[] = [];
    try {
      const raw = await readFile(FILE_PATH, 'utf-8');
      list = JSON.parse(raw);
    } catch {
      list = [];
    }

    // Check duplicate
    if (list.some((e) => e.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ message: 'already_registered' }, { status: 200 });
    }

    list.push({ email: email.toLowerCase(), joinedAt: new Date().toISOString() });
    await writeFile(FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');

    return NextResponse.json({ message: 'success', count: list.length }, { status: 200 });
  } catch (err) {
    console.error('[waitlist]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
