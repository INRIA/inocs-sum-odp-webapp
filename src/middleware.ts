import { defineMiddleware } from "astro:middleware";
import { getSession } from "auth-astro/server";

// Routes that require authentication
const PROTECTED_ROUTES = ["/lab-admin"];

// Routes that should be accessible without authentication (even under protected paths)
const PUBLIC_ROUTES = ["/lab-admin/login", "/lab-admin/signup"];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect, request } = context;
  const pathname = url.pathname;

  const session = await getSession(request);
  const user = session?.user as any;
  // If user is authenticated and trying to access login page, redirect to dashboard
  if (["/lab-admin/login", "/lab-admin/signup"].includes(pathname) && user) {
    return redirect("/lab-admin");
  }

  // Check if the current route needs protection
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if it's a route that should remain public
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  // If it's a protected route but not public, check authentication
  if (isProtectedRoute && !isPublicRoute && !user) {
    return redirect("/lab-admin/login");
  }

  // User is authenticated, add user info to context for use in pages
  context.locals.user = user;

  return next();
});
