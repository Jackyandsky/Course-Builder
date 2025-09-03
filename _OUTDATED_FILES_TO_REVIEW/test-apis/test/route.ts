import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
  return NextResponse.json({ message: 'API route is working' 
  } catch (error) {
    console.error('Error in GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }});
}

export async function POST(request: NextRequest) {
  try {
  return NextResponse.json({ message: 'POST route is working' 
  } catch (error) {
    console.error('Error in POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }});
}