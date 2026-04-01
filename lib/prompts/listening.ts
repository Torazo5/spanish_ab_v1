import type { IbTopic } from '@/lib/types'
import { getListeningBlockPlan, getMarkLabel } from '@/lib/listening-structure'

function formatBlockPlan(marks: number): string {
  return getListeningBlockPlan(marks)
    .map((count, index) => `- Block ${index + 1}: ${count} consecutive mark${count === 1 ? '' : 's'} of one question type`)
    .join('\n')
}

export function generateScriptPrompt(topic: IbTopic, marks: number = 10): string {
  const blockPlan = getListeningBlockPlan(marks)

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
- Do NOT shuffle question types randomly.
- Build the exercise as exactly ${blockPlan.length} contiguous mark blocks in this order:
${formatBlockPlan(marks)}
- Each block must use exactly one question type, and each block must use a different question type.
- The questions array order must follow those blocks exactly. Do not alternate or interleave types.
- The marks of all entries must sum to exactly ${marks}.
- You must generate exactly ${marks} 1-mark entries in total.
- Every question must be worth exactly 1 mark. Do not create any 2-mark questions.
- For ${marks} marks, do not stop early. Keep adding 1-mark entries until there are exactly ${marks} entries and the question marks sum to exactly ${marks}.
- Question text must be in Spanish.
- Make the grouped blocks feel exam-like. Reuse the same format consistently within each block.
- If you use "person-attribution", keep all of those marks together in one block.

The 5 question types and their JSON shapes:

1. MCQ (multiple choice):
{ "type": "mcq", "id": "q1", "text": "...", "marks": 1, "options": ["A", "B", "C"], "correctIndex": 0 }
- options: 3 or 4 answer choices in Spanish
- correctIndex: 0-based index of the correct option

2. True / False / Not Given:
{ "type": "true-false-notgiven", "id": "q2", "text": "...", "marks": 1, "correctAnswer": "true" }
- correctAnswer: one of "true", "false", or "not-given"

3. Gap Fill (fill in the blank):
{ "type": "gap-fill", "id": "q3", "text": "Fill in the missing word", "sentence": "Maria vive en una ciudad muy ___.", "marks": 1, "acceptedAnswers": ["grande", "bonita"] }
- text: question prompt or instruction
- sentence: the sentence from the script with ___ marking the blank
- acceptedAnswers: list of acceptable answers (include common synonyms)
- If a whole block uses gap-fill, make it feel like one longer passage with multiple blanks, not isolated mini questions.
- Each gap-fill entry should still have its own sentence field, but the sentences in that block must appear in order and read naturally as one continuous text when shown together.
- Use the same instruction text for every gap-fill entry in the same block.

4. Icon Matching (match concept to icon):
{ "type": "icon-matching", "id": "q4", "text": "...", "marks": 1, "icons": [{"name": "bus", "label": "autobús"}, {"name": "train", "label": "tren"}, {"name": "plane", "label": "avión"}], "correctIconName": "bus" }
- icons: 3-4 options, each with a Lucide icon name and Spanish label
- Use ONLY these Lucide icon names: bus, train, plane, car, bike, sun, cloud, cloud-rain, snowflake, utensils, apple, coffee, book, pencil, music, heart, home, building, tree-pine, globe, users, phone, laptop, camera, clock, map-pin, shopping-bag, shirt, umbrella, thermometer
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

export function generateScriptRepairPrompt(
  topic: IbTopic,
  marks: number,
  previousResponse: string,
  validationErrors: string[]
): string {
  return `You previously generated an invalid Spanish listening exercise for IB Ab Initio level (A2).

Topic: ${topic}
Required total marks: ${marks}

The previous response failed validation for these reasons:
${validationErrors.map((error) => `- ${error}`).join('\n')}

Repair the exercise and return a complete corrected JSON object.

Critical rules:
- Return ONLY valid JSON.
- The sum of all question marks must be exactly ${marks}.
- There must be exactly ${marks} 1-mark entries.
- Every question must have marks of exactly 1.
- Do NOT mix question types randomly.
- Use exactly ${getListeningBlockPlan(marks).length} contiguous mark blocks in this order:
${formatBlockPlan(marks)}
- Each block must contain only one question type.
- Each block must use a different question type.
- The questions array must already be ordered by block. Do not interleave types.
- If a block uses gap-fill, repair it so the consecutive gap-fill sentences form one longer passage with multiple blanks.
- Keep the script and questions at IB Ab Initio (A2) level.
- Question text must be in Spanish.

Previous invalid response:
${previousResponse}

Return the corrected JSON in this exact shape:
{
  "script": "...",
  "title": "short descriptive title in Spanish",
  "totalMarks": ${marks},
  "questions": [ ... ]
}`
}

export function checkAnswersPrompt(
  script: string,
  questions: { id: string; text: string; marks: number; markNumber: number; sentence?: string }[],
  answers: Record<string, string>
): string {
  const qa = questions
    .map((q) => {
      const prompt = q.sentence ? `${q.text}\n  Sentence: ${q.sentence}` : q.text
      return `${getMarkLabel(q.markNumber)} (${q.marks} mark${q.marks !== 1 ? 's' : ''}): ${prompt}\nAnswer: ${answers[q.id] || '(no answer)'}`
    })
    .join('\n\n')

  return `You are grading gap-fill answers to a Spanish listening comprehension exercise.

Script:
${script}

Marks and student answers:
${qa}

Grade each answer. Be generous — accept answers that show understanding even if phrasing is imperfect. Full marks for correct answers in English or Spanish.

For each mark, return marks awarded (0 to the mark's value).

Respond with ONLY valid JSON, no other text:
{
  "results": [
    {
      "questionId": "q1",
      "correct": true,
      "marks": 1,
      "feedback": "brief feedback in English"
    }
  ],
  "encouragement": "one encouraging sentence"
}`
}
