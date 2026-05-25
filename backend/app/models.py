import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    emails = relationship("EmailHistory", back_populates="owner", cascade="all, delete-orphan")

class EmailHistory(Base):
    __tablename__ = "email_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Form input fields
    category = Column(String, nullable=False)
    recipient = Column(String, nullable=True)
    subject = Column(String, nullable=True)
    prompt = Column(Text, nullable=False)
    content = Column(Text, nullable=False) # Generated email text
    
    # Metadata
    tone = Column(String, nullable=False)
    length = Column(String, nullable=False) # Short, Medium, Long
    language = Column(String, default="English")
    
    # Analytics / Scoring
    rating = Column(Integer, default=0) # 0 to 5 stars
    score_grammar = Column(Integer, default=0) # 0 to 100
    score_spam = Column(Integer, default=0) # 0 to 100 (chance of being spam)
    score_clarity = Column(Integer, default=0) # 0 to 100
    
    # Status
    is_saved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="emails")
