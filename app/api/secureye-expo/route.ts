import { NextRequest, NextResponse } from 'next/server';

const WEBHOOK_URL =
  'https://bothook.io/v1/public/triggers/webhooks/5bd674a2-ef1e-449a-a43a-c05616935514';

type SecureyePayload = {
  name: string;
  phoneNo: string;
  emailId: string;
  pinCode: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
const PIN_REGEX = /^\d{6}$/;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<SecureyePayload>;

    const name = body.name?.trim() || '';
    const phoneNo = body.phoneNo?.trim() || '';
    const emailId = body.emailId?.trim() || '';
    const pinCode = body.pinCode?.trim() || '';

    if (!name || !phoneNo || !emailId || !pinCode) {
      return NextResponse.json(
        { message: 'All fields are required.' },
        { status: 400 },
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        { message: 'Name must be at least 2 characters.' },
        { status: 400 },
      );
    }

    if (!PHONE_REGEX.test(phoneNo)) {
      return NextResponse.json(
        { message: 'Use format like +919876543210 (country code required).' },
        { status: 400 },
      );
    }

    if (!EMAIL_REGEX.test(emailId)) {
      return NextResponse.json(
        { message: 'Please enter a valid email address.' },
        { status: 400 },
      );
    }

    if (!PIN_REGEX.test(pinCode)) {
      return NextResponse.json(
        { message: 'PIN code must be exactly 6 digits.' },
        { status: 400 },
      );
    }

    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        phoneNo,
        emailId,
        pinCode,
      }),
      cache: 'no-store',
    });

    if (!webhookResponse.ok) {
      return NextResponse.json(
        { message: 'Webhook trigger failed.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ message: 'Submitted successfully.' }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: 'Invalid request payload.' },
      { status: 400 },
    );
  }
}
