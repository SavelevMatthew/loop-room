/*
  Warnings:

  - The values [GitHub] on the enum `IdentityProvider` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "IdentityProvider_new" AS ENUM ('github');
ALTER TABLE "UserExternalIdentity" ALTER COLUMN "provider" TYPE "IdentityProvider_new" USING ("provider"::text::"IdentityProvider_new");
ALTER TYPE "IdentityProvider" RENAME TO "IdentityProvider_old";
ALTER TYPE "IdentityProvider_new" RENAME TO "IdentityProvider";
DROP TYPE "IdentityProvider_old";
COMMIT;
