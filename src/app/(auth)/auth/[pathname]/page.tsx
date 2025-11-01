// Import the UI component from the better-auth-ui library that will render the authentication forms.
import { AuthView } from "@daveyplate/better-auth-ui";
// Import the predefined paths for the authentication views (e.g., 'sign-in', 'sign-up')
// This is used for generating static pages at build time.
import { authViewPaths } from "@daveyplate/better-auth-ui/server";

export const dynamicParams = false;

/**
 * Generates static paths for all available authentication pages.
 * This allows Next.js to pre-render these pages at build time for better performance.
 * It maps over the `authViewPaths` from `@daveyplate/better-auth-ui`
 * to create paths like `/auth/sign-in`, `/auth/sign-up`, etc.
 */
export function generateStaticParams() {
  return Object.values(authViewPaths).map((pathname) => ({ pathname }));
}

/**
 * The main server component for authentication pages.
 * It uses a dynamic route segment `[pathname]` to render the correct view.
 */
export default async function AuthPage({ params }: { params: Promise<{ pathname: string }> }) {
  // Await the params promise to resolve, then get the `pathname` property.
  // This corresponds to the dynamic segment `[pathname]` in the file path.
  const { pathname } = await params;
  return (
    <main className="container flex grow flex-col items-center justify-center self-center p-4 md:p-6">
      <AuthView path={pathname} />
    </main>
  );
}