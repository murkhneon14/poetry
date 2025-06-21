import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  poems: defineTable({
    title: v.string(),
    content: v.string(),
    authorId: v.optional(v.id("users")),
    authorName: v.optional(v.string()),
    username: v.optional(v.string()),
    isPublic: v.boolean(),
  }).index("by_public", ["isPublic"]),
  
  visitors: defineTable({
    count: v.number(),
  }),

  // Extended user profile
  userProfiles: defineTable({
    userId: v.id("users"),
    bio: v.optional(v.string()),
    instagram: v.optional(v.string()),
    twitter: v.optional(v.string()),
    profilePicture: v.optional(v.string()),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
