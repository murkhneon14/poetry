import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listPublicPoems = query({
  args: {},
  handler: async (ctx) => {
    const poems = await ctx.db
      .query("poems")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .collect();
    
    return poems;
  },
});

export const createPoem = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    isPublic: v.boolean(),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    let authorName = "Anonymous";
    let username = args.username || "Anonymous";
    
    if (userId) {
      const user = await ctx.db.get(userId);
      authorName = user?.name || user?.email || "Anonymous";
      // If no username provided, try to derive from user data
      if (!args.username) {
        username = user?.name || user?.email?.split('@')[0] || "Anonymous";
      }
    }
    
    const poemId = await ctx.db.insert("poems", {
      title: args.title,
      content: args.content,
      authorId: userId || undefined,
      authorName,
      username,
      isPublic: args.isPublic,
    });
    
    return poemId;
  },
});

export const getVisitorCount = query({
  args: {},
  handler: async (ctx) => {
    const visitor = await ctx.db.query("visitors").first();
    return visitor?.count || 0;
  },
});

export const incrementVisitorCount = mutation({
  args: {},
  handler: async (ctx) => {
    const visitor = await ctx.db.query("visitors").first();
    
    if (visitor) {
      await ctx.db.patch(visitor._id, {
        count: visitor.count + 1,
      });
      return visitor.count + 1;
    } else {
      await ctx.db.insert("visitors", { count: 1 });
      return 1;
    }
  },
});
