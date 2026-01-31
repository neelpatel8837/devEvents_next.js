import { NextRequest, NextResponse } from "next/server";

import { Event } from "@/database/event.model";
import type { IEvent } from "@/database/event.model";
import { connectToDatabase } from "@/lib/mongotb";

type RouteParams = {
  params: {
    slug?: string;
  };
};

type ErrorResponse = {
  message: string;
  error?: string;
};

type SuccessResponse = {
  message: string;
  event: IEvent;
};

function normalizeAndValidateSlug(rawSlug: string | undefined): {
  ok: true;
  slug: string;
} | {
  ok: false;
  status: 400;
  body: ErrorResponse;
} {
  if (typeof rawSlug !== "string") {
    return {
      ok: false,
      status: 400,
      body: { message: "Slug is required" }
    };
  }

  let decodedSlug: string;
  try {
    decodedSlug = decodeURIComponent(rawSlug);
  } catch {
    return {
      ok: false,
      status: 400,
      body: { message: "Invalid slug encoding" }
    };
  }

  const slug = decodedSlug.trim().toLowerCase();

  if (!slug) {
    return {
      ok: false,
      status: 400,
      body: { message: "Slug is required" }
    };
  }

  // Keep this strict to avoid weird DB queries / unexpected characters.
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(slug)) {
    return {
      ok: false,
      status: 400,
      body: { message: "Invalid slug format" }
    };
  }

  return { ok: true, slug };
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug?: string }> }
) {
  const { slug } = await context.params; 

  const slugValidation = normalizeAndValidateSlug(slug);
  if (!slugValidation.ok) {
    return NextResponse.json(slugValidation.body, {
      status: slugValidation.status,
    });
  }

  try {
    await connectToDatabase();

    const event = await Event.findOne({ slug: slugValidation.slug });

    if (!event) {
      return NextResponse.json<ErrorResponse>(
        { message: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<SuccessResponse>(
      { message: "Event fetched successfully", event },
      { status: 200 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json<ErrorResponse>(
      { message: "Failed to fetch event", error: message },
      { status: 500 }
    );
  }
}

