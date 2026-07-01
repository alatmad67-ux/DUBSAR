'use server';
/**
 * @fileOverview An AI agent for checking motorcycle part compatibility.
 *
 * - checkPartCompatibility - A function that handles the part compatibility check process.
 * - CheckPartCompatibilityInput - The input type for the checkPartCompatibility function.
 * - CheckPartCompatibilityOutput - The return type for the checkPartCompatibility function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckPartCompatibilityInputSchema = z.object({
  motorcycleMake: z.string().describe('The make of the motorcycle (e.g., Honda, Yamaha).'),
  motorcycleModel: z.string().describe('The model of the motorcycle (e.g., CBR1000RR, YZF-R1).'),
  motorcycleYear: z.number().describe('The manufacturing year of the motorcycle.'),
  partIdentifier: z
    .string()
    .describe('The part number or a descriptive type of the part (e.g., "Oil Filter", "Part# 12345-KPP-900").'),
});
export type CheckPartCompatibilityInput = z.infer<typeof CheckPartCompatibilityInputSchema>;

const CheckPartCompatibilityOutputSchema = z.object({
  isCompatible: z.boolean().describe('True if the part is compatible with the motorcycle, false otherwise.'),
  compatibilityMessage: z
    .string()
    .describe("A detailed message explaining the compatibility assessment, including reasons for compatibility or incompatibility, or suggestions if clarification is needed."),
});
export type CheckPartCompatibilityOutput = z.infer<typeof CheckPartCompatibilityOutputSchema>;

export async function checkPartCompatibility(input: CheckPartCompatibilityInput): Promise<CheckPartCompatibilityOutput> {
  return checkPartCompatibilityFlow(input);
}

const compatibilityPrompt = ai.definePrompt({
  name: 'checkPartCompatibilityPrompt',
  input: {schema: CheckPartCompatibilityInputSchema},
  output: {schema: CheckPartCompatibilityOutputSchema},
  prompt: `You are an expert in motorcycle parts compatibility. Your task is to determine if a given part is compatible with a specific motorcycle and provide a clear, concise explanation.

Motorcycle Details:
- Make: {{{motorcycleMake}}}
- Model: {{{motorcycleModel}}}
- Year: {{{motorcycleYear}}}

Part Details:
- Identifier (Number/Type): {{{partIdentifier}}}

Based on the information provided, please assess the compatibility. Your output must be a JSON object with two fields: 'isCompatible' (boolean) and 'compatibilityMessage' (string).

If the part is compatible, set 'isCompatible' to true and explain why. If it's not compatible, set 'isCompatible' to false and explain why, offering alternative suggestions if possible. If you need more information to make a definitive assessment, state what information is missing and suggest next steps.

Examples:
Input: Motorcycle Make: Honda, Model: CB500F, Year: 2018, Part Identifier: Oil Filter
Output: { "isCompatible": true, "compatibilityMessage": "The oil filter for a 2018 Honda CB500F is generally standard. Ensure you purchase a filter specified for this model year. Compatible options include Hiflofiltro HF204." }

Input: Motorcycle Make: Yamaha, Model: MT-07, Year: 2020, Part Identifier: Front Brake Lever for 2015 MT-07
Output: { "isCompatible": false, "compatibilityMessage": "A front brake lever designed for a 2015 Yamaha MT-07 may not be compatible with a 2020 model due to potential design changes in later years. Always cross-reference with the specific part number for your 2020 MT-07 model." }

Input: Motorcycle Make: Harley-Davidson, Model: Sportster Iron 883, Year: 2021, Part Identifier: Custom Exhaust System
Output: { "isCompatible": true, "compatibilityMessage": "Many aftermarket custom exhaust systems are designed to fit the 2021 Harley-Davidson Sportster Iron 883. Verify the manufacturer's specifications to confirm fitment for your exact model and year. Brands like Vance & Hines, Bassani, and Rinehart Racing offer compatible options." }

Input: Motorcycle Make: KTM, Model: 390 Duke, Year: 2022, Part Identifier: Spark Plug
Output: { "isCompatible": true, "compatibilityMessage": "The spark plug for a 2022 KTM 390 Duke is a standard maintenance item. Ensure you select a spark plug with the correct heat range and thread size as specified in the owner's manual or by KTM, such as an NGK LMAR8A-9." }

Input: Motorcycle Make: Kawasaki, Model: Ninja 400, Year: 2023, Part Identifier: Headlight Bulb
Output: { "isCompatible": true, "compatibilityMessage": "The headlight bulb for a 2023 Kawasaki Ninja 400 is typically an H7 type. Confirm with your owner's manual or by inspecting the existing bulb to ensure proper replacement." }

Input: Motorcycle Make: Suzuki, Model: GSX-R600, Year: 2019, Part Identifier: Rear Tire
Output: { "isCompatible": true, "compatibilityMessage": "A rear tire for a 2019 Suzuki GSX-R600 needs to match the correct size and speed rating, typically 180/55ZR17. Many manufacturers offer compatible sport bike tires such as Michelin Power 5, Pirelli Diablo Rosso III, or Bridgestone Battlax Hypersport S22." }

Input: Motorcycle Make: Ducati, Model: Panigale V4, Year: 2020, Part Identifier: Brake Pads
Output: { "isCompatible": true, "compatibilityMessage": "Brake pads for a 2020 Ducati Panigale V4 require high-performance compounds. Ensure you purchase pads specifically designed for this model, such as Brembo Z04 or EBC GPFAX, and check for fitment with your specific caliper type (e.g., Stylema)." }
`,
});

const checkPartCompatibilityFlow = ai.defineFlow(
  {
    name: 'checkPartCompatibilityFlow',
    inputSchema: CheckPartCompatibilityInputSchema,
    outputSchema: CheckPartCompatibilityOutputSchema,
  },
  async input => {
    const {output} = await compatibilityPrompt(input);
    return output!;
  }
);
