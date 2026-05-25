import json
import google.generativeai as genai
from openai import OpenAI
from app.config import settings
from typing import Dict, Any, List

class AIService:
    @staticmethod
    def _get_gemini_model(custom_key: str = None):
        key = custom_key or settings.GEMINI_API_KEY
        if not key:
            raise ValueError("Gemini API key is not configured.")
        genai.configure(api_key=key)
        return genai.GenerativeModel(settings.GEMINI_MODEL)

    @staticmethod
    def _get_openai_client(custom_key: str = None):
        key = custom_key or settings.OPENAI_API_KEY
        if not key:
            raise ValueError("OpenAI API key is not configured.")
        return OpenAI(api_key=key)

    @classmethod
    def generate_email(cls, params: Dict[str, Any]) -> Dict[str, Any]:
        provider = params.get("provider", "gemini")
        category = params.get("category")
        recipient = params.get("recipient") or "the recipient"
        subject_context = params.get("subject") or ""
        prompt = params.get("prompt")
        tone = params.get("tone", "Professional")
        length = params.get("length", "Medium")
        language = params.get("language", "English")
        
        system_instruction = (
            "You are SmartMail AI, an elite email copywriter. Your goal is to write perfect emails "
            "that match the requested category, recipient, tone, length, and language. "
            "You must output ONLY a valid JSON object. Do not include markdown code block syntax (like ```json ... ```). "
            "The JSON object must have exactly these keys:\n"
            '- "subject": The generated subject line for the email.\n'
            '- "content": The body of the email (exclude subject, salutation/sign-off should match tone).\n'
            '- "score_grammar": A score from 0-100 indicating grammar and spelling accuracy.\n'
            '- "score_spam": A score from 0-100 indicating likelihood of getting caught in spam filters (low is good).\n'
            '- "score_clarity": A score from 0-100 indicating readability and clarity.'
        )

        user_content = (
            f"Please generate an email with the following details:\n"
            f"Category: {category}\n"
            f"Recipient: {recipient}\n"
            f"Subject Context: {subject_context}\n"
            f"Tone: {tone}\n"
            f"Length: {length} (Short = ~50-100 words, Medium = ~150-250 words, Long = ~300+ words)\n"
            f"Language: {language}\n"
            f"User request details: {prompt}\n\n"
            f"Ensure formatting is clean and professional (use proper spacing and paragraphs). "
            f"Return only the raw JSON."
        )

        try:
            if provider == "openai" or (not settings.GEMINI_API_KEY and settings.OPENAI_API_KEY and not params.get("user_gemini_key")):
                # Use OpenAI
                client = cls._get_openai_client(params.get("user_openai_key"))
                response = client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": user_content}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.7
                )
                raw_result = response.choices[0].message.content
            else:
                # Use Gemini
                model = cls._get_gemini_model(params.get("user_gemini_key"))
                # Configure generation to request JSON if model supports it, but standard parsing works too
                generation_config = genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.7
                )
                response = model.generate_content(
                    f"{system_instruction}\n\n{user_content}",
                    generation_config=generation_config
                )
                raw_result = response.text

            # Parse JSON
            cleaned_result = raw_result.strip()
            if cleaned_result.startswith("```json"):
                cleaned_result = cleaned_result.replace("```json", "", 1)
            if cleaned_result.endswith("```"):
                cleaned_result = cleaned_result[:-3]
            cleaned_result = cleaned_result.strip()
            
            return json.loads(cleaned_result)
        except Exception as e:
            # Fallback output in case of failure or bad JSON
            return {
                "subject": f"Regarding your request" if not subject_context else subject_context,
                "content": f"Dear {recipient},\n\nWe encountered an error generating your email. Please try again.\nDetails: {str(e)}\n\nBest regards,\nSmartMail AI",
                "score_grammar": 100,
                "score_spam": 0,
                "score_clarity": 100
            }

    @classmethod
    def improve_prompt(cls, prompt: str, params: Dict[str, Any]) -> str:
        provider = params.get("provider", "gemini")
        system_instruction = (
            "You are an expert prompt engineer. Your job is to take a simple, short email prompt "
            "and expand it into a detailed, context-rich instruction that covers key details, "
            "necessary parameters, and structure, without changing the user's core intent. "
            "Keep the output concise (under 80 words) but highly detailed. "
            "Output ONLY the improved prompt, with no intro, outro, or quotes."
        )
        
        try:
            if provider == "openai" or (not settings.GEMINI_API_KEY and settings.OPENAI_API_KEY and not params.get("user_gemini_key")):
                client = cls._get_openai_client(params.get("user_openai_key"))
                response = client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": f"Improve this email prompt: '{prompt}'"}
                    ],
                    temperature=0.7
                )
                return response.choices[0].message.content.strip()
            else:
                model = cls._get_gemini_model(params.get("user_gemini_key"))
                response = model.generate_content(f"{system_instruction}\n\nImprove this email prompt: '{prompt}'")
                return response.text.strip()
        except Exception as e:
            return f"{prompt} (Include standard professional outline, clear call to action, and context details)."

    @classmethod
    def rewrite_email(cls, email_content: str, instruction: str, tone: str, length: str, params: Dict[str, Any]) -> Dict[str, Any]:
        provider = params.get("provider", "gemini")
        system_instruction = (
            "You are an expert editor. Rewrite the email body provided by the user. "
            "You must follow these instructions:\n"
            f"1. Modification Request: {instruction}\n"
            f"2. Desired Tone: {tone if tone else 'keep original'}\n"
            f"3. Desired Length: {length if length else 'keep original'}\n\n"
            "Keep the core meaning, but alter style, tone, grammar, and layout as requested. "
            "You must output ONLY a valid JSON object. Do not include markdown code block syntax. "
            "The JSON object must have exactly these keys:\n"
            '- "subject": Optional, a new subject line if the instruction implies modifying the subject, else null.\n'
            '- "content": The rewritten email body.'
        )

        try:
            if provider == "openai" or (not settings.GEMINI_API_KEY and settings.OPENAI_API_KEY and not params.get("user_gemini_key")):
                client = cls._get_openai_client(params.get("user_openai_key"))
                response = client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": f"Email to rewrite:\n{email_content}"}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.7
                )
                raw_result = response.choices[0].message.content
            else:
                model = cls._get_gemini_model(params.get("user_gemini_key"))
                generation_config = genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.7
                )
                response = model.generate_content(
                    f"{system_instruction}\n\nEmail to rewrite:\n{email_content}",
                    generation_config=generation_config
                )
                raw_result = response.text

            cleaned_result = raw_result.strip()
            if cleaned_result.startswith("```json"):
                cleaned_result = cleaned_result.replace("```json", "", 1)
            if cleaned_result.endswith("```"):
                cleaned_result = cleaned_result[:-3]
            
            return json.loads(cleaned_result.strip())
        except Exception as e:
            return {
                "subject": None,
                "content": f"{email_content}\n\n[Failed to rewrite. Error: {str(e)}]"
            }

    @classmethod
    def summarize_email(cls, email_content: str, params: Dict[str, Any]) -> str:
        provider = params.get("provider", "gemini")
        system_instruction = (
            "Provide a highly concise, one-sentence summary of the main action items and purpose of this email. "
            "Keep the summary under 30 words. Do not write any intro, outro, or quotes."
        )

        try:
            if provider == "openai" or (not settings.GEMINI_API_KEY and settings.OPENAI_API_KEY and not params.get("user_gemini_key")):
                client = cls._get_openai_client(params.get("user_openai_key"))
                response = client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": f"Email to summarize:\n{email_content}"}
                    ],
                    temperature=0.5
                )
                return response.choices[0].message.content.strip()
            else:
                model = cls._get_gemini_model(params.get("user_gemini_key"))
                response = model.generate_content(f"{system_instruction}\n\nEmail to summarize:\n{email_content}")
                return response.text.strip()
        except Exception as e:
            return f"Error creating summary: {str(e)}"

    @classmethod
    def score_email(cls, email_content: str, params: Dict[str, Any]) -> Dict[str, Any]:
        provider = params.get("provider", "gemini")
        system_instruction = (
            "Analyze the following email body for grammar, spam likelihood, and clarity. "
            "You must output ONLY a valid JSON object. Do not include markdown code block syntax. "
            "The JSON object must have exactly these keys:\n"
            '- "score_grammar": A score from 0-100 indicating grammar and spelling accuracy.\n'
            '- "score_spam": A score from 0-100 indicating spam likelihood (low is good, e.g., overuse of sales terms or ALL CAPS).\n'
            '- "score_clarity": A score from 0-100 indicating readability and clarity.\n'
            '- "suggestions": A list of strings containing specific, actionable feedback for improvement.'
        )

        try:
            if provider == "openai" or (not settings.GEMINI_API_KEY and settings.OPENAI_API_KEY and not params.get("user_gemini_key")):
                client = cls._get_openai_client(params.get("user_openai_key"))
                response = client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": f"Email to score:\n{email_content}"}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.5
                )
                raw_result = response.choices[0].message.content
            else:
                model = cls._get_gemini_model(params.get("user_gemini_key"))
                generation_config = genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.5
                )
                response = model.generate_content(
                    f"{system_instruction}\n\nEmail to score:\n{email_content}",
                    generation_config=generation_config
                )
                raw_result = response.text

            cleaned_result = raw_result.strip()
            if cleaned_result.startswith("```json"):
                cleaned_result = cleaned_result.replace("```json", "", 1)
            if cleaned_result.endswith("```"):
                cleaned_result = cleaned_result[:-3]

            return json.loads(cleaned_result.strip())
        except Exception as e:
            return {
                "score_grammar": 90,
                "score_spam": 10,
                "score_clarity": 90,
                "suggestions": [f"Could not calculate exact scores. Error: {str(e)}"]
            }
