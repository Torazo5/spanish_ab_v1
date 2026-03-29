import type { IbTopic } from '@/lib/types'

export function generateScriptPrompt(topic: IbTopic): string {
  return `Generate a Spanish listening exercise for IB Ab Initio level (A2).

Topic: ${topic}

Requirements:
- 150-180 words total
- Primarily present tense (hay, es, tiene, vive, etc.), some past tense (preterite) is fine
- Vocabulary appropriate for A2 learners — no advanced idioms
- A realistic scenario: a monologue or short dialogue
- Natural but clear speech patterns (not a word list)

Then generate exactly 5 comprehension questions in Spanish, ranging from:
- Questions 1-3: literal recall (the answer is stated directly in the text)
- Questions 4-5: simple inference (requires thinking about the text)

Respond with ONLY valid JSON in this exact format, no other text:
{
  "script": "...",
  "title": "short descriptive title in Spanish",
  "questions": [
    { "id": "q1", "text": "..." },
    { "id": "q2", "text": "..." },
    { "id": "q3", "text": "..." },
    { "id": "q4", "text": "..." },
    { "id": "q5", "text": "..." }
  ]
}`
}

export function checkAnswersPrompt(
  script: string,
  questions: { id: string; text: string }[],
  answers: string[]
): string {
  const qa = questions
    .map((q, i) => `Q${i + 1}: ${q.text}\nAnswer: ${answers[i] || '(no answer)'}`)
    .join('\n\n')

  return `You are grading answers to a Spanish listening comprehension exercise.

Script:
${script}

Questions and student answers:
${qa}

Grade each answer. Be generous — accept answers that show understanding even if phrasing is imperfect. Full marks for correct answers in English or Spanish.

Respond with ONLY valid JSON, no other text:
{
  "results": [
    {
      "questionId": "q1",
      "correct": true,
      "feedback": "brief feedback in English"
    }
  ],
  "totalScore": 4,
  "maxScore": 5,
  "encouragement": "one encouraging sentence"
}`
}
