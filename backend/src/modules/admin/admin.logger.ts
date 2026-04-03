import { prisma } from "@/config/database";

/**
 * Utility to log administrative actions for audit trailing.
 */
export const logAdminAction = async (
	adminId: string,
	action: string,
	entityType: string,
	entityId: string,
	details?: Record<string, unknown>,
) => {
	try {
		return await (prisma as any).auditLog.create({
			data: {
				admin_id: adminId,
				action,
				entity_type: entityType,
				entity_id: entityId,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				details: details ? (details as any) : undefined,
			},
		});
	} catch (error) {
		console.error("Failed to create audit log:", error);
		// Don't throw, we don't want to fail the main action if logging fails
	}
};
