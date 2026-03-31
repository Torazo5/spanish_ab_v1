import type { IbTopic } from '@/lib/types'

export function generateScriptPrompt(topic: IbTopic, marks: number = 10): string {
  return `Generate a Spanish listening exercise for IB Ab Initio level (A2).

Topic: ${topic}
Total marks: ${marks}

Requirements for the script:
- ${marks <= 10 ? '150-180' : '180-250'} words total
- Primarily present tense (hay, es, tiene, vive, etc.), some past tense (preterite) is fine
- Vocabulary appropriate for A2 learners — no advanced idioms
- A realistic scenario: a monologue, short dialogue, or announcement
- Natural but clear speech patterns
- If the script involves two named people, use them for person-attribution questions

Requirements for the questions:
- Questions must use a MIX of types. The marks of all questions must sum to exactly ${marks}.
- MANDATORY: Include at least 1 "mcq" question AND at least 1 "true-false-notgiven" question AND at least 1 question of type "gap-fill", "icon-matching", or "person-attribution".
- Each question is worth 1 or 2 marks. 1-mark questions are simpler (literal recall). 2-mark questions require inference or more complex answers.
- Question text must be in Spanish.

The 5 question types and their JSON shapes:

1. MCQ (multiple choice):
{ "type": "mcq", "id": "q1", "text": "...", "marks": 1, "options": ["A", "B", "C"], "correctIndex": 0 }
- options: 3 or 4 answer choices in Spanish
- correctIndex: 0-based index of the correct option

2. True / False / Not Given:
{ "type": "true-false-notgiven", "id": "q2", "text": "...", "marks": 1, "correctAnswer": "true" }
- correctAnswer: one of "true", "false", or "not-given"

3. Gap Fill (fill in the blank):
{ "type": "gap-fill", "id": "q3", "text": "María vive en una ciudad muy ___.", "marks": 1, "acceptedAnswers": ["grande", "bonita"] }
- text: a sentence from or about the script with ___ for the blank
- acceptedAnswers: list of acceptable answers (include common synonyms)

4. Icon Matching (match concept to icon):
{ "type": "icon-matching", "id": "q4", "text": "...", "marks": 1, "icons": [{"name": "bus", "label": "autobús"}, {"name": "train", "label": "tren"}, {"name": "plane", "label": "avión"}], "correctIconName": "bus" }
- icons: 3-4 options, each with a Lucide icon name and Spanish label
- Use ONLY these Lucide icon names: bus, train, plane, car, bike, sun, cloud, cloud-rain, snowflake, utensils, apple, coffee, book, pencil, music, heart, home, building, tree, globe, users, phone, laptop, camera, clock, map-pin, shopping-bag, shirt, umbrella, thermometer
- correctIconName: the icon name that answers the question

5. Person Attribution (who said/did it?):
{ "type": "person-attribution", "id": "q5", "text": "...", "marks": 1, "personA": "María", "personB": "Carlos", "correctAnswer": "A" }
- Only use this type if the script has two named people
- correctAnswer: "A", "B", or "ambos"

Respond with ONLY valid JSON in this exact format, no other text:
{
  "script": "...",
  "title": "short descriptive title in Spanish",
  "totalMarks": ${marks},
  "questions": [ ... ]
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
