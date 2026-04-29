from __future__ import annotations

import json
from typing import Any, Literal

import httpx
from fastapi import status
from pydantic import BaseModel, Field

from app.core.errors import AppError
from app.core.settings import settings
from app.models.enums import Subject
from app.schemas.ai import AiChatMessage

OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"


class GeneratedQuestion(BaseModel):
  question_text: str = Field(min_length=2, max_length=600)
  options: list[str] = Field(min_length=4, max_length=4)
  correct_answer: int = Field(ge=0, le=3)
  explanation: str = Field(min_length=1, max_length=1200)


class GeneratedQuiz(BaseModel):
  title: str = Field(min_length=2, max_length=220)
  questions: list[GeneratedQuestion] = Field(min_length=3, max_length=10)


class GeneratedSummary(BaseModel):
  summary: str = Field(min_length=10, max_length=2500)
  key_points: list[str] = Field(min_length=3, max_length=6)
  common_mistakes: list[str] = Field(min_length=2, max_length=5)


def _extract_output_text(data: dict[str, Any]) -> str:
  # SDKs expose `output_text`. The raw HTTP response generally contains `output` items.
  if isinstance(data.get("output_text"), str):
    return str(data["output_text"]).strip()

  chunks: list[str] = []
  for item in data.get("output") or []:
    if not isinstance(item, dict):
      continue
    if item.get("type") != "message":
      continue
    content = item.get("content")
    if not isinstance(content, list):
      continue
    for part in content:
      if not isinstance(part, dict):
        continue
      if part.get("type") == "output_text" and isinstance(part.get("text"), str):
        chunks.append(part["text"])
  return "\n".join(chunks).strip()


async def _openai_responses_text(
  *,
  input_messages: list[dict[str, Any]],
  instructions: str,
  response_format: dict[str, Any] | None = None,
) -> tuple[str, str]:
  if not settings.OPENAI_API_KEY:
    raise AppError("OPENAI_API_KEY not configured", status_code=status.HTTP_503_SERVICE_UNAVAILABLE, code="ai_not_configured")

  headers = {
    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
    "Content-Type": "application/json",
  }
  payload: dict[str, Any] = {
    "model": settings.OPENAI_MODEL,
    "instructions": instructions,
    "input": input_messages,
  }
  if response_format:
    payload["text"] = {"format": response_format}

  try:
    async with httpx.AsyncClient(timeout=25) as client:
      resp = await client.post(OPENAI_RESPONSES_URL, headers=headers, json=payload)
  except httpx.TimeoutException as exc:
    raise AppError("AI provider timeout", status_code=status.HTTP_504_GATEWAY_TIMEOUT, code="ai_timeout") from exc
  except httpx.HTTPError as exc:
    raise AppError("AI provider network error", status_code=status.HTTP_502_BAD_GATEWAY, code="ai_network_error") from exc

  if resp.status_code >= 400:
    raise AppError("AI provider error", status_code=status.HTTP_502_BAD_GATEWAY, code="ai_provider_error")

  data = resp.json()
  text = _extract_output_text(data)
  if not text:
    raise AppError("Empty AI response", status_code=status.HTTP_502_BAD_GATEWAY, code="ai_empty")
  return text, settings.OPENAI_MODEL


def _mock_chat_reply(*, messages: list[AiChatMessage], subject: Subject | None) -> str:
  last_user = next((m for m in reversed(messages) if m.role == "user"), None)
  q = (last_user.content if last_user else "").strip()
  subj = subject.value if subject else "NEET"
  return (
    f"Here’s a {subj}-focused way to solve it:\n"
    "1) Identify the exact concept + chapter.\n"
    "2) Write the key formula/definition and units.\n"
    "3) Substitute carefully (check signs + powers of 10).\n"
    "4) Do a quick sanity check (dimensions / limiting cases).\n\n"
    f"If you share the full question (and options), I’ll give the final answer with steps.\n\n"
    f"Your doubt: {q[:280]}"
  )


