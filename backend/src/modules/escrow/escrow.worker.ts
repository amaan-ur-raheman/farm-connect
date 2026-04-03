import { Worker, Job } from "bullmq";
import { redisConnection } from "@/config/queue";
import { processEscrowRelease } from "./escrow.service";

interface EscrowJobData {
	contractId: string;
	farmerId: string;
	amount: number;
}

const escrowWorker = new Worker<EscrowJobData>(
	"escrow-release",
	async (job: Job<EscrowJobData>) => {
		const { contractId, farmerId, amount } = job.data;
		await processEscrowRelease(contractId, farmerId, amount);
	},
	{ connection: redisConnection },
);

escrowWorker.on("completed", (job) => {
	console.log(`[EscrowWorker] Job ${job.id} completed successfully`);
});

escrowWorker.on("failed", (job, err) => {
	console.error(`[EscrowWorker] Job ${job?.id} failed: ${err.message}`);
});

console.log("[EscrowWorker] Escrow release worker started");

export default escrowWorker;
