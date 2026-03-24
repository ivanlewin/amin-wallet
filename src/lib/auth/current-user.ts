import "server-only";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { redirect } from "next/navigation";

import { db, categories, type CategoryTag, users } from "@/lib/db";
import { buildColorIcon, serializeIcon } from "@/lib/domain/icons";

type SystemCategorySeed = {
  tag: CategoryTag;
  name: string;
  color: string;
};

const systemCategorySeeds: SystemCategorySeed[] = [
  { tag: "transfer", name: "Transfer", color: "#2563eb" },
  { tag: "transfer_tax", name: "Transfer Fee", color: "#0f766e" },
  { tag: "debt", name: "Debt", color: "#b45309" },
  { tag: "paid_debt", name: "Debt Payment", color: "#047857" },
  { tag: "credit", name: "Credit", color: "#7c3aed" },
  { tag: "paid_credit", name: "Credit Payment", color: "#db2777" },
  { tag: "tax", name: "Tax", color: "#dc2626" },
  { tag: "deposit", name: "Deposit", color: "#15803d" },
  { tag: "withdraw", name: "Withdrawal", color: "#1d4ed8" },
];

export const requireCurrentUserId = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return userId;
});

export const syncCurrentUser = cache(async () => {
  const userId = await requireCurrentUserId();
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);

  const primaryEmail =
    clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const primaryPhone =
    clerkUser.primaryPhoneNumber?.phoneNumber ?? clerkUser.phoneNumbers[0]?.phoneNumber ?? null;
  const userRecord = {
    id: userId,
    email: primaryEmail,
    emails: clerkUser.emailAddresses.map((email) => email.emailAddress),
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    imageUrl: clerkUser.imageUrl,
    phoneNumber: primaryPhone,
    phoneNumbers: clerkUser.phoneNumbers.length
      ? clerkUser.phoneNumbers.map((phone) => phone.phoneNumber)
      : null,
    publicMetadata: asJson(clerkUser.publicMetadata),
    unsafeMetadata: asJson(clerkUser.unsafeMetadata),
    createdAt: toDate(clerkUser.createdAt),
    updatedAt: toDate(clerkUser.updatedAt),
  };

  return db.transaction(async (tx) => {
    const [savedUser] = await tx
      .insert(users)
      .values(userRecord)
      .onConflictDoUpdate({
        target: users.id,
        set: userRecord,
      })
      .returning();

    await tx
      .insert(categories)
      .values(
        systemCategorySeeds.map((seed, index) => ({
          userId,
          name: seed.name,
          icon: serializeIcon(buildColorIcon(seed.name, seed.color)),
          type: "system" as const,
          tag: seed.tag,
          includeInReports: false,
          sortIndex: index,
        })),
      )
      .onConflictDoNothing({
        target: [categories.userId, categories.tag],
      });

    return savedUser;
  });
});

export const getCurrentUserRecord = cache(async () => {
  const userId = await requireCurrentUserId();
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return existingUser ?? syncCurrentUser();
});

function toDate(value: Date | number | null | undefined): Date {
  if (value instanceof Date) {
    return value;
  }

  return new Date(value ?? Date.now());
}

function asJson(value: Record<string, unknown> | null | undefined) {
  if (!value || Object.keys(value).length === 0) {
    return null;
  }

  return value;
}
