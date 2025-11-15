import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // Validate URL
    new URL(url);

    // Make HEAD request to check status
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)',
      },
      redirect: 'manual', // Don't follow redirects automatically
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    return NextResponse.json({
      status: response.status,
      ok: response.ok,
      redirected: response.redirected,
      isHttps: url.startsWith('https://'),
    });
  } catch (error) {
    // Return a generic error response
    return NextResponse.json(
      { 
        status: 0, 
        ok: false, 
        error: 'Unable to check URL',
        isHttps: url.startsWith('https://'),
      },
      { status: 200 } // Return 200 so frontend doesn't error
    );
  }
}

export const runtime = 'edge';
