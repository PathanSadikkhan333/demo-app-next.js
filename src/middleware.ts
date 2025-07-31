import { clerkMiddleware } from '@clerk/nextjs/server';

/**
 * Clerk middleware for user authentication session handling.
 * Applies to all requests except Next.js internals and common static file types,
 * but always applies to API and TRPC routes.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files with common extensions 
    // This regex skips paths starting with _next and static assets 
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',

    // Always run middleware for API and TRPC routes
    '/(api|trpc)(.*)',
  ],
};
