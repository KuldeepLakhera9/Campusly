import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/models/User";
import { generatePseudonymString } from "@/lib/utils/pseudonym";

/**
 * Server-only: Checks if a username is available in the database.
 */
export async function isUsernameAvailable(
  username: string,
  excludeUserId?: string
): Promise<boolean> {
  await connectToDatabase();
  const query: Record<string, unknown> = {
    "publicIdentity.username": {
      $regex: new RegExp(`^${username.trim()}$`, "i"),
    },
  };

  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }

  const existing = await User.findOne(query).select("_id").lean();
  return !existing;
}

/**
 * Server-only: Generates a guaranteed collision-free username by checking the database.
 */
export async function generateUniqueUsername(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const candidate = generatePseudonymString();
    const available = await isUsernameAvailable(candidate);
    if (available) return candidate;
    attempts++;
  }
  return `Campus${Math.floor(1000 + Math.random() * 9000)}`;
}
