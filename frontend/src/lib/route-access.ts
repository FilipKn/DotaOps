export type RouteAccess = "auth" | "organizer" | "public" | "public-content";

export function routeAccessForPath(pathname: string): RouteAccess {
  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    return "public";
  }

  if (pathname === "/turnirji" || pathname.startsWith("/turnirji/")) {
    return "public-content";
  }

  if (pathname === "/organizator" || pathname.startsWith("/organizator/")) {
    return "organizer";
  }

  return "auth";
}

export function isOrganizerRole(role?: string | null) {
  return role === "organizer" || role === "admin";
}

export function isPublicShellRoute(pathname: string) {
  return routeAccessForPath(pathname) === "public";
}
