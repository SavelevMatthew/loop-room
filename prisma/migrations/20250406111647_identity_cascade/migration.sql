-- DropForeignKey
ALTER TABLE "UserExternalIdentity" DROP CONSTRAINT "UserExternalIdentity_userId_fkey";

-- AddForeignKey
ALTER TABLE "UserExternalIdentity" ADD CONSTRAINT "UserExternalIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
