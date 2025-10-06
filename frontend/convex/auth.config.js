export default {
  providers: [
    // Support both dev and production Clerk instances
    {
      domain: "https://clerk.trainlyai.com",
      applicationID: "convex",
    },
    {
      domain: "https://hardy-firefly-8.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
