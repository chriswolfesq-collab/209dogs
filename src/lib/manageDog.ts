import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/adminAuth";

// Looks a dog up by its private manageToken. Additionally, when the request
// carries a valid admin session, falls back to matching by the dog's public
// id — so the site admin can manage any listing from its normal /dogs/{id}
// URL without needing the finder's private link.
export function findManagedDog<S extends Prisma.DogSelect | undefined = undefined>(
  req: NextRequest,
  token: string,
  select?: S
) {
  const where: Prisma.DogWhereInput = isAdminRequest(req)
    ? { OR: [{ manageToken: token }, { id: token }] }
    : { manageToken: token };

  return prisma.dog.findFirst({ where, select } as Prisma.DogFindFirstArgs) as Promise<
    (S extends Prisma.DogSelect ? Prisma.DogGetPayload<{ select: S }> : Prisma.DogGetPayload<object>) | null
  >;
}
