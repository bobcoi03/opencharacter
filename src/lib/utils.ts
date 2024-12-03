import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function for exponential backoff (can be placed in a separate file)
export function exponentialBackoff(attempt: number, initialDelay: number): number {
  return initialDelay * Math.pow(2, attempt);
}

// TRIAL RUN!!
export const PAID_USER_IDS = [
  "fc735725-b774-4376-bb38-538a3aada18f", // me local
  "ed84afc0-d6d9-4c15-8e4c-757618597ba1", // me prod
  "774657ea-b091-4f9a-af88-be659a0a9ffd", // other me prod
  "b3abb1e8-8d95-482f-8deb-ea3f86b56348", // m 17/10/24
  "b4cd8ebb-2731-452d-ac6b-06d51e5a8369", // m 20/10/24
  "3177bd61-74b2-46e9-a19c-c9ceb6fc591e", // Re 24/10/24 
  "221e44d6-9dee-4d73-a5e3-5cae0f8ead1c", // P 25/10/24
  "2c435f13-5ff7-434f-93c1-b3c0c90efe9b", // P friend 25/10/24,
  "3fd781ff-8ad6-4a4c-806f-4a58aaa17526", // w 26/10/24
  "918eb513-1b0c-4461-b07f-350d264540e4", // s 02/11/24,
  "7916e019-3574-49e5-838c-97aacd2ff97c", // xeno 27/11/24,
  "5f13568b-8f4f-470a-82db-ba248d2ff347", // chibi
];