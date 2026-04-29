"""
V2 — AI Question Generator
POST /api/v2/ai/generate-questions
"""
from __future__ import annotations

import json
import random
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.settings import settings
from app.db.database import get_async_session
from app.dependencies.auth import get_current_user
from app.models.enums import UserRole
from app.models.user import User

router = APIRouter(prefix="/ai", tags=["v2-ai"])


class GenerateQuestionsRequest(BaseModel):
    topic: str
    subject: str
    difficulty: int = 3          # 1–5
    count: int = 5               # max 10


class MCQOption(BaseModel):
    text: str
    is_correct: bool


class GeneratedQuestion(BaseModel):
    id: str
    question_text: str
    options: list[MCQOption]
    explanation: str
    difficulty: int
    topic: str
    subject: str


class GenerateQuestionsResponse(BaseModel):
    questions: list[GeneratedQuestion]
    source: str   # "ai" | "mock"


# ── Mock question bank (used when OpenAI key is absent) ──────────────────────

_MOCK_BANK: dict[str, list[dict]] = {
    "default": [
        {
            "q": "Which of the following is a vector quantity?",
            "opts": ["Speed", "Mass", "Force", "Temperature"],
            "ans": 2,
            "exp": "Force has both magnitude and direction, making it a vector quantity.",
        },
        {
            "q": "The SI unit of electric charge is:",
            "opts": ["Ampere", "Coulomb", "Volt", "Ohm"],
            "ans": 1,
            "exp": "Electric charge is measured in Coulombs (C).",
        },
        {
            "q": "Photosynthesis primarily occurs in which organelle?",
            "opts": ["Mitochondria", "Nucleus", "Chloroplast", "Ribosome"],
            "ans": 2,
            "exp": "Chloroplasts contain chlorophyll and are the site of photosynthesis.",
        },
        {
            "q": "The pH of pure water at 25°C is:",
            "opts": ["0", "7", "14", "1"],
            "ans": 1,
            "exp": "Pure water is neutral with a pH of 7 at 25°C.",
        },
        {
            "q": "Newton's second law relates force to:",
            "opts": ["Velocity", "Displacement", "Acceleration", "Energy"],
            "ans": 2,
            "exp": "F = ma — force equals mass times acceleration.",
        },
        {
            "q": "Which gas is produced during cellular respiration?",
            "opts": ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
            "ans": 2,
            "exp": "Cellular respiration produces CO₂ as a byproduct.",
        },
        {
            "q": "The powerhouse of the cell is:",
            "opts": ["Nucleus", "Mitochondria", "Golgi apparatus", "Lysosome"],
            "ans": 1,
            "exp": "Mitochondria produce ATP through cellular respiration.",
        },
        {
            "q": "Avogadro's number is approximately:",
            "opts": ["6.022 × 10²³", "3.0 × 10⁸", "9.8 × 10⁰", "1.6 × 10⁻¹⁹"],
            "ans": 0,
            "exp": "One mole of any substance contains 6.022 × 10²³ particles.",
        },
        {
            "q": "Which law states that energy cannot be created or destroyed?",
            "opts": ["Newton's first law", "Ohm's law", "First law of thermodynamics", "Boyle's law"],
            "ans": 2,
            "exp": "The first law of thermodynamics is the law of conservation of energy.",
        },
        {
            "q": "DNA replication is:",
            "opts": ["Conservative", "Semi-conservative", "Dispersive", "Non-conservative"],
            "ans": 1,
            "exp": "Each new DNA molecule retains one original strand — semi-conservative.",
        },
    ]
}


def _mock_questions(topic: str, subject: str, difficulty: int, count: int) -> list[GeneratedQuestion]:
    bank = _MOCK_BANK.get(subject.lower(), _MOCK_BANK["default"])
    sample = random.sample(bank, min(count, len(bank)))
    result = []
    for item in sample:
        opts = [
            MCQOption(text=o, is_correct=(i == item["ans"]))
            for i, o in enumerate(item["opts"])
        ]
        result.append(GeneratedQuestion(
            id=str(uuid.uuid4()),
            question_text=item["q"],
            options=opts,
            explanation=item["exp"],
            difficulty=difficulty,
            topic=topic,
            subject=subject,
        ))
    return result


async def _ai_questions(topic: str, subject: str, difficulty: int, count: int) -> list[GeneratedQuestion]:
    """Call OpenAI if key is set, otherwise fall back to mock."""
    if not settings.OPENAI_API_KEY:
        return _mock_questions(topic, subject, difficulty, count)

    try:
        import openai  # type: ignore
        client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        prompt = (
            f"Generate {count} NEET-style MCQ questions on the topic '{topic}' "
            f"from {subject} at difficulty level {difficulty}/5. "
            "Return JSON array: [{question_text, options:[{text,is_correct}], explanation}]"
        )
        resp = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        raw = json.loads(resp.choices[0].message.content or "{}")
        items = raw.get("questions", raw) if isinstance(raw, dict) else raw
        questions = []
        for item in items[:count]:
            questions.append(GeneratedQuestion(
                id=str(uuid.uuid4()),
                question_text=item.get("question_text", ""),
                options=[MCQOption(**o) for o in item.get("options", [])],
                explanation=item.get("explanation", ""),
                difficulty=difficulty,
                topic=topic,
                subject=subject,
            ))
        return questions
    except Exception:
        return _mock_questions(topic, subject, difficulty, count)


@router.post("/generate-questions", response_model=GenerateQuestionsResponse)
async def generate_questions(
    data: GenerateQuestionsRequest,
    user: User = Depends(get_current_user),
):
    if user.role not in (UserRole.teacher, UserRole.admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher access required")
    if data.count > 10:
        data.count = 10
    questions = await _ai_questions(data.topic, data.subject, data.difficulty, data.count)
    source = "ai" if settings.OPENAI_API_KEY else "mock"
    return GenerateQuestionsResponse(questions=questions, source=source)
