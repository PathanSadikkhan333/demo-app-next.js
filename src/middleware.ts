import { clerkMiddleware } from '@clerk/nextjs/server';

export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)', // Matches all routes except Next.js internals and static files
    '/(api|trpc)(.*)',        // Matches API and tRPC routes
  ],
};

export default clerkMiddleware();
