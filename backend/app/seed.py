from __future__ import annotations

import asyncio
import random
import uuid

from sqlalchemy import func, select

from app.core.security import get_password_hash
from app.core.settings import settings
from app.db.database import AsyncSessionLocal
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.enums import Subject, UserRole
from app.models.lesson import Lesson
from app.models.progress import Progress
from app.models.question import Question
from app.models.quiz import Quiz
from app.models.quiz_result import QuizResult
from app.models.student_performance import StudentPerformance
from app.models.teacher_subject import TeacherSubject
from app.models.user import User


TARGET_QUESTIONS_PER_QUIZ = 10


def _question_bank() -> dict[Subject, list[dict]]:
  return {
    Subject.physics: [
      {
        "question_text": "The SI unit of power is:",
        "options": ["Watt", "Joule", "Newton", "Pascal"],
        "correct_answer": 0,
        "explanation": "Power is the rate of doing work; its SI unit is watt (W).",
      },
      {
        "question_text": "The slope of a velocity-time graph gives:",
        "options": ["Displacement", "Acceleration", "Speed", "Momentum"],
        "correct_answer": 1,
        "explanation": "Slope = dv/dt, which is acceleration.",
      },
      {
        "question_text": "For an object in free fall near Earth's surface, the acceleration is approximately:",
        "options": ["9.8 m/s² downward", "0 m/s²", "9.8 m/s² upward", "Depends on mass"],
        "correct_answer": 0,
        "explanation": "In free fall, acceleration due to gravity is ~9.8 m/s² downward (ignoring air resistance).",
      },
      {
        "question_text": "Momentum of a body is defined as:",
        "options": ["m + v", "m/v", "m × v", "v/m"],
        "correct_answer": 2,
        "explanation": "Linear momentum p = m v.",
      },
      {
        "question_text": "If net external force on a body is zero, it will:",
        "options": ["Always stop", "Move with constant velocity", "Accelerate", "Move in a circle"],
        "correct_answer": 1,
        "explanation": "Newton's first law: zero net force implies constant velocity (or rest).",
      },
      {
        "question_text": "The SI unit of electric charge is:",
        "options": ["Ampere", "Coulomb", "Volt", "Ohm"],
        "correct_answer": 1,
        "explanation": "Charge is measured in coulombs (C).",
      },
      {
        "question_text": "The force between two point charges is given by:",
        "options": ["Ohm's law", "Coulomb's law", "Kirchhoff's law", "Gauss's law"],
        "correct_answer": 1,
        "explanation": "Coulomb's law gives the electrostatic force between point charges.",
      },
      {
        "question_text": "In uniform circular motion, which quantity remains constant?",
        "options": ["Speed", "Velocity", "Acceleration", "Displacement"],
        "correct_answer": 0,
        "explanation": "Speed remains constant while velocity direction changes continuously.",
      },
      {
        "question_text": "Work done is maximum when the angle between force and displacement is:",
        "options": ["0°", "90°", "180°", "45°"],
        "correct_answer": 0,
        "explanation": "Work W = F s cosθ is maximum when cosθ = 1 (θ = 0°).",
      },
      {
        "question_text": "The SI unit of pressure is:",
        "options": ["Watt", "Pascal", "Joule", "Tesla"],
        "correct_answer": 1,
        "explanation": "Pressure is measured in pascals (Pa).",
      },
      {
        "question_text": "A convex lens is also known as a:",
        "options": ["Converging lens", "Diverging lens", "Cylindrical lens", "Plane mirror"],
        "correct_answer": 0,
        "explanation": "A convex lens converges parallel rays to its focal point.",
      },
      {
        "question_text": "Which of the following is a vector quantity?",
        "options": ["Speed", "Mass", "Temperature", "Force"],
        "correct_answer": 3,
        "explanation": "Force has both magnitude and direction, so it is a vector.",
      },
    ],
    Subject.chemistry: [
      {
        "question_text": "The value of Avogadro's number is approximately:",
        "options": ["6.022 × 10²³", "3.00 × 10⁸", "9.8", "1.6 × 10⁻¹⁹"],
        "correct_answer": 0,
        "explanation": "Avogadro's number is ~6.022 × 10²³ particles per mole.",
      },
      {
        "question_text": "pH of pure water at 25°C is:",
        "options": ["0", "7", "14", "1"],
        "correct_answer": 1,
        "explanation": "Neutral water has pH 7 at 25°C.",
      },
      {
        "question_text": "The most electronegative element is:",
        "options": ["Oxygen", "Chlorine", "Fluorine", "Nitrogen"],
        "correct_answer": 2,
        "explanation": "Fluorine has the highest electronegativity.",
      },
      {
        "question_text": "NaCl is primarily formed by a:",
        "options": ["Covalent bond", "Ionic bond", "Hydrogen bond", "Metallic bond"],
        "correct_answer": 1,
        "explanation": "NaCl forms via electron transfer (ionic bonding).",
      },
      {
        "question_text": "Across a period (left to right), atomic radius generally:",
        "options": ["Increases", "Decreases", "Remains same", "Becomes zero"],
        "correct_answer": 1,
        "explanation": "Effective nuclear charge increases, pulling electrons closer, so radius decreases.",
      },
      {
        "question_text": "Molarity is defined as:",
        "options": ["Moles of solute per kg of solvent", "Moles of solute per liter of solution", "Mass per liter", "Mass per kg"],
        "correct_answer": 1,
        "explanation": "Molarity (M) = moles of solute / volume of solution in liters.",
      },
      {
        "question_text": "A catalyst increases reaction rate by:",
        "options": ["Increasing activation energy", "Decreasing activation energy", "Increasing product energy", "Changing equilibrium constant"],
        "correct_answer": 1,
        "explanation": "Catalysts provide an alternative pathway with lower activation energy.",
      },
      {
        "question_text": "Oxidation is best described as:",
        "options": ["Gain of electrons", "Loss of electrons", "Gain of neutrons", "Loss of protons"],
        "correct_answer": 1,
        "explanation": "Oxidation is loss of electrons (OIL).",
      },
      {
        "question_text": "Hybridization of carbon in methane (CH₄) is:",
        "options": ["sp", "sp²", "sp³", "dsp²"],
        "correct_answer": 2,
        "explanation": "Carbon in methane forms four sigma bonds: sp³ hybridization.",
      },
      {
        "question_text": "The chemical formula PV = nRT represents the:",
        "options": ["First law of thermodynamics", "Ideal gas equation", "Rate law", "Boyle's law only"],
        "correct_answer": 1,
        "explanation": "PV = nRT is the ideal gas equation.",
      },
      {
        "question_text": "HCl in water is classified as a:",
        "options": ["Weak base", "Strong acid", "Weak acid", "Neutral salt"],
        "correct_answer": 1,
        "explanation": "Hydrochloric acid ionizes almost completely in water; it is a strong acid.",
      },
      {
        "question_text": "IUPAC name of CH₃-CH₂-OH is:",
        "options": ["Methanol", "Ethanol", "Propanol", "Ethanal"],
        "correct_answer": 1,
        "explanation": "CH₃-CH₂-OH is ethanol.",
      },
    ],
    Subject.biology: [
      {
        "question_text": "The powerhouse of the cell is:",
        "options": ["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"],
        "correct_answer": 1,
        "explanation": "Mitochondria produce ATP via cellular respiration.",
      },
      {
        "question_text": "The basic unit of heredity is the:",
        "options": ["Cell", "Gene", "Tissue", "Organ"],
        "correct_answer": 1,
        "explanation": "Genes carry hereditary information on DNA.",
      },
      {
        "question_text": "Photosynthesis in plants occurs in:",
        "options": ["Mitochondria", "Chloroplasts", "Nucleus", "Ribosomes"],
        "correct_answer": 1,
        "explanation": "Chloroplasts contain chlorophyll and carry out photosynthesis.",
      },
      {
        "question_text": "Oxygen in blood is mainly transported by:",
        "options": ["Plasma proteins", "Hemoglobin in RBCs", "Platelets", "White blood cells"],
        "correct_answer": 1,
        "explanation": "Hemoglobin in red blood cells binds and transports oxygen.",
      },
      {
        "question_text": "The enzyme present in saliva that digests starch is:",
        "options": ["Pepsin", "Amylase", "Lipase", "Trypsin"],
        "correct_answer": 1,
        "explanation": "Salivary amylase starts starch digestion in the mouth.",
      },
      {
        "question_text": "The basic functional unit of the nervous system is the:",
        "options": ["Neuron", "Nephron", "Alveolus", "Osteon"],
        "correct_answer": 0,
        "explanation": "Neurons transmit nerve impulses.",
      },
      {
        "question_text": "Insulin is secreted by the:",
        "options": ["Thyroid gland", "Pancreas", "Adrenal gland", "Pituitary gland"],
        "correct_answer": 1,
        "explanation": "Insulin is produced by beta cells of the pancreas.",
      },
      {
        "question_text": "The human heart has:",
        "options": ["2 chambers", "3 chambers", "4 chambers", "5 chambers"],
        "correct_answer": 2,
        "explanation": "The heart has 4 chambers: 2 atria and 2 ventricles.",
      },
      {
        "question_text": "Vaccination provides:",
        "options": ["Passive immunity", "Active immunity", "No immunity", "Only innate immunity"],
        "correct_answer": 1,
        "explanation": "Vaccines stimulate the immune system to produce antibodies (active immunity).",
      },
      {
        "question_text": "Transpiration in plants mainly occurs through:",
        "options": ["Roots", "Stomata", "Xylem", "Phloem"],
        "correct_answer": 1,
        "explanation": "Stomata on leaves are the major route of transpiration.",
      },
      {
        "question_text": "Genetic material in some viruses is:",
        "options": ["Only DNA", "Only RNA", "Both DNA and RNA in the same particle", "Neither DNA nor RNA"],
        "correct_answer": 1,
        "explanation": "Many viruses (e.g., influenza) use RNA as genetic material.",
      },
      {
        "question_text": "DNA structure is described as a:",
        "options": ["Single strand", "Double helix", "Triple helix", "Protein chain"],
        "correct_answer": 1,
        "explanation": "DNA is a double helix structure.",
      },
    ],
  }


