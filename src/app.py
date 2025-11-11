"""
High School Management System API (DB-backed)

This version replaces the in-memory `activities` store with SQLModel models
and provides simple endpoints that use a SQLite database (./dev.db) for
development. There's also `src/create_db.py` to initialize and seed the DB.
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pathlib import Path
from typing import List

from sqlmodel import Session, select

from .db import get_session, init_db
from .models import Workshop, Participant


app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")


# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=current_dir / "static"), name="static")


@app.on_event("startup")
def on_startup():
    # Ensure database tables exist (safe to call multiple times)
    init_db()


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities(session: Session = Depends(get_session)) -> List[dict]:
    """Return published workshops as activities."""
    statement = select(Workshop).where(Workshop.status == "published")
    results = session.exec(statement).all()
    out = []
    for w in results:
        # count participants
        count = len(w.participants) if w.participants is not None else 0
        out.append({
            "title": w.title,
            "description": w.description,
            "schedule": w.schedule,
            "max_participants": w.max_participants,
            "participants_count": count,
        })
    return out


@app.post("/activities/{activity_title}/signup")
def signup_for_activity(activity_title: str, email: str, session: Session = Depends(get_session)):
    """Sign up a student for an activity (workshop)."""
    statement = select(Workshop).where(Workshop.title == activity_title)
    workshop = session.exec(statement).first()
    if not workshop:
        raise HTTPException(status_code=404, detail="Activity not found")

    # count current participants
    # workshop.participants relationship may be lazy-loaded
    participants = workshop.participants or []
    if any(p.email == email for p in participants):
        raise HTTPException(status_code=400, detail="Student is already signed up")

    if workshop.max_participants and len(participants) >= workshop.max_participants:
        raise HTTPException(status_code=400, detail="Activity is full")

    participant = Participant(email=email, workshop_id=workshop.id)
    session.add(participant)
    session.commit()
    session.refresh(participant)
    return {"message": f"Signed up {email} for {activity_title}"}


@app.delete("/activities/{activity_title}/unregister")
def unregister_from_activity(activity_title: str, email: str, session: Session = Depends(get_session)):
    statement = select(Workshop).where(Workshop.title == activity_title)
    workshop = session.exec(statement).first()
    if not workshop:
        raise HTTPException(status_code=404, detail="Activity not found")

    # find participant
    stmt = select(Participant).where(Participant.workshop_id == workshop.id, Participant.email == email)
    participant = session.exec(stmt).first()
    if not participant:
        raise HTTPException(status_code=400, detail="Student is not signed up for this activity")

    session.delete(participant)
    session.commit()
    return {"message": f"Unregistered {email} from {activity_title}"}
