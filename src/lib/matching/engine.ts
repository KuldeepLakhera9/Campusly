import { IPersonMatch } from "@/types/people";

export interface CandidateUser {
  _id: { toString(): string } | string;
  publicIdentity: {
    username: string;
    avatarId: string;
    avatarColor: string;
    bio?: string;
    interests?: string[];
    lookingFor?: string[];
  };
  collegeName: string;
  sparksCount?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CurrentUserMatchingProfile {
  id: string;
  interests: string[];
  lookingFor?: string[];
  sparksCount?: number;
}

/**
 * Deterministic campus matching algorithm.
 * Computes transparent compatibility score (0-100%) and human-readable match explanations.
 * Strictly avoids dating language, romantic compatibility, or gamification.
 */
export function calculateMatch(
  currentUser: CurrentUserMatchingProfile,
  candidate: CandidateUser
): IPersonMatch {
  const myInterests = (currentUser.interests || []).map((i) => i.trim().toLowerCase());
  const candidateInterests = candidate.publicIdentity?.interests || [];

  // 1. Calculate Shared Interests
  const sharedInterests = candidateInterests.filter((interest) =>
    myInterests.includes(interest.trim().toLowerCase())
  );
  const sharedCount = sharedInterests.length;

  // 2. Calculate Shared Activity Preferences / Intents
  const myIntents = (currentUser.lookingFor || []).map((intent) => intent.trim().toLowerCase());
  const candidateIntents = candidate.publicIdentity?.lookingFor || [];
  const sharedIntents = candidateIntents.filter((intent) =>
    myIntents.includes(intent.trim().toLowerCase())
  );

  // 3. Compute Normalized Score Components (0–100)
  // Campus Base Affinity: 20% (both verified students in same collegiate community)
  const campusBase = 20;

  // Interest Overlap: Up to 50%
  let interestScore = 0;
  if (myInterests.length > 0 && candidateInterests.length > 0) {
    const minLen = Math.min(myInterests.length, candidateInterests.length);
    const overlapRatio = sharedCount / Math.max(1, minLen);
    interestScore = Math.min(50, Math.round(overlapRatio * 50));
  } else if (candidateInterests.length > 0) {
    interestScore = 15;
  }

  // Intent / Looking-for Overlap: Up to 20%
  let intentScore = 0;
  if (sharedIntents.length > 0) {
    intentScore = Math.min(20, 12 + sharedIntents.length * 4);
  } else if (myIntents.length === 0 || candidateIntents.length === 0) {
    intentScore = 8; // Neutral baseline when either has not specified intents
  }

  // Campus Activity & Spark Contribution: Up to 10%
  const sparks = candidate.sparksCount || 0;
  const activityScore = Math.min(10, Math.max(3, Math.floor(sparks / 2)));

  // Normalized final total
  const rawScore = campusBase + interestScore + intentScore + activityScore;
  const score = Math.min(99, Math.max(15, rawScore));

  // 4. Generate Human-Readable Match Explanations
  const matchReasons: string[] = [];

  if (sharedCount > 0) {
    matchReasons.push(
      `${sharedCount} shared interest${sharedCount > 1 ? "s" : ""}`
    );
    if (sharedInterests.length === 1) {
      matchReasons.push(`Both interested in ${sharedInterests[0]}`);
    } else if (sharedInterests.length >= 2) {
      matchReasons.push(
        `Both interested in ${sharedInterests.slice(0, 2).join(" & ")}`
      );
    }
  }

  if (sharedIntents.length > 0) {
    matchReasons.push(`Both open to ${sharedIntents[0].toLowerCase()}`);
  }

  if (sparks >= 15) {
    matchReasons.push("Active campus contributor");
  }

  // Fallback reason if low overlap
  if (matchReasons.length === 0) {
    if (candidateInterests.length > 0) {
      matchReasons.push(`Interested in ${candidateInterests[0]}`);
    } else {
      matchReasons.push("Fellow verified campus peer");
    }
  }

  const candidateId =
    typeof candidate._id === "string"
      ? candidate._id
      : candidate._id?.toString?.() || "";

  return {
    user: {
      id: candidateId,
      username: candidate.publicIdentity?.username || "Student",
      avatarId: candidate.publicIdentity?.avatarId || "terracotta-prism",
      avatarColor: candidate.publicIdentity?.avatarColor || "#C15438",
      bio: candidate.publicIdentity?.bio || "",
      collegeName: candidate.collegeName || "Campus Community",
      interests: candidateInterests,
      lookingFor: candidateIntents,
      sparksCount: sparks,
      createdAt: candidate.createdAt
        ? new Date(candidate.createdAt).toISOString()
        : undefined,
    },
    score,
    sharedInterests,
    sharedCount,
    matchReasons,
  };
}