async def chat_reply(
  *,
  messages: list[AiChatMessage],
  subject: Subject | None,
  context: str | None,
) -> tuple[str, Literal["mock", "openai"], str | None]:
  if settings.OPENAI_API_KEY:
    prompt_messages: list[dict[str, Any]] = []
    for m in messages[-16:]:
      prompt_messages.append({"role": m.role, "content": m.content})

    if context:
      prompt_messages.append(
        {
          "role": "user",
          "content": f"Context (may help):\n{context}",
        }
      )

    subj = subject.value if subject else "NEET"
    instructions = (
      f"You are an expert {subj} tutor for NEET. Answer step-by-step, keep it concise, "
      "and end with a 1-line quick recap. If the question is ambiguous, ask 1 clarification."
    )
    text, model = await _openai_responses_text(input_messages=prompt_messages, instructions=instructions)
    return text, "openai", model

  return _mock_chat_reply(messages=messages, subject=subject), "mock", None


def _mock_summary(*, title: str, subject: Subject | None) -> GeneratedSummary:
  subj = subject.value if subject else "NEET"
  summary = (
    f"This lesson is a rapid, exam-focused explanation of **{title}** for {subj}. "
    "It highlights the core ideas, key formulas/NCERT points, and common traps seen in PYQs."
  )
  key_points = [
    "Start from definitions and units; don’t memorize blindly.",
    "Convert the question into a known pattern (formula / concept).",
    "Use quick checks: dimensions, limiting cases, sign conventions.",
    "Practice 3–5 PYQs immediately after finishing the concept.",
  ]
  common_mistakes = [
    "Unit mismatch (cm ↔ m, minutes ↔ seconds).",
    "Sign errors and incorrect direction assumptions.",
    "Skipping diagram/statement constraints from the question.",
  ]
  return GeneratedSummary(summary=summary, key_points=key_points[:6], common_mistakes=common_mistakes[:5])


async def summarize(
  *,
  title: str,
  description: str | None,
  subject: Subject | None,
) -> tuple[GeneratedSummary, Literal["mock", "openai"], str | None]:
  if settings.OPENAI_API_KEY:
    subj = subject.value if subject else "NEET"
    instructions = (
      f"You generate NEET-friendly study notes. Summarize the topic for {subj} students. "
      "Return JSON only (no markdown)."
    )
    schema = {
      "type": "object",
      "additionalProperties": False,
      "properties": {
        "summary": {"type": "string"},
        "key_points": {"type": "array", "items": {"type": "string"}, "minItems": 3, "maxItems": 6},
        "common_mistakes": {"type": "array", "items": {"type": "string"}, "minItems": 2, "maxItems": 5},
      },
      "required": ["summary", "key_points", "common_mistakes"],
    }
    response_format = {"type": "json_schema", "name": "neet_summary", "schema": schema, "strict": True}
    prompt = f"Title: {title}\n\nDescription: {description or ''}".strip()
    text, model = await _openai_responses_text(
      input_messages=[{"role": "user", "content": prompt}],
      instructions=instructions,
      response_format=response_format,
    )
    try:
      parsed = json.loads(text)
      out = GeneratedSummary.model_validate(parsed)
      return out, "openai", model
    except Exception:
      # fallback to mock if parsing fails
      return _mock_summary(title=title, subject=subject), "mock", None

  return _mock_summary(title=title, subject=subject), "mock", None


