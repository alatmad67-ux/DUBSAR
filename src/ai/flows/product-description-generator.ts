/**
 * @fileOverview A Genkit flow for generating detailed product descriptions for motorcycle spare parts.
 * (Mocked for Desktop Version without Server Actions)
 */

import { z } from 'zod';

const ProductDescriptionGeneratorInputSchema = z.object({
  partName: z.string(),
  category: z.string(),
  motorcycleModels: z.string(),
  keywords: z.string().optional(),
});
export type ProductDescriptionGeneratorInput = z.infer<typeof ProductDescriptionGeneratorInputSchema>;

const ProductDescriptionGeneratorOutputSchema = z.object({
  description: z.string(),
});
export type ProductDescriptionGeneratorOutput = z.infer<typeof ProductDescriptionGeneratorOutputSchema>;

export async function generateProductDescription(
  input: ProductDescriptionGeneratorInput
): Promise<ProductDescriptionGeneratorOutput> {
  return {
    description: "توليد الوصف التلقائي غير مدعوم حالياً في نسخة سطح المكتب. يرجى إدخال الوصف يدوياً."
  };
}
