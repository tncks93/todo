import { NextResponse } from "next/server";
import mongoose from "mongoose";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

/** Throws ApiError(400) when `id` is not a valid Mongo ObjectId. */
export function assertObjectId(id: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid id: ${id}`);
  }
}

/** Parse a JSON request body, throwing ApiError(400) on malformed input. */
export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
}

/** Convert a Mongoose doc / lean object to a plain JSON-safe object. */
export function serialize<T>(doc: unknown): T {
  const obj =
    doc && typeof (doc as { toObject?: unknown }).toObject === "function"
      ? (doc as { toObject: () => unknown }).toObject()
      : doc;
  return JSON.parse(JSON.stringify(obj)) as T;
}

/** Map any thrown value to a NextResponse with the right status code. */
export function handleError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  if (err instanceof mongoose.Error.CastError) {
    return NextResponse.json({ error: `Invalid ${err.path}` }, { status: 400 });
  }
  const code = (err as { code?: number })?.code;
  if (code === 11000) {
    return NextResponse.json(
      { error: "Resource already exists for that key" },
      { status: 409 }
    );
  }
  console.error("[api] unhandled error", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
