import type {
  ListeningGenerationMode,
  ListeningQuestionBlockSpec,
  ListeningTranscriptPayload,
} from '@/lib/listening-generator-contracts'
import type { IbTopic, QuestionType } from '@/lib/types'
import { getListeningBlockPlan, getMarkLabel } from '@/lib/listening-structure'

const ICON_NAME_ALLOWLIST = [
  'bus',
  'train',
  'plane',
  'car',
  'bike',
  'sun',
  'cloud',
  'cloud-rain',
  'snowflake',
  'utensils',
  'apple',
  'coffee',
  'book',
  'pencil',
  'music',
  'heart',
  'home',
  'building',
  'tree-pine',
  'globe',
  'users',
  'phone',
  'laptop',
  'camera',
  'clock',
  'map-pin',
  'shopping-bag',
  'shirt',
  'umbrella',
  'thermometer',
] as const

function getScriptWordRange(marks: number): string {
  return marks <= 10 ? '150-180' : '180-250'
}

function getSequentialParagraphInstructions(marks: number): string {
  const blockPlan = getListeningBlockPlan(marks)

  return [
    `- Write exactly ${blockPlan.length} paragraphs separated by a single blank line.`,
    '- The paragraphs must move through the scenario in natural chronological order.',
    ...blockPlan.map(
      (count, index) =>
        `- Paragraph ${index + 1} must contain enough concrete detail to support block ${index + 1} (${count} mark${count === 1 ? '' : 's'}).`
    ),
  ].join('\n')
}

function getTranscriptModeInstructions(marks: number, mode: ListeningGenerationMode): string {
  if (mode === 'sequential') {
    return getSequentialParagraphInstructions(marks)
  }

  return '- Use 1 to 3 short paragraphs separated by blank lines.'
}

function getQuestionTypeInstructions(type: QuestionType): string {
  switch (type) {
    case 'mcq':
      return `Question type: MCQ
- Return exactly one object per question in this shape:
  { "type": "mcq", "text": "...", "options": ["A", "B", "C"], "correctIndex": 0 }
- options must contain 3 or 4 answer choices in Spanish.
- correctIndex must be a 0-based integer that matches the correct option.
- Question text must be in Spanish.`
    case 'true-false-notgiven':
      return `Question type: True / False / Not Given
- Return exactly one object per question in this shape:
  { "type": "true-false-notgiven", "text": "...", "correctAnswer": "true" }
- correctAnswer must be exactly "true", "false", or "not-given".
- Question text must be in Spanish.`
    case 'gap-fill':
      return `Question type: Gap Fill
- Return exactly one object per question in this shape:
  { "type": "gap-fill", "text": "Completa el texto.", "sentence": "Maria vive en una ciudad ___.", "acceptedAnswers": ["grande"] }
- Use the same text value for every item in this block.
- Every sentence must contain exactly one ___ blank.
- acceptedAnswers must be a non-empty list of valid answers in Spanish.
- The sentences in this block must read naturally in order as one continuous passage.
- Question text must be in Spanish.`
    case 'icon-matching':
      return `Question type: Icon Matching
- Return exactly one object per question in this shape:
  { "type": "icon-matching", "text": "...", "icons": [{"name": "bus", "label": "autobús"}, {"name": "train", "label": "tren"}, {"name": "plane", "label": "avión"}], "correctIconName": "bus" }
- icons must contain 3 or 4 options.
- Use ONLY these icon names: ${ICON_NAME_ALLOWLIST.join(', ')}.
- correctIconName must match one of the icons.
- Question text and icon labels must be in Spanish.`
    case 'person-attribution':
      return `Question type: Person Attribution
- Use this only when the script clearly contains two named speakers.
- Return exactly one object per question in this shape:
  { "type": "person-attribution", "text": "...", "personA": "María", "personB": "Carlos", "correctAnswer": "A" }
- correctAnswer must be exactly "A", "B", or "ambos".
- Question text must be in Spanish.`
  }
}

