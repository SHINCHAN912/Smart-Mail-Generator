from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer

from app.database import get_db
from app.models import EmailHistory, User
from app.schemas import (
    EmailGenerateRequest, EmailGenerateResponse,
    EmailImprovePromptRequest, EmailImprovePromptResponse,
    EmailRewriteRequest, EmailRewriteResponse,
    EmailSummarizeRequest, EmailSummarizeResponse,
    EmailScoreRequest, EmailScoreResponse,
    EmailHistoryResponse, EmailSaveRequest, EmailRateRequest
)
from app.services.ai_service import AIService
from app.routes.auth import get_optional_current_user, get_current_user

router = APIRouter(prefix="/api/emails", tags=["Emails"])

@router.post("/generate", response_model=EmailGenerateResponse)
def generate_email(
    request: EmailGenerateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    params = request.model_dump()
    result = AIService.generate_email(params)
    
    # Save to database if user is authenticated
    if current_user:
        history_item = EmailHistory(
            user_id=current_user.id,
            category=request.category,
            recipient=request.recipient,
            subject=result.get("subject", request.subject),
            prompt=request.prompt,
            content=result.get("content", ""),
            tone=request.tone,
            length=request.length,
            language=request.language,
            score_grammar=result.get("score_grammar", 90),
            score_spam=result.get("score_spam", 10),
            score_clarity=result.get("score_clarity", 90),
            is_saved=False
        )
        db.add(history_item)
        db.commit()
        db.refresh(history_item)
        
    return EmailGenerateResponse(
        subject=result.get("subject", ""),
        content=result.get("content", ""),
        score_grammar=result.get("score_grammar", 90),
        score_spam=result.get("score_spam", 10),
        score_clarity=result.get("score_clarity", 90)
    )

@router.post("/improve-prompt", response_model=EmailImprovePromptResponse)
def improve_prompt(request: EmailImprovePromptRequest):
    improved = AIService.improve_prompt(request.prompt, request.model_dump())
    return EmailImprovePromptResponse(improved_prompt=improved)

@router.post("/rewrite", response_model=EmailRewriteResponse)
def rewrite_email(request: EmailRewriteRequest):
    params = request.model_dump()
    result = AIService.rewrite_email(
        email_content=request.email_content,
        instruction=request.instruction,
        tone=request.tone,
        length=request.length,
        params=params
    )
    return EmailRewriteResponse(
        subject=result.get("subject"),
        content=result.get("content", "")
    )

@router.post("/summarize", response_model=EmailSummarizeResponse)
def summarize_email(request: EmailSummarizeRequest):
    summary = AIService.summarize_email(request.email_content, request.model_dump())
    return EmailSummarizeResponse(summary=summary)

@router.post("/score", response_model=EmailScoreResponse)
def score_email(request: EmailScoreRequest):
    score_details = AIService.score_email(request.email_content, request.model_dump())
    return EmailScoreResponse(
        score_grammar=score_details.get("score_grammar", 90),
        score_spam=score_details.get("score_spam", 10),
        score_clarity=score_details.get("score_clarity", 90),
        suggestions=score_details.get("suggestions", [])
    )

# History Endpoints (require authentication)

@router.get("/history", response_model=List[EmailHistoryResponse])
def get_email_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    history = (
        db.query(EmailHistory)
        .filter(EmailHistory.user_id == current_user.id)
        .order_by(EmailHistory.created_at.desc())
        .all()
    )
    return history

@router.get("/saved", response_model=List[EmailHistoryResponse])
def get_saved_emails(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    saved = (
        db.query(EmailHistory)
        .filter(EmailHistory.user_id == current_user.id, EmailHistory.is_saved == True)
        .order_by(EmailHistory.created_at.desc())
        .all()
    )
    return saved

@router.post("/{email_id}/save", response_model=EmailHistoryResponse)
def toggle_save_email(
    email_id: int,
    request: EmailSaveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    email_item = (
        db.query(EmailHistory)
        .filter(EmailHistory.id == email_id, EmailHistory.user_id == current_user.id)
        .first()
    )
    if not email_item:
        raise HTTPException(status_code=404, detail="Email record not found")
        
    email_item.is_saved = request.is_saved
    db.commit()
    db.refresh(email_item)
    return email_item

@router.post("/{email_id}/rate", response_model=EmailHistoryResponse)
def rate_email(
    email_id: int,
    request: EmailRateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    email_item = (
        db.query(EmailHistory)
        .filter(EmailHistory.id == email_id, EmailHistory.user_id == current_user.id)
        .first()
    )
    if not email_item:
        raise HTTPException(status_code=404, detail="Email record not found")
        
    email_item.rating = request.rating
    db.commit()
    db.refresh(email_item)
    return email_item

@router.delete("/{email_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_email(
    email_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    email_item = (
        db.query(EmailHistory)
        .filter(EmailHistory.id == email_id, EmailHistory.user_id == current_user.id)
        .first()
    )
    if not email_item:
        raise HTTPException(status_code=404, detail="Email record not found")
        
    db.delete(email_item)
    db.commit()
    return None
