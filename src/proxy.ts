import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Protect all routes under /dashboard
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/api(.*)"]);

// Public routes (if any need to be explicitly public, though the matcher above is inclusive for protection)
// For now, we protect /dashboard and /api by default.
// Public routes like sign-in implementation details are handled by Clerk automatically usually, 
// but we only strictly enforcing auth on matched routes.

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
