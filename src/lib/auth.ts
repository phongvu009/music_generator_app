import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "~/server/db";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { env } from "~/env"

const polarClient = new Polar({
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
              productId: "747fdb87-5be4-4dbe-bc14-0044e4dfd1bd", // ID of Product from Polar Dashboard
              slug: "small" // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
            },
            {
              productId: "6169a291-218a-48b0-9c31-ab407c935aa9",
              slug: "medium"
            },
            {
              productId: "1f3b53ed-75c8-42bc-aa18-43d584e099de",
              slug: "large"
            }
          ],
          successUrl: "/",
          authenticatedUsersOnly: true
        }),
        portal(),
        usage(),
        webhooks({
          secret: env.POLAR_ACCESS_TOKEN,
          onOrderPaid: async (order) => {
            const externalCustomerId = order.data.customer.externalId;

            if (!externalCustomerId) {
              console.error("No external customer ID found")
              throw new Error("No external customer id found")
            }

            const productId = order.data.productId;

            let creditsToAdd = 0

            switch (productId) {
              case "747fdb87-5be4-4dbe-bc14-0044e4dfd1bd":
                creditsToAdd = 10;
                break
              case "6169a291-218a-48b0-9c31-ab407c935aa9":
                creditsToAdd = 25;
                break
              case "1f3b53ed-75c8-42bc-aa18-43d584e099de":
                creditsToAdd = 50
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
