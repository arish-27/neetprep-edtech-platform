import asyncio
from app.db.database import AsyncSessionLocal
from app.models.course import Course
from app.models.payment import CoursePrice
from sqlalchemy import select


async def add_prices():
    async with AsyncSessionLocal() as db:
        # Get all courses
        result = await db.execute(select(Course))
        courses = result.scalars().all()
        
        print(f"Found {len(courses)} courses")
        
        for course in courses:
            # Check if price already exists
            price_result = await db.execute(
                select(CoursePrice).where(CoursePrice.course_id == course.id)
            )
            existing_price = price_result.scalar_one_or_none()
            
            if existing_price:
                print(f"Price already exists for: {course.title}")
                continue
            
            # Add price
            course_price = CoursePrice(
                course_id=course.id,
                price=999.0,  # ₹999
                original_price=1999.0,  # ₹1999 (50% discount)
                currency="INR",
                is_free=False,
                discount_percentage=50
            )
            db.add(course_price)
            print(f"Added price for: {course.title} - ₹999 (50% off from ₹1999)")
        
        await db.commit()
        print("\nAll course prices added successfully!")


if __name__ == "__main__":
    asyncio.run(add_prices())
