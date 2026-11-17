import "server-only";
import { cookies } from "next/headers";
import {
  randomBytes,
  createHash,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { readyDb, publicUser } from "./db";
const scrypt = promisify(scryptCallback);
export const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export const token = () => randomBytes(32).toString("hex");
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}
export async function passwordMatches(password: string, stored: string) {
  const [salt, hex] = stored.split(":");
  const expected = Buffer.from(hex, "hex");
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export async function currentUser() {
  const value = (await cookies()).get("coachos_session")?.value;
  if (!value) return null;
  const d = await readyDb();
  const session = await d.sessions.findOne({
    _id: hash(value),
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;
  const user = await d.users.findOne({ _id: session.userId });
  return user ? publicUser(user) : null;
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Please sign in.");
  return user;
}
export async function startSession(userId: string) {
  const value = token();
  const expiresAt = new Date(Date.now() + 30 * 86400000);
  const d = await readyDb();
  await d.sessions.insertOne({ _id: hash(value), userId, expiresAt });
  (await cookies()).set("coachos_session", value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}
export async function endSession() {
  const jar = await cookies();
  const value = jar.get("coachos_session")?.value;
  if (value) await (await readyDb()).sessions.deleteOne({ _id: hash(value) });
  jar.delete("coachos_session");
}
export function sameOrigin(req: Request) {
  const expected = process.env.APP_URL;
  if (process.env.NODE_ENV === "production" && !expected)
    throw new HttpError(503, "APP_URL must be configured.");
  if (
    req.headers.get("origin") !==
    (expected ? new URL(expected).origin : new URL(req.url).origin)
  )
    throw new HttpError(403, "Request origin is not allowed.");
}
export async function limit(key: string, max = 30) {
  const d = await readyDb();
  const bucket = Math.floor(Date.now() / 600000);
  const row = await d.rates.findOneAndUpdate(
    { _id: hash(key) + ":" + bucket },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date(Date.now() + 1200000) },
    },
    { upsert: true, returnDocument: "after" },
  );
  if ((row?.count ?? 0) > max)
    throw new HttpError(429, "Too many attempts. Try again in 10 minutes.");
}