export function generateTranscriptPrompt(
  topic: IbTopic,
  marks: number,
  mode: ListeningGenerationMode
): string {
  const wordRange = getScriptWordRange(marks)
  const [minWords, maxWords] = wordRange.split('-')

  return `Generate a Spanish listening transcript for IB Ab Initio level (A2).

Topic: ${topic}
Mode: ${mode}
Target marks: ${marks}

Requirements:
- Return ONLY valid JSON.
- Write ${wordRange} words total.
- The script must be at least ${minWords} words and no more than ${maxWords} words.
- If your draft is too short, expand it with concrete details from the same scenario instead of summarising.
- Use mostly present tense. Some simple past is acceptable.
- Keep vocabulary clearly within A2 range.
- Make it sound natural and realistic: monologue, announcement, or short dialogue.
- ${mode === 'sequential' ? 'Sequential mode is active.' : 'General mode is active.'}
- ${mode === 'general' ? 'Questions can reference any part of the transcript.' : 'Each later question block will align to one paragraph in order.'}
${getTranscriptModeInstructions(marks, mode)}
- The transcript must be detailed enough to support multiple exam-style question blocks later.

Return this exact JSON shape:
{
  "title": "short descriptive title in Spanish",
  "script": "full transcript in Spanish"
}`
}

export function generateTranscriptRepairPrompt(
  topic: IbTopic,
  marks: number,
  mode: ListeningGenerationMode,
  previousResponse: string,
  validationErrors: string[]
): string {
  const wordRange = getScriptWordRange(marks)
  const [minWords, maxWords] = wordRange.split('-')

  return `Repair an invalid Spanish listening transcript for IB Ab Initio level (A2).

Topic: ${topic}
Mode: ${mode}
Target marks: ${marks}

The previous response failed validation for these reasons:
${validationErrors.map((error) => `- ${error}`).join('\n')}

Critical rules:
- Return ONLY valid JSON.
- Keep the same general topic and scenario unless it is needed to fix validation.
- The script must be between ${minWords} and ${maxWords} words inclusive.
- If the previous script was too short, expand it with specific but simple A2-level details.
- Use mostly present tense. Some simple past is acceptable.
- Keep vocabulary clearly within A2 range.
- ${mode === 'sequential' ? 'Sequential mode is active.' : 'General mode is active.'}
${getTranscriptModeInstructions(marks, mode)}

Previous invalid response:
${previousResponse}

Return this exact JSON shape:
{
  "title": "short descriptive title in Spanish",
  "script": "full transcript in Spanish"
}`
}

interface GenerateQuestionBlockPromptArgs {
  topic: IbTopic
  marks: number
  mode: ListeningGenerationMode
  transcript: ListeningTranscriptPayload
  blockSpec: ListeningQuestionBlockSpec
}

export function generateQuestionBlockPrompt({
  topic,
  marks,
  mode,
  transcript,
  blockSpec,
}: GenerateQuestionBlockPromptArgs): string {
  const paragraphInstructions =
    mode === 'sequential'
      ? `Sequential rules:
- Use ONLY paragraph ${blockSpec.sourceParagraph} for evidence.
- Do not write questions that depend on any other paragraph.
- Set "sourceParagraph" to exactly ${blockSpec.sourceParagraph}.`
      : `General rules:
- Questions may reference any part of the transcript.
- Use the transcript section below as a helpful anchor, but not as a hard limit.`

  const sourceParagraph = blockSpec.sourceText
    ? `Transcript section for this block:
${blockSpec.sourceText}`
    : ''

  const responseShape =
    mode === 'sequential'
      ? `{
  "sourceParagraph": ${blockSpec.sourceParagraph},
  "questions": [ ... ]
}`
      : `{
  "questions": [ ... ]
}`

  return `Generate one question block for a Spanish listening exercise.

Topic: ${topic}
Mode: ${mode}
Total marks for full exercise: ${marks}
Block number: ${blockSpec.blockIndex + 1}
Required question type: ${blockSpec.type}
Required question count: ${blockSpec.count}

Transcript title:
${transcript.title}

Transcript:
${transcript.script}

${sourceParagraph}

Rules:
- Return ONLY valid JSON.
- Return exactly ${blockSpec.count} questions.
- Every question in this block must use the type "${blockSpec.type}".
- Questions must be answerable from the transcript.
- ${mode === 'sequential' ? 'This block must stay aligned to its assigned paragraph.' : 'General mode allows transcript-wide coverage.'}
- Keep the wording exam-like and concise.
- Do not include ids.
- Do not include marks.
- Do not include explanations.
- Do not return questions of any other type.

${paragraphInstructions}

${getQuestionTypeInstructions(blockSpec.type)}

Return this exact JSON shape:
${responseShape}`
}

