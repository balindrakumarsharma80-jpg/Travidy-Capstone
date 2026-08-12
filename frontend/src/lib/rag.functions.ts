import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  question: z.string().min(1).max(500),
  destination: z.string().max(80).nullable().optional(),
});

export const askTravidy = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { answerTravelQuestion } = await import("./rag.server");
    return answerTravelQuestion(data.question, data.destination ?? null);
  });
