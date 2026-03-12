import { NextRequest, NextResponse } from "next/server";

const PIN_REGEX = /^\d{6}$/;

type IndiaPostOffice = {
  District?: string;
  State?: string;
  Block?: string;
  Name?: string;
};

type IndiaPostResponseItem = {
  Status?: string;
  Message?: string;
  PostOffice?: IndiaPostOffice[] | null;
};

export async function GET(request: NextRequest) {
  const pinCode = request.nextUrl.searchParams.get("pinCode")?.trim() || "";

  if (!PIN_REGEX.test(pinCode)) {
    return NextResponse.json(
      { message: "PIN code must be exactly 6 digits." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${pinCode}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { message: "Unable to fetch location." },
        { status: 502 },
      );
    }

    const data = (await response.json()) as IndiaPostResponseItem[];
    const firstResult = data[0];
    const firstPostOffice = firstResult?.PostOffice?.[0];

    if (!firstPostOffice?.State) {
      return NextResponse.json(
        { message: "Location not found for this PIN code." },
        { status: 404 },
      );
    }

    const city =
      firstPostOffice.District ||
      firstPostOffice.Block ||
      firstPostOffice.Name ||
      "";
    const state = firstPostOffice.State || "";

    if (!city || !state) {
      return NextResponse.json(
        { message: "Location not found for this PIN code." },
        { status: 404 },
      );
    }

    return NextResponse.json({ city, state }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Unable to fetch location." },
      { status: 502 },
    );
  }
}
