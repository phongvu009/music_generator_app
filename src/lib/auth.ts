import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "~/server/db";

export const auth = betterAuth({
    database: prismaAdapter(db , {
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
});
