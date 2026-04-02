-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FARMER', 'CONSUMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SOLD', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EscrowEvent" AS ENUM ('DEPOSIT', 'WAGE_RELEASE', 'FINAL_SETTLEMENT', 'REFUND', 'DISPUTE_LOCK');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'HARVESTED', 'DELIVERED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CONTRACT_CREATED', 'CONTRACT_ACCEPTED', 'CONTRACT_REJECTED', 'CONTRACT_COMPLETED', 'PAYMENT_RECEIVED', 'WAGE_RELEASED', 'DELIVERY_CREATED', 'DELIVERY_VERIFIED', 'DISPUTE_OPENED', 'DISPUTE_RESOLVED', 'FARM_UPDATE', 'NEW_MESSAGE', 'GENERAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'FARMER',
    "kyc_status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "kyc_documents" JSONB,
    "razorpay_customer_id" TEXT,
    "razorpay_fund_account_id" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "refresh_token" TEXT,
    "expo_push_token" TEXT,
    "otp" TEXT,
    "otp_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "farm_size_acres" DOUBLE PRECISION,
    "farm_type" TEXT,
    "crops_grown" TEXT[],
    "irrigation_type" TEXT,
    "years_of_experience" INTEGER,
    "land_records_url" TEXT,
    "soil_type" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmListing" (
    "id" TEXT NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "area_acres" DOUBLE PRECISION NOT NULL,
    "price_per_acre" DOUBLE PRECISION NOT NULL,
    "crops" TEXT[],
    "location_name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "soil_type" TEXT,
    "irrigation_type" TEXT,
    "is_organic" BOOLEAN NOT NULL DEFAULT false,
    "organic_cert_url" TEXT,
    "expected_harvest_month" TEXT,
    "expected_yield_per_acre" DOUBLE PRECISION,
    "images" TEXT[],
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "views" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "consumer_id" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "acreage" DOUBLE PRECISION NOT NULL,
    "price_per_acre" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'PENDING',
    "escrow_held" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "farmer_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "escrow_frozen" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmUpdate" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "media_url" TEXT NOT NULL,
    "media_type" TEXT NOT NULL,
    "caption" TEXT,
    "wage_released" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowLedger" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event" "EscrowEvent" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "description" TEXT,
    "razorpay_payment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscrowLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "batch_number" TEXT,
    "yield_amount_kg" DOUBLE PRECISION,
    "quality_grade" TEXT,
    "delivery_date" TIMESTAMP(3),
    "delivery_proof_url" TEXT,
    "organic_verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "evidence_urls" TEXT[],
    "escrow_frozen" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "balance_after" DOUBLE PRECISION NOT NULL,
    "razorpay_payout_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "participant_one_id" TEXT NOT NULL,
    "participant_two_id" TEXT NOT NULL,
    "contract_id" TEXT,
    "last_message" TEXT,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "text" TEXT,
    "media_url" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_razorpay_customer_id_key" ON "User"("razorpay_customer_id");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "FarmListing_farmer_id_idx" ON "FarmListing"("farmer_id");

-- CreateIndex
CREATE INDEX "FarmListing_status_idx" ON "FarmListing"("status");

-- CreateIndex
CREATE INDEX "FarmListing_is_organic_idx" ON "FarmListing"("is_organic");

-- CreateIndex
CREATE INDEX "Contract_farmer_id_idx" ON "Contract"("farmer_id");

-- CreateIndex
CREATE INDEX "Contract_consumer_id_idx" ON "Contract"("consumer_id");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "FarmUpdate_contract_id_idx" ON "FarmUpdate"("contract_id");

-- CreateIndex
CREATE INDEX "EscrowLedger_contract_id_idx" ON "EscrowLedger"("contract_id");

-- CreateIndex
CREATE INDEX "Delivery_contract_id_idx" ON "Delivery"("contract_id");

-- CreateIndex
CREATE INDEX "Dispute_contract_id_idx" ON "Dispute"("contract_id");

-- CreateIndex
CREATE INDEX "WalletTransaction_user_id_idx" ON "WalletTransaction"("user_id");

-- CreateIndex
CREATE INDEX "Review_contract_id_idx" ON "Review"("contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "Review_contract_id_reviewer_id_key" ON "Review"("contract_id", "reviewer_id");

-- CreateIndex
CREATE INDEX "Notification_user_id_idx" ON "Notification"("user_id");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Conversation_participant_one_id_idx" ON "Conversation"("participant_one_id");

-- CreateIndex
CREATE INDEX "Conversation_participant_two_id_idx" ON "Conversation"("participant_two_id");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_participant_one_id_participant_two_id_key" ON "Conversation"("participant_one_id", "participant_two_id");

-- CreateIndex
CREATE INDEX "Message_conversation_id_idx" ON "Message"("conversation_id");

-- CreateIndex
CREATE INDEX "Message_sender_id_idx" ON "Message"("sender_id");

-- AddForeignKey
ALTER TABLE "FarmListing" ADD CONSTRAINT "FarmListing_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "FarmListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_consumer_id_fkey" FOREIGN KEY ("consumer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmUpdate" ADD CONSTRAINT "FarmUpdate_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmUpdate" ADD CONSTRAINT "FarmUpdate_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowLedger" ADD CONSTRAINT "EscrowLedger_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowLedger" ADD CONSTRAINT "EscrowLedger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_participant_one_id_fkey" FOREIGN KEY ("participant_one_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_participant_two_id_fkey" FOREIGN KEY ("participant_two_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
