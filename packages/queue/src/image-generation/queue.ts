/**
 * Image Generation Queue - Infrastructure
 *
 * Pure factory for creating queue instances.
 * Callers are responsible for lifecycle (close on shutdown).
 */

import type { Queue } from "bullmq";

import type { RecipeEnrichmentJobData } from "@norish/queue/contracts/job-types";
import { getBullClient } from "@norish/queue/redis/bullmq";

import type { QueueRemovalOptions } from "../config";
import { imageGenerationJobOptions, QUEUE_NAMES } from "../config";
import { createOperationAwareQueue } from "../operation-aware-queue";

/**
 * Create an Image Generation queue instance.
 * One queue instance per process is expected.
 */
export function createImageGenerationQueue(
  removalOptions?: QueueRemovalOptions
): Queue<RecipeEnrichmentJobData> {
  return createOperationAwareQueue<RecipeEnrichmentJobData>(QUEUE_NAMES.IMAGE_GENERATION, {
    connection: getBullClient(),
    defaultJobOptions: { ...imageGenerationJobOptions, ...removalOptions },
  });
}
