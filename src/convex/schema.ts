import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const metalOptionValidator = v.object({
  metalType: v.string(),
  // New products use an absolute variant price. Keep priceAdjustment for old records.
  price: v.optional(v.number()),
  priceAdjustment: v.optional(v.number()),
});

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
    }).index("email", ["email"]),

    // Etherstar Jewels — lab-grown diamond products
    products: defineTable({
      name: v.string(),
      slug: v.optional(v.string()),
      description: v.string(),
      // base price before metal adjustment
      basePrice: v.number(),
      stock: v.number(),
      // default metal type (first in metalOptions)
      metalType: v.string(),
      size: v.string(),
      sizeType: v.optional(
        v.union(v.literal("Ring Size"), v.literal("Inches"), v.literal("One Size"), v.literal("Custom")),
      ),
      carat: v.number(),
      diamondType: v.optional(
        v.union(v.literal("Moissanite"), v.literal("CVD"), v.literal("Natural Diamond")),
      ),
      weightGrams: v.optional(v.number()),
      settingType: v.optional(v.string()),
      cut: v.union(
        v.literal("Ideal"),
        v.literal("Excellent"),
        v.literal("Very Good"),
        v.literal("Good"),
      ),
      color: v.union(
        v.literal("D"),
        v.literal("E"),
        v.literal("F"),
        v.literal("G"),
        v.literal("H"),
        v.literal("I"),
      ),
      clarity: v.union(
        v.literal("FL"),
        v.literal("IF"),
        v.literal("VVS1"),
        v.literal("VVS2"),
        v.literal("VS1"),
        v.literal("VS2"),
        v.literal("SI1"),
        v.literal("SI2"),
      ),
      // primary image URL (kept for backward compat)
      imageUrl: v.string(),
      // all product images (4-5 angles)
      images: v.array(v.string()),
      // Convex storage ID of a directly-uploaded primary image (optional).
      // When present, it takes display priority over imageUrl/images[0].
      imageStorageId: v.optional(v.id("_storage")),
      imageStorageIds: v.optional(v.array(v.id("_storage"))),
      // metal variants with per-metal price adjustments
      metalOptions: v.array(metalOptionValidator),
      certificateUrl: v.optional(v.string()),
      certificateType: v.optional(v.union(v.literal("GIA"), v.literal("IGI"))),
      certificateNumber: v.optional(v.string()),
      category: v.string(),
      featured: v.boolean(),
    })
      .index("by_category", ["category"])
      .index("by_featured", ["featured"])
      .index("by_price", ["basePrice"])
      .index("by_metal", ["metalType"])
      .index("by_carat", ["carat"])
      .index("by_slug", ["slug"]),

    // Custom design inquiries
    inquiries: defineTable({
      firstName: v.string(),
      lastName: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      jewelryType: v.string(),
      metal: v.optional(v.string()),
      description: v.optional(v.string()),
      images: v.optional(v.array(v.string())),
      status: v.union(
        v.literal("new"),
        v.literal("reviewed"),
        v.literal("responded"),
      ),
    })
      .index("by_status", ["status"])
      .index("by_email", ["email"]),

    phoneVerifications: defineTable({
      phone: v.string(),
      verifiedAt: v.number(),
      expiresAt: v.number(),
    }),

    // User wishlists — one row per user-product pair
    wishlists: defineTable({
      userId: v.id("users"),
      productId: v.id("products"),
    })
      .index("by_user", ["userId"])
      .index("by_user_product", ["userId", "productId"]),

    // OTP delivery status used to surface test-mode codes on the auth card
    // whenever the email provider could not deliver (missing key, Resend
    // 4xx/5xx, network errors). Codes expire with the auth code (10 min).
    otpFallbackCodes: defineTable({
      email: v.string(),
      code: v.string(),
      delivered: v.boolean(),
      expiresAt: v.number(),
    }).index("by_email", ["email"]),

    // Admin OTP verification — generated when a user requests admin access.
    // The 6-digit code is "sent" to the company master email (e.g.
    // etherstarjewels@gmail.com). Only someone with access to that inbox
    // can provide the code to the requesting user.
    adminOtpCodes: defineTable({
      userId: v.string(),
      code: v.string(),
      delivered: v.boolean(),
      expiresAt: v.number(),
    }).index("by_user", ["userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