async def seed() -> None:
  rng = random.Random(2026)
  banks = _question_bank()

  async with AsyncSessionLocal() as session:
    admin_email = settings.SEED_ADMIN_EMAIL.lower()
    res = await session.execute(select(User).where(User.email == admin_email))
    admin = res.scalar_one_or_none()
    if not admin:
      admin = User(
        username=settings.SEED_ADMIN_USERNAME,
        email=admin_email,
        hashed_password=get_password_hash(settings.SEED_ADMIN_PASSWORD),
        role=UserRole.admin,
      )
      session.add(admin)

    student_email = "student@demo.com"
    res = await session.execute(select(User).where(User.email == student_email))
    student = res.scalar_one_or_none()
    if not student:
      student = User(
        username="Student",
        email=student_email,
        hashed_password=get_password_hash("student123"),
        role=UserRole.student,
      )
      session.add(student)

    await session.commit()

    # ── Seed demo teacher accounts ────────────────────────────────────────────
    demo_teachers = [
      ("Dr. Arjun Verma", "teacher.physics@demo.com", Subject.physics),
      ("Prof. Sneha Rao", "teacher.chemistry@demo.com", Subject.chemistry),
      ("Dr. Priya Nair", "teacher.biology@demo.com", Subject.biology),
    ]
    # Also seed a generic teacher account for the login screen demo button
    demo_teachers.append(("Demo Teacher", "teacher@demo.com", Subject.physics))

    for t_name, t_email, t_subject in demo_teachers:
      res = await session.execute(select(User).where(User.email == t_email))
      teacher = res.scalar_one_or_none()
      if not teacher:
        teacher = User(
          username=t_name,
          email=t_email,
          hashed_password=get_password_hash("teacher123"),
          role=UserRole.teacher,
        )
        session.add(teacher)
        await session.flush()  # get teacher.id

      # Assign subject if not already assigned
      res2 = await session.execute(select(TeacherSubject).where(TeacherSubject.user_id == teacher.id))
      if not res2.scalar_one_or_none():
        session.add(TeacherSubject(user_id=teacher.id, subject=t_subject))

    await session.commit()

    # Seed courses if empty (with non-empty fields everywhere)
    existing_courses = (await session.execute(select(Course))).scalars().all()
    if not existing_courses:
      courses = [
        Course(
          title="Physics: Mechanics - Foundation",
          description="Kinematics, laws of motion, and work-energy basics with NEET-style practice.",
          subject=Subject.physics,
          thumbnail_url="https://img.youtube.com/vi/ZM8ECpBuQYE/mqdefault.jpg",
        ),
        Course(
          title="Physics: Electrostatics & Current",
          description="Coulomb's law, electric field/potential, and basic current electricity.",
          subject=Subject.physics,
          thumbnail_url="https://img.youtube.com/vi/mdulzEfQXDE/mqdefault.jpg",
        ),
        Course(
          title="Chemistry: Organic - Basics",
          description="GOC, isomerism, and reaction basics with structured practice sets.",
          subject=Subject.chemistry,
          thumbnail_url="https://img.youtube.com/vi/bSMx0NS0XfY/mqdefault.jpg",
        ),
        Course(
          title="Chemistry: Physical - Mole Concept",
          description="Stoichiometry, limiting reagent, concentration terms, and quick numericals.",
          subject=Subject.chemistry,
          thumbnail_url="https://img.youtube.com/vi/AsqEkF7hcII/mqdefault.jpg",
        ),
        Course(
          title="Biology: Human Physiology",
          description="Digestive, respiratory, circulatory systems with high-yield MCQs.",
          subject=Subject.biology,
          thumbnail_url="https://img.youtube.com/vi/H8WJ2KENlK0/mqdefault.jpg",
        ),
        Course(
          title="Biology: Cell & Genetics",
          description="Cell organelles, biomolecules, DNA/RNA basics, and Mendelian genetics.",
          subject=Subject.biology,
          thumbnail_url="https://img.youtube.com/vi/bSMx0NS0XfY/mqdefault.jpg",
        ),
      ]
      session.add_all(courses)
      await session.commit()
      for c in courses:
        await session.refresh(c)

      lessons: list[Lesson] = []
      for c in courses:
        lessons.extend(
          [
            Lesson(
              course_id=c.id,
              title=f"{c.subject.value}: Overview + Strategy",
              video_url="https://www.youtube.com/watch?v=ZM8ECpBuQYE",
              duration=2400,
              order_index=1,
            ),
            Lesson(
              course_id=c.id,
              title=f"{c.subject.value}: Concepts + Examples",
              video_url="https://www.youtube.com/watch?v=mdulzEfQXDE",
              duration=2700,
              order_index=2,
            ),
            Lesson(
              course_id=c.id,
              title=f"{c.subject.value}: PYQ Style Practice",
              video_url="https://www.youtube.com/watch?v=AsqEkF7hcII",
              duration=3000,
              order_index=3,
            ),
          ]
        )
      session.add_all(lessons)
      await session.commit()

    # Ensure each course has at least one quiz with non-empty questions/options/explanations.
    courses = (await session.execute(select(Course))).scalars().all()

    # Fix any existing thumbnail_url that still uses hqdefault (idempotent)
    for c in courses:
      if c.thumbnail_url and "hqdefault.jpg" in c.thumbnail_url:
        c.thumbnail_url = c.thumbnail_url.replace("hqdefault.jpg", "mqdefault.jpg")
    await session.commit()
    for c in courses:
      res = await session.execute(
        select(Quiz).where(Quiz.course_id == c.id).order_by(Quiz.created_at.desc()).limit(1)
      )
      quiz = res.scalar_one_or_none()
      if not quiz:
        quiz = Quiz(course_id=c.id, title=f"{c.title} - Practice Quiz")
        session.add(quiz)
        await session.commit()
        await session.refresh(quiz)

      existing_texts = set(
        (await session.execute(select(Question.question_text).where(Question.quiz_id == quiz.id))).scalars().all()
      )
      needed = max(0, TARGET_QUESTIONS_PER_QUIZ - len(existing_texts))
      if needed == 0:
        continue

      bank = list(banks.get(c.subject) or [])
      rng.shuffle(bank)

      to_add = []
      for item in bank:
        if len(to_add) >= needed:
          break
        qt = str(item.get("question_text", "")).strip()
        options = item.get("options") or []
        explanation = str(item.get("explanation", "")).strip()
        correct = int(item.get("correct_answer", 0))

        if not qt or qt in existing_texts:
          continue
        if not isinstance(options, list) or len(options) < 2:
          continue
        if any(not str(o).strip() for o in options):
          continue
        if not explanation:
          continue
        if correct < 0 or correct >= len(options):
          continue

        to_add.append(
          Question(
            quiz_id=quiz.id,
            question_text=qt,
            options=[str(o).strip() for o in options],
            correct_answer=correct,
            explanation=explanation,
          )
        )
        existing_texts.add(qt)

      # Fallback: add simple generated questions if bank is short.
      while len(to_add) < needed:
        idx = len(existing_texts) + 1
        qt = f"[Auto] {c.subject.value} MCQ #{idx}: Choose the correct statement."
        if qt in existing_texts:
          continue
        to_add.append(
          Question(
            quiz_id=quiz.id,
            question_text=qt,
            options=[
              "Statement A is correct.",
              "Statement B is correct.",
              "Statement C is correct.",
              "Statement D is correct.",
            ],
            correct_answer=0,
            explanation="Auto-generated demo question to keep seed data complete (non-empty fields).",
          )
        )
        existing_texts.add(qt)

      session.add_all(to_add)
      await session.commit()

    # Give the demo student a "real" looking dashboard: enroll + partial progress + a few quiz attempts.
    demo_enrolled = (
      await session.execute(select(Enrollment.id).where(Enrollment.user_id == student.id).limit(1))
    ).scalar_one_or_none()
    if not demo_enrolled:
      picked: list[Course] = []
      seen: set[Subject] = set()
      for c in courses:
        if c.subject in seen:
          continue
        picked.append(c)
        seen.add(c.subject)
      session.add_all([Enrollment(user_id=student.id, course_id=c.id) for c in picked])
      await session.commit()

    demo_has_progress = (
      await session.execute(select(Progress.id).where(Progress.user_id == student.id).limit(1))
    ).scalar_one_or_none()
    if not demo_has_progress:
      enrolled_course_ids = (
        await session.execute(select(Enrollment.course_id).where(Enrollment.user_id == student.id))
      ).scalars().all()
      lessons = (
        await session.execute(
          select(Lesson).where(Lesson.course_id.in_(enrolled_course_ids)).order_by(Lesson.course_id, Lesson.order_index)
        )
      ).scalars().all()

      to_add_progress: list[Progress] = []
      by_course: dict[uuid.UUID, list[Lesson]] = {}
      for lesson in lessons:
        by_course.setdefault(lesson.course_id, []).append(lesson)

      for course_id, ls in by_course.items():
        if not ls:
          continue
        first = ls[0]
        to_add_progress.append(
          Progress(user_id=student.id, lesson_id=first.id, watched_seconds=max(0, int(first.duration)), completed=True)
        )
        if len(ls) > 1:
          second = ls[1]
          to_add_progress.append(
            Progress(
              user_id=student.id,
              lesson_id=second.id,
              watched_seconds=max(0, int(second.duration // 2)),
              completed=False,
            )
          )

      session.add_all(to_add_progress)
      await session.commit()

    demo_has_quiz_results = (
      await session.execute(select(QuizResult.id).where(QuizResult.user_id == student.id).limit(1))
    ).scalar_one_or_none()
    if not demo_has_quiz_results:
      enrolled_course_ids = (
        await session.execute(select(Enrollment.course_id).where(Enrollment.user_id == student.id))
      ).scalars().all()
      quiz_ids = (await session.execute(select(Quiz.id).where(Quiz.course_id.in_(enrolled_course_ids)))).scalars().all()

      results: list[QuizResult] = []
      for quiz_id in quiz_ids[:3]:
        total = int(
          (await session.execute(select(func.count()).select_from(Question).where(Question.quiz_id == quiz_id))).scalar_one()
        )
        total = max(1, total)
        score = max(1, int(round(total * 0.7)))
        results.append(QuizResult(user_id=student.id, quiz_id=quiz_id, score=score, total_questions=total))

      session.add_all(results)
      await session.commit()

    # ── Seed student_performance for demo student ─────────────────────────────
    for subj in Subject:
      res = await session.execute(
        select(StudentPerformance).where(
          StudentPerformance.user_id == student.id,
          StudentPerformance.subject == subj,
        )
      )
      if not res.scalar_one_or_none():
        score = rng.randint(5, 9)
        total = 10
        session.add(
          StudentPerformance(
            user_id=student.id,
            subject=subj,
            total_score=score,
            total_questions=total,
            quiz_attempts=rng.randint(1, 4),
            accuracy_pct=round((score / total) * 100, 1),
            completed_lessons=rng.randint(1, 3),
            total_lessons=3,
            watched_seconds=rng.randint(1800, 7200),
            progress_pct=round(rng.uniform(30, 80), 1),
            time_spent_seconds=rng.randint(3600, 14400),
          )
        )
    await session.commit()


def main() -> None:
  asyncio.run(seed())


if __name__ == "__main__":
  main()
