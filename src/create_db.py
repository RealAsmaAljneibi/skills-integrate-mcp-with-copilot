from sqlmodel import Session, select
from .db import engine, init_db
from .models import Provider, Workshop


SAMPLE_WORKSHOPS = [
    {
        "title": "Chess Club",
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "status": "published",
    },
    {
        "title": "Programming Class",
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "status": "published",
    },
]


def seed() -> None:
    init_db()
    with Session(engine) as session:
        # add a default provider if none exists
        provider = session.exec(select(Provider)).first()
        if not provider:
            provider = Provider(name="Mergington High", public=True)
            session.add(provider)
            session.commit()
            session.refresh(provider)

        # add sample workshops if none exist
        existing = session.exec(select(Workshop)).first()
        if not existing:
            for w in SAMPLE_WORKSHOPS:
                workshop = Workshop(provider_id=provider.id, **w)
                session.add(workshop)
            session.commit()


if __name__ == "__main__":
    print("Initializing database and seeding sample data...")
    seed()
    print("Done.")
