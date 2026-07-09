import { z } from "zod";

// Shared by create/update: must parse to a real date and can't be in the
// future (allowing a day of slack for timezone differences between the
// browser and server).
const foundDateSchema = z
  .string()
  .min(1, "Date is required")
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "Enter a valid date")
  .refine(
    (v) => new Date(v).getTime() <= Date.now() + 24 * 60 * 60 * 1000,
    "Date can't be in the future"
  );

export const createDogSchema = z.object({
  listingType: z.enum(["found", "lost"]).default("found"),
  dogName: z.string().max(100).optional(),
  photoUrl: z.string().min(1, "Photo is required"),
  foundLat: z.number().min(-90).max(90),
  foundLng: z.number().min(-180).max(180),
  foundLocation: z.string().min(3, "Describe the location").max(300),
  foundDate: foundDateSchema,
  breedGuess: z.string().max(100).optional(),
  size: z.enum(["small", "medium", "large"]).optional(),
  color: z.string().max(100).optional(),
  hasCollar: z.boolean().default(false),
  collarTagInfo: z.string().max(500).optional(),
  temperament: z.string().max(300).optional(),
  holdingStatus: z.enum(["holding", "still_loose", "taken_to_shelter"]).default("holding"),
  notes: z.string().max(2000).optional(),
  finderEmail: z.string().email("Enter a valid email").max(254),
  // Honeypot: real users never fill this in; bots often do.
  website: z.string().max(0).optional(),
})
  .refine((data) => data.listingType !== "lost" || Boolean(data.dogName?.trim()), {
    message: "Your dog's name is required",
    path: ["dogName"],
  });

// Fields the edit form can blank out use .nullable() rather than just
// .optional(): the client sends an explicit `null` to clear a field, since
// an omitted (undefined) key is a no-op in a Prisma update rather than a
// clear.
export const updateDogSchema = z.object({
  dogName: z.string().max(100).nullable().optional(),
  photoUrl: z.string().min(1, "Photo is required"),
  foundLat: z.number().min(-90).max(90),
  foundLng: z.number().min(-180).max(180),
  foundLocation: z.string().min(3, "Describe the location").max(300),
  foundDate: foundDateSchema,
  breedGuess: z.string().max(100).nullable().optional(),
  size: z.enum(["small", "medium", "large"]).nullable().optional(),
  color: z.string().max(100).nullable().optional(),
  hasCollar: z.boolean().default(false),
  collarTagInfo: z.string().max(500).nullable().optional(),
  temperament: z.string().max(300).nullable().optional(),
  holdingStatus: z.enum(["holding", "still_loose", "taken_to_shelter"]).default("holding"),
  notes: z.string().max(2000).nullable().optional(),
});

export const createClaimSchema = z.object({
  claimantName: z.string().min(1, "Name is required").max(100),
  claimantContact: z.string().min(3, "Phone or email is required").max(200),
  proofAnswer: z
    .string()
    .min(10, "Please give a more detailed answer (10+ characters)")
    .max(1000),
  website: z.string().max(0).optional(),
});

export const updateClaimStatusSchema = z.object({
  status: z.enum(["new", "finder_contacted", "rejected"]),
});

export const subscribeSchema = z.object({
  email: z.string().email("Enter a valid email").max(254),
  // Honeypot: real users never fill this in; bots often do.
  website: z.string().max(0).optional(),
});

export type CreateDogInput = z.infer<typeof createDogSchema>;
export type UpdateDogInput = z.infer<typeof updateDogSchema>;
export type CreateClaimInput = z.infer<typeof createClaimSchema>;