interface GenerateQuestionBlockRepairPromptArgs extends GenerateQuestionBlockPromptArgs {
  previousResponse: string
  validationErrors: string[]
}

export function generateQuestionBlockRepairPrompt({
  topic,
  marks,
  mode,
  transcript,
  blockSpec,
  previousResponse,
  validationErrors,
}: GenerateQuestionBlockRepairPromptArgs): string {
  const paragraphInstructions =
    mode === 'sequential'
      ? `Sequential rules:
- Use ONLY paragraph ${blockSpec.sourceParagraph} for evidence.
- Do not write questions that depend on any other paragraph.
- Set "sourceParagraph" to exactly ${blockSpec.sourceParagraph}.`
      : `General rules:
- Questions may reference any part of the transcript.
- Use the transcript section below as a helpful anchor, but not as a hard limit.`

  const responseShape =
    mode === 'sequential'
      ? `{
  "sourceParagraph": ${blockSpec.sourceParagraph},
  "questions": [ ... ]
}`
      : `{
  "questions": [ ... ]
}`

  return `Repair an invalid listening question block for IB Ab Initio Spanish.

Topic: ${topic}
Mode: ${mode}
Total marks for full exercise: ${marks}
Block number: ${blockSpec.blockIndex + 1}
Required question type: ${blockSpec.type}
Required question count: ${blockSpec.count}

Transcript title:
${transcript.title}

Transcript:
${transcript.script}

The previous response failed validation for these reasons:
${validationErrors.map((error) => `- ${error}`).join('\n')}

Critical rules:
- Return ONLY valid JSON.
- Return exactly ${blockSpec.count} questions.
- Every question must have type "${blockSpec.type}".
- Do not include ids.
- Do not include marks.
- Do not include explanations.
- Fix only what is needed to satisfy the validator while keeping the questions aligned to the transcript.

${paragraphInstructions}

${blockSpec.sourceText ? `Transcript section for this block:\n${blockSpec.sourceText}\n` : ''}${getQuestionTypeInstructions(blockSpec.type)}

Previous invalid response:
${previousResponse}

Return this exact JSON shape:
${responseShape}`
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

export function verifySequentialQuestionBlockPrompt(args: {
  transcript: string
  paragraphNumber: number
  paragraphText: string
  questions: Array<{ type: QuestionType; text: string; sentence?: string; options?: string[] }>
}): string {
  const questionsText = args.questions
    .map((question, index) => {
      const lines = [
        `Question ${index + 1}:`,
        `- type: ${question.type}`,
        `- text: ${question.text}`,
      ]

      if (question.sentence) {
        lines.push(`- sentence: ${question.sentence}`)
      }

      if (question.options && question.options.length > 0) {
        lines.push(`- options: ${question.options.join(' | ')}`)
      }

      return lines.join('\n')
    })
    .join('\n\n')

  return `You are verifying paragraph alignment for a sequential Spanish listening exercise.

Task:
- Decide whether every question below can be answered using ONLY the assigned paragraph.
- If any question requires evidence from another paragraph or from the transcript as a whole, mark the block invalid.
- Be strict about paragraph alignment, but do not reject a question just because the wording paraphrases the paragraph.

Full transcript:
${args.transcript}

Assigned paragraph number: ${args.paragraphNumber}

Assigned paragraph text:
${args.paragraphText}

Questions:
${questionsText}

Respond with ONLY valid JSON:
{
  "valid": true,
  "issues": []
}`
}
