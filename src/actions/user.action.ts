"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function syncUser() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    // Early return if missing userId or user to avoid unnecessary DB calls
    if (!userId || !user) {
      return null;  // Or handle as you prefer
    }

    // Check if the user already exists in the database
    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId: userId, // Make sure 'clerkId' is the correct field name in your Prisma schema
      },
    });

    if (existingUser) {
      return existingUser;
    }

    // Create a new user record if not found
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
    throw error; // Optionally rethrow the error depending on your error handling strategy
  }
}


export async function getUserByClerkId(clerkId:string){
  return prisma.user.findUnique({
    where:{
      clerkId,
    },
    include:{
      _count:{
        select:{
          followers:true,
          following:true,
          post:true,
        },
      },
    },
  });
}


export async function getDbUserId(){
  const {userId:clerkId} =await auth();
  if(!clerkId)throw new Error("Unauthorized");

  const user = await getUserByClerkId(clerkId);

  if(!user) throw new Error("User not found");
  return user.id
}