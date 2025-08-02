


"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Syncs the authenticated Clerk user with the database,
 * creating a user record if it doesn't exist.
 */
export async function syncUser() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    // Early return if not authenticated or user info missing
    if (!userId || !user) {
      return null;
    }

    // Check if user already exists in DB
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (existingUser) {
      return existingUser;
    }

    // Create new user record
    const dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
        username:
          user.username ??
          user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ??
          "",
        email: user.emailAddresses?.[0]?.emailAddress ?? "",
        image: user.imageUrl ?? null,
      },
    });

    return dbUser;
  } catch (error) {
    console.error("Error in syncUser:", error);
    throw error;
  }
}

/**
 * Fetch user by their Clerk ID including counts of relations.
 */
export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          post: true,
        },
      },
    },
  });
}

/**
 * Gets the database user ID corresponding to the authenticated Clerk user.
 * Throws an error if not authenticated or user not found.
 */
export async function getDbUserId() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error("User is not authenticated");
  }

  const user = await getUserByClerkId(clerkId);

  if (!user) {
    throw new Error("User not found");
  }

  return user.id;
}

/**
 * Fetch 3 random users excluding the current user and users already followed.
 */
export async function getRandomUsers() {
  try {
    const userId = await getDbUserId();

    if (!userId) return [];

    const randomUsers = await prisma.user.findMany({
      where: {
        AND: [
          { NOT: { id: userId } },
          {
            NOT: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      take: 3,
    });

    return randomUsers;
  } catch (error) {
    console.error("Error fetching random users:", error);
    return [];
  }
}

/**
 * Toggles following/unfollowing a target user.
 */
export async function toggleFollow(targetUserId: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    if (userId === targetUserId) {
      throw new Error("You cannot follow yourself");
    }

    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
      });
    } else {
      // Follow with notification in transaction
      await prisma.$transaction([
        prisma.follows.create({
          data: {
            followerId: userId,
            followingId: targetUserId,
          },
        }),
        prisma.notification.create({
          data: {
            type: "FOLLOW",
            userId: targetUserId, // user who is followed
            creatorId: userId, // user who follows
          },
        }),
      ]);
    }

    revalidatePath("/"); // Invalidate homepage cache or relevant paths

    return { success: true };
  } catch (error) {
    console.error("Error in toggleFollow:", error);

    // Provide the error message if available
    const message =
      error instanceof Error ? error.message : "Error toggling follow";

    return { success: false, error: message };
  }
}
