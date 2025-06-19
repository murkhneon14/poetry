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
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
