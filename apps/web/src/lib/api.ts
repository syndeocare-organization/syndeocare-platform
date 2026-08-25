import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: unknown,
) {
  return NextResponse.json(
    { ok: false, error: { code, message, ...(details ? { details } : {}) } },
    { status },
  );
}

export function validationError(error: ZodError) {
  return apiError("VALIDATION_ERROR", "The request contains invalid fields.", 422, error.flatten());
}

export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}
