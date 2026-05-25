from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# --- AUTH SCHEMAS ---

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None


# --- EMAIL SCHEMAS ---

class EmailGenerateRequest(BaseModel):
    category: str = Field(..., description="e.g., Professional, Leave Request, Cold Email, etc.")
    recipient: Optional[str] = Field(None, description="Name of the recipient")
    subject: Optional[str] = Field(None, description="Brief context or custom subject line")
    prompt: str = Field(..., description="What the user wants to say in the email")
    tone: str = Field("Professional", description="e.g., Professional, Friendly, Formal, Casual, etc.")
    length: str = Field("Medium", description="Short, Medium, or Long")
    language: str = Field("English", description="Language of the generated email")
    
    sender_date: Optional[str] = Field(None, description="Custom date for the email")
    sender_name: Optional[str] = Field(None, description="Sender's name")
    sender_mobile: Optional[str] = Field(None, description="Sender's mobile number")
    sender_email: Optional[str] = Field(None, description="Sender's email address")
    
    # Allows users to use their own keys if configured
    user_groq_key: Optional[str] = None
    provider: Optional[str] = Field("groq", description="groq")

class EmailGenerateResponse(BaseModel):
    subject: str
    content: str
    score_grammar: int
    score_spam: int
    score_clarity: int

class EmailImprovePromptRequest(BaseModel):
    prompt: str
    user_groq_key: Optional[str] = None
    provider: Optional[str] = "groq"

class EmailImprovePromptResponse(BaseModel):
    improved_prompt: str

class EmailRewriteRequest(BaseModel):
    email_content: str
    instruction: str = Field(..., description="Instruction on how to rewrite: e.g., 'Make it more formal', 'Shorten it', etc.")
    tone: Optional[str] = None
    length: Optional[str] = None
    user_groq_key: Optional[str] = None
    provider: Optional[str] = "groq"

class EmailRewriteResponse(BaseModel):
    subject: Optional[str] = None
    content: str

class EmailSummarizeRequest(BaseModel):
    email_content: str
    user_groq_key: Optional[str] = None
    provider: Optional[str] = "groq"

class EmailSummarizeResponse(BaseModel):
    summary: str

class EmailScoreRequest(BaseModel):
    email_content: str
    user_groq_key: Optional[str] = None
    provider: Optional[str] = "groq"

class EmailScoreResponse(BaseModel):
    score_grammar: int
    score_spam: int
    score_clarity: int
    suggestions: List[str]

class EmailSaveRequest(BaseModel):
    is_saved: bool

class EmailRateRequest(BaseModel):
    rating: int = Field(..., ge=0, le=5)

class EmailHistoryResponse(BaseModel):
    id: int
    user_id: int
    category: str
    recipient: Optional[str] = None
    subject: Optional[str] = None
    prompt: str
    content: str
    tone: str
    length: str
    language: str
    rating: int
    score_grammar: int
    score_spam: int
    score_clarity: int
    is_saved: bool
    created_at: datetime

    class Config:
        from_attributes = True
