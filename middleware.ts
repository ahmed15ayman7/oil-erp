import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      // Only allow authenticated users to access the dashboard
      if (req.nextUrl.pathname.startsWith("/dashboard")) {
        return !!token;
      }
      return true;
    },
  },
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
