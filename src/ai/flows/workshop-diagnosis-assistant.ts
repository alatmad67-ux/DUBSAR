'use server';
/**
 * @fileOverview An AI assistant for workshop technicians to diagnose motorcycle problems.
 *
 * - workshopDiagnosisAssistant - A function that provides potential diagnoses, causes, and troubleshooting steps for motorcycle symptoms.
 * - WorkshopDiagnosisAssistantInput - The input type for the workshopDiagnosisAssistant function.
 * - WorkshopDiagnosisAssistantOutput - The return type for the workshopDiagnosisAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WorkshopDiagnosisAssistantInputSchema = z.object({
  symptomsDescription: z
    .string()
    .describe(
      'A natural language description of the motorcycle\'s observed symptoms or reported issues.'
    ),
});
export type WorkshopDiagnosisAssistantInput = z.infer<
  typeof WorkshopDiagnosisAssistantInputSchema
>;

const WorkshopDiagnosisAssistantOutputSchema = z.object({
  diagnoses: z.array(
    z.object({
      diagnosis: z
        .string()
        .describe('A potential diagnosis for the observed symptoms.'),
      commonCauses: z
        .array(z.string())
        .describe('A list of common causes associated with this diagnosis.'),
      troubleshootingSteps: z
        .array(z.string())
        .describe('Step-by-step troubleshooting recommendations for this diagnosis.'),
    })
  ),
});
export type WorkshopDiagnosisAssistantOutput = z.infer<
  typeof WorkshopDiagnosisAssistantOutputSchema
>;

export async function workshopDiagnosisAssistant(
  input: WorkshopDiagnosisAssistantInput
): Promise<WorkshopDiagnosisAssistantOutput> {
  return workshopDiagnosisAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'workshopDiagnosisAssistantPrompt',
  input: {schema: WorkshopDiagnosisAssistantInputSchema},
  output: {schema: WorkshopDiagnosisAssistantOutputSchema},
  prompt: `You are an expert motorcycle mechanic. Based on the provided symptoms, suggest potential diagnoses, their common causes, and detailed troubleshooting steps.

Symptoms: {{{symptomsDescription}}}

Provide the output in a structured JSON format as described by the output schema.`,
});

const workshopDiagnosisAssistantFlow = ai.defineFlow(
  {
    name: 'workshopDiagnosisAssistantFlow',
    inputSchema: WorkshopDiagnosisAssistantInputSchema,
    outputSchema: WorkshopDiagnosisAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
