import { NextRequest, NextResponse } from "next/server";

type IndiaPostOffice = {
  Name?: string;
  Block?: string;
  District?: string;
  State?: string;
  Division?: string;
  Region?: string;
  Circle?: string;
  Taluk?: string;
  BranchType?: string;
  Country?: string;
  Pincode?: string;
};

type IndiaPostResponseItem = {
  PostOffice?: IndiaPostOffice[] | null;
};

type LocationSuggestion = {
  pinCode: string;
  city: string;
  state: string;
  label: string;
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";

  if (query.length < 2) {
    return NextResponse.json(
      { results: [] as LocationSuggestion[] },
      { status: 200 },
    );
  }

  try {
    const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9\s,-]/g, " ");
    const queryParts = normalizedQuery
      .split(/[\s,]+/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 2);

    const candidateQueries = [query, ...queryParts].filter(
      (value, index, array) => value && array.indexOf(value) === index,
    );

    const topQueries = candidateQueries.slice(0, 4);

    const responses = await Promise.all(
      topQueries.map(async (value) => {
        const response = await fetch(
          `https://api.postalpincode.in/postoffice/${encodeURIComponent(value)}`,
          { cache: "no-store" },
        );

        if (!response.ok) return [] as IndiaPostOffice[];

        const data = (await response.json()) as IndiaPostResponseItem[];
        return data[0]?.PostOffice || [];
      }),
    );

    const offices = responses.flat();

    const ranked = offices
      .map((office) => {
        const pinCode = office.Pincode?.trim() || "";
        const officeName = office.Name?.trim() || "";
        const block = office.Block?.trim() || "";
        const district = office.District?.trim() || "";
        const state = office.State?.trim() || "";
        const division = office.Division?.trim() || "";
        const region = office.Region?.trim() || "";
        const circle = office.Circle?.trim() || "";

        const city = district || block || officeName;

        if (!pinCode || !city || !state) {
          return null;
        }

        const searchableText = [
          officeName,
          block,
          district,
          state,
          division,
          region,
          circle,
          office.Taluk || "",
          office.BranchType || "",
          office.Country || "",
          pinCode,
        ]
          .join(" ")
          .toLowerCase();

        const allMatch = queryParts.every((part) =>
          searchableText.includes(part),
        );
        const startsWithQuery = searchableText.startsWith(
          normalizedQuery.trim(),
        );

        const score =
          (allMatch ? 100 : 0) +
          (startsWithQuery ? 50 : 0) +
          (searchableText.includes(normalizedQuery.trim()) ? 25 : 0);

        const labelParts = [officeName, block, district, state].filter(Boolean);

        return {
          key: `${pinCode}-${officeName}`,
          pinCode,
          city,
          state,
          label: `${labelParts.join(", ")} - ${pinCode}`,
          score,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.score - a.score);

    const seen = new Set<string>();
    const results: LocationSuggestion[] = [];

    for (const item of ranked) {
      if (seen.has(item.key)) continue;

      seen.add(item.key);
      results.push({
        pinCode: item.pinCode,
        city: item.city,
        state: item.state,
        label: item.label,
      });

      if (results.length >= 8) break;
    }

    return NextResponse.json({ results }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Unable to search location." },
      { status: 502 },
    );
  }
}
