/**
 * @fileOverview An AI agent for checking motorcycle part compatibility.
 * (Mocked for Desktop Version without Server Actions)
 */

import { z } from 'zod';

const CheckPartCompatibilityInputSchema = z.object({
  motorcycleMake: z.string(),
  motorcycleModel: z.string(),
  motorcycleYear: z.number(),
  partIdentifier: z.string(),
});
export type CheckPartCompatibilityInput = z.infer<typeof CheckPartCompatibilityInputSchema>;

const CheckPartCompatibilityOutputSchema = z.object({
  isCompatible: z.boolean(),
  compatibilityMessage: z.string(),
});
export type CheckPartCompatibilityOutput = z.infer<typeof CheckPartCompatibilityOutputSchema>;

export async function checkPartCompatibility(input: CheckPartCompatibilityInput): Promise<CheckPartCompatibilityOutput> {
  // Mock response for Desktop to prevent Server Action errors
  return {
    isCompatible: true,
    compatibilityMessage: "فحص التوافق بالذكاء الاصطناعي غير مدعوم حالياً في نسخة سطح المكتب (Offline Mode)."
  };
}
