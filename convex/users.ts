import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const updateProfile = mutation({
  args: {
    username: v.string(),
    bio: v.optional(v.string()),
    instagram: v.optional(v.string()),
    twitter: v.optional(v.string()),
    profilePicture: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    try {
      console.log('Starting profile update with args:', JSON.stringify(args, null, 2));
      
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        console.error('Not authenticated');
        throw new Error("Not authenticated");
      }
      console.log('Updating profile for user ID:', userId);

      // Update the user's name in the users table
      try {
        await ctx.db.patch(userId, {
          name: args.username,
        });
        console.log('Successfully updated user name');
      } catch (error) {
        console.error('Error updating user name:', error);
        throw new Error(`Failed to update user name: ${error}`);
      }

      // Update or create the user's profile
      try {
        const existingProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();

        console.log('Existing profile:', existingProfile ? 'found' : 'not found');

        const profileData = {
          userId,
          bio: args.bio || undefined,
          instagram: args.instagram || undefined,
          twitter: args.twitter || undefined,
          profilePicture: args.profilePicture || undefined,
        };

        console.log('Profile data to save:', JSON.stringify(profileData, null, 2));

        if (existingProfile) {
          console.log('Updating existing profile with ID:', existingProfile._id);
          await ctx.db.patch(existingProfile._id, profileData);
          console.log('Successfully updated profile');
        } else {
          console.log('Creating new profile');
          await ctx.db.insert("userProfiles", {
            ...profileData,
            // Ensure required fields are set
            bio: profileData.bio || '',
            instagram: profileData.instagram || '',
            twitter: profileData.twitter || '',
          });
          console.log('Successfully created new profile');
        }
      } catch (error) {
        console.error('Error updating profile data:', error);
        throw new Error(`Failed to update profile data: ${error}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateProfile mutation:', error);
      throw error; // Re-throw to ensure the client gets the error
    }
  },
});

export const getUserProfile = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return {
      ...user,
      bio: profile?.bio || "",
      instagram: profile?.instagram || "",
      twitter: profile?.twitter || "",
      profilePicture: profile?.profilePicture || null,
    };
  },
});
