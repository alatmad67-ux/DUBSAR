'use server';
/**
 * @fileOverview A Genkit flow for generating detailed product descriptions for motorcycle spare parts.
 *
 * - generateProductDescription - A function that generates a product description based on product details.
 * - ProductDescriptionGeneratorInput - The input type for the generateProductDescription function.
 * - ProductDescriptionGeneratorOutput - The return type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductDescriptionGeneratorInputSchema = z.object({
  partName: z.string().describe('The name of the product part, e.g., "فلتر زيت المحرك".'),
  category: z.string().describe('The category of the product, e.g., "محركات وقطع غيار".'),
  motorcycleModels: z
    .string()
    .describe('A comma-separated list of motorcycle models and years the part is compatible with, e.g., "Honda CBR600RR (2007-2023), Yamaha R6 (2006-2023)".'),
  keywords: z
    .string()
    .optional()
    .describe('Optional keywords to include in the description, e.g., "أداء عالي، حماية، أصلي".'),
});
export type ProductDescriptionGeneratorInput = z.infer<typeof ProductDescriptionGeneratorInputSchema>;

const ProductDescriptionGeneratorOutputSchema = z.object({
  description: z.string().describe('A detailed and compelling product description in Arabic.'),
});
export type ProductDescriptionGeneratorOutput = z.infer<typeof ProductDescriptionGeneratorOutputSchema>;

export async function generateProductDescription(
  input: ProductDescriptionGeneratorInput
): Promise<ProductDescriptionGeneratorOutput> {
  return productDescriptionGeneratorFlow(input);
}

const productDescriptionPrompt = ai.definePrompt({
  name: 'productDescriptionPrompt',
  input: {schema: ProductDescriptionGeneratorInputSchema},
  output: {schema: ProductDescriptionGeneratorOutputSchema},
  prompt: `أنت خبير تسويق وكاتب إعلانات متخصص في قطع غيار الدراجات النارية في متجر "مجمع محمد علاء".

مهمتك هي كتابة وصف منتج مفصل وجذاب باللغة العربية بناءً على المعلومات المقدمة.
يجب أن يكون الوصف مقنعاً ويسلط الضوء على الفوائد والميزات الرئيسية للمنتج.
اجعل الوصف احترافيًا ومناسبًا لمتجر إلكتروني.

اسم المنتج: {{{partName}}}
الفئة: {{{category}}}
متوافق مع موديلات الدراجات النارية: {{{motorcycleModels}}}
{{#if keywords}}كلمات مفتاحية إضافية: {{{keywords}}}{{/if}}

الآن، قم بإنشاء وصف المنتج:
`,
});

const productDescriptionGeneratorFlow = ai.defineFlow(
  {
    name: 'productDescriptionGeneratorFlow',
    inputSchema: ProductDescriptionGeneratorInputSchema,
    outputSchema: ProductDescriptionGeneratorOutputSchema,
  },
  async input => {
    const {output} = await productDescriptionPrompt(input);
    return output!;
  }
);