def _mock_quiz(*, topic: str, subject: Subject, num_questions: int) -> GeneratedQuiz:
  base_title = f"AI Practice: {topic}"

  def q(text: str, options: list[str], correct: int, expl: str) -> GeneratedQuestion:
    return GeneratedQuestion(question_text=text, options=options, correct_answer=correct, explanation=expl)

  if subject == Subject.biology:
    questions = [
      q(
        f"In {topic}, which statement is MOST accurate (NEET level)?",
        ["It always decreases ATP usage", "It always increases pH", "It depends on the pathway and tissue", "It never involves enzymes"],
        2,
        "Biology processes are context-dependent; focus on tissue + pathway + regulation.",
      ),
      q(
        f"Which option is a common NEET trap in {topic}?",
        ["Ignoring directionality", "Ignoring units", "Ignoring regulation/hormones", "All of the above"],
        3,
        "NEET often tests regulation + context; also watch directionality and units where applicable.",
      ),
      q(
        f"Best way to master {topic} quickly is:",
        ["Only read NCERT once", "Only watch videos", "NCERT + diagrams + PYQs", "Skip diagrams"],
        2,
        "NCERT + diagrams + PYQs builds recall and application.",
      ),
    ]
  elif subject == Subject.chemistry:
    questions = [
      q(
        f"In {topic}, which factor MOST strongly influences reaction direction?",
        ["Temperature", "Catalyst", "Equilibrium constant/ΔG", "Color of solution"],
        2,
        "Direction is governed by thermodynamics (ΔG/K). Catalysts change rate, not equilibrium.",
      ),
      q(
        f"A common mistake in {topic} numericals is:",
        ["Wrong significant figures", "Unit mismatch", "Using wrong constant", "All of the above"],
        3,
        "Most errors are from units/constants and careless substitution.",
      ),
      q(
        f"For NEET, the best revision for {topic} is:",
        ["Only formulas", "Concept + 20 PYQs", "Only theory", "Skip practice"],
        1,
        "Pair concept clarity with PYQs to match NEET patterns.",
      ),
    ]
  else:
    questions = [
      q(
        f"In {topic}, the most reliable first step is:",
        ["Guess the answer", "Draw diagram + list givens", "Directly plug formula", "Ignore units"],
        1,
        "Diagram and givens prevent sign/direction mistakes.",
      ),
      q(
        f"A quick sanity check in {topic} problems is:",
        ["Dimension analysis", "Checking limiting case", "Both A and B", "None"],
        2,
        "Dimensions + limiting cases catch many errors fast.",
      ),
      q(
        f"Common NEET trap in {topic} is:",
        ["Sign convention", "Unit conversion", "Rounding too early", "All of the above"],
        3,
        "All of these are frequent sources of wrong answers.",
      ),
    ]

  # Expand deterministically if requested more than templates.
  while len(questions) < num_questions:
    i = len(questions) + 1
    questions.append(
      q(
        f"{topic}: Which statement is correct (Q{i})?",
        ["Option A", "Option B", "Option C", "Option D"],
        1,
        "Demo explanation: generated placeholder. Replace with OpenAI output when configured.",
      )
    )

  return GeneratedQuiz(title=base_title, questions=questions[:num_questions])


async def generate_quiz(
  *,
  topic: str,
  subject: Subject,
  num_questions: int,
) -> tuple[GeneratedQuiz, Literal["mock", "openai"], str | None]:
  if settings.OPENAI_API_KEY:
    instructions = (
      "You are a NEET question setter. Create a short MCQ quiz. Return JSON only (no markdown). "
      "Each question must have exactly 4 options, a correct_answer index (0-3), and a short explanation."
    )
    schema = {
      "type": "object",
      "additionalProperties": False,
      "properties": {
        "title": {"type": "string"},
        "questions": {
          "type": "array",
          "minItems": num_questions,
          "maxItems": num_questions,
          "items": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
              "question_text": {"type": "string"},
              "options": {"type": "array", "items": {"type": "string"}, "minItems": 4, "maxItems": 4},
              "correct_answer": {"type": "integer", "minimum": 0, "maximum": 3},
              "explanation": {"type": "string"},
            },
            "required": ["question_text", "options", "correct_answer", "explanation"],
          },
        },
      },
      "required": ["title", "questions"],
    }
    response_format = {"type": "json_schema", "name": "neet_quiz", "schema": schema, "strict": True}
    prompt = (
      f"Subject: {subject.value}\n"
      f"Topic: {topic}\n"
      f"Questions: {num_questions}\n"
      "Difficulty: NEET (moderate)."
    )
    text, model = await _openai_responses_text(
      input_messages=[{"role": "user", "content": prompt}],
      instructions=instructions,
      response_format=response_format,
    )
    try:
      parsed = json.loads(text)
      out = GeneratedQuiz.model_validate(parsed)
      return out, "openai", model
    except Exception:
      return _mock_quiz(topic=topic, subject=subject, num_questions=num_questions), "mock", None

  return _mock_quiz(topic=topic, subject=subject, num_questions=num_questions), "mock", None

