/**
 * @fileOverview An AI assistant for workshop technicians to diagnose motorcycle problems.
 * (Mocked for Desktop Version without Server Actions)
 */

import { z } from 'zod';

const WorkshopDiagnosisAssistantInputSchema = z.object({
  symptomsDescription: z.string(),
});
export type WorkshopDiagnosisAssistantInput = z.infer<typeof WorkshopDiagnosisAssistantInputSchema>;

const WorkshopDiagnosisAssistantOutputSchema = z.object({
  diagnoses: z.array(
    z.object({
      diagnosis: z.string(),
      commonCauses: z.array(z.string()),
      troubleshootingSteps: z.array(z.string()),
    })
  ),
});
export type WorkshopDiagnosisAssistantOutput = z.infer<typeof WorkshopDiagnosisAssistantOutputSchema>;

export async function workshopDiagnosisAssistant(
  input: WorkshopDiagnosisAssistantInput
): Promise<WorkshopDiagnosisAssistantOutput> {
  return {
    diagnoses: [
      {
        diagnosis: "ميزة الذكاء الاصطناعي معطلة (Offline Mode)",
        commonCauses: ["تعمل هذه النسخة كنسخة سطح مكتب غير متصلة بخدمات Genkit."],
        troubleshootingSteps: ["يرجى الاعتماد على التشخيص اليدوي أو استخدام النسخة السحابية للوصول إلى ميزات الذكاء الاصطناعي."]
      }
    ]
  };
}
