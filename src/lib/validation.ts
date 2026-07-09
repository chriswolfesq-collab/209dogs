import { z } from "zod";

export const createDogSchema = z.object({
  photoUrl: z.string().min(1, "Photo is required"),
  foundLat: z.number().min(-90).max(90),
  foundLng: z.number().min(-180).max(180),
  foundLocation: z.string().min(3, "Describe where you found the dog").max(300),
  foundDate: z.string().min(1, "Date found is required"),
  breedGuess: z.string().max(100).optional(),
  size: z.enum(["small", "medium", "large"]).optional(),
  color: z.string().max(100).optional(),
  hasCollar: z.boolean().default(false),
  collarTagInfo: z.string().max(500).optional(),
  temperament: z.string().max(300).optional(),
  holdingStatus: z.enum(["holding", "still_loose", "taken_to_shelter"]),
  notes: z.string().max(2000).optional(),
  finderEmail: z.string().email("Enter a valid email").max(254),
  // Honeypot: real users never fill this in; bots often do.
  website: z.string().max(0).optional(),
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

export type CreateDogInput = z.infer<typeof createDogSchema>;
export type CreateClaimInput = z.infer<typeof createClaimSchema>;
