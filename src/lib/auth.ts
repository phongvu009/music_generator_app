import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "~/server/db";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { POLAR_PRODUCTS } from "~/lib/constants";
import { Polar } from "@polar-sh/sdk";
import { env } from "~/env"

const polarClient = new Polar({
  // Use the Polar API access token for client operations (not the webhook secret).
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: 'sandbox'
})

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  // `trustedOrigins` must be a top-level property in the configuration.
  trustedOrigins: [
    "http://192.168.68.70:3000",
    "http://localhost:3000",
    // We filter out any undefined/empty environment variables to keep the array clean.
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean) as string[],
  emailAndPassword: {
    enabled: true,
    // Provide a minimal sendResetPassword handler so the "request-password-reset" endpoint is enabled.
    // In production you should send a real email. For local dev we just log the reset URL.
    sendResetPassword: async ({ user, url, token }, req) => {
      // eslint-disable-next-line no-console
      console.log(`[dev] Password reset requested for user=${user.email} token=${token} url=${url}`);
      return;
    },
    // token expiry in seconds (e.g., 1 hour)
    resetPasswordTokenExpiresIn: 60 * 60,
  },
  // ... Better Auth config
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: POLAR_PRODUCTS.SMALL.id, // ID of Product from Polar Dashboard
              slug: POLAR_PRODUCTS.SMALL.slug // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
            },
            {
              productId: POLAR_PRODUCTS.MEDIUM.id,
              slug: POLAR_PRODUCTS.MEDIUM.slug
            },
            {
              productId: POLAR_PRODUCTS.LARGE.id,
              slug: POLAR_PRODUCTS.LARGE.slug
            }
          ],
          successUrl: "/",
          authenticatedUsersOnly: true
        }),
        portal(),
        usage(),
        webhooks({
          secret: env.POLAR_WEBHOOK_SECRET,
          onOrderPaid: async (order) => {
            const externalCustomerId = order.data.customer.externalId;

            if (!externalCustomerId) {
              console.error("No external customer ID found")
              throw new Error("No external customer id found")
            }

            const productId = order.data.productId;

            let creditsToAdd = 0

            switch (productId) {
              case POLAR_PRODUCTS.SMALL.id:
                creditsToAdd = POLAR_PRODUCTS.SMALL.credits;
                break
              case POLAR_PRODUCTS.MEDIUM.id:
                creditsToAdd = POLAR_PRODUCTS.MEDIUM.credits;
                break
              case POLAR_PRODUCTS.LARGE.id:
                creditsToAdd = POLAR_PRODUCTS.LARGE.credits;
                break
            }

            await db.user.update({
              where: { id: externalCustomerId },
              data: {
                credits: {
                  increment: creditsToAdd
                }
              }
            })

          }

        })
      ],
    })
  ]
});
