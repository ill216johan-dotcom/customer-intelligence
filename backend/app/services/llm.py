"""
LLM Service - GLM-4 integration for summarization and chat.
"""

from typing import List, Optional
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings


# ==========================================
# GLM-4 API Client
# ==========================================

class GLMClient:
    """Client for ZhipuAI GLM-4 API."""
    
    def __init__(self):
        self.api_key = settings.glm_api_key
        self.base_url = settings.glm_api_base
        self.model = "glm-4"  # or "glm-4-flash" for cheaper option
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def chat(
        self,
        messages: List[dict],
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        """Send chat completion request to GLM-4."""
        if not self.api_key:
            return "[GLM API key not configured]"
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def embedding(self, text: str) -> List[float]:
        """Generate embedding for text using GLM embedding model."""
        if not self.api_key:
            return []
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/embeddings",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "embedding-2",  # GLM embedding model
                    "input": text,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["data"][0]["embedding"]


# Global client instance
glm_client = GLMClient()


# ==========================================
# High-level functions
# ==========================================

async def generate_call_summary(
    transcript: str,
    participants: Optional[List[str]] = None,
) -> dict:
    """
    Generate summary for a call transcript.
    Returns: {summary, key_points, action_items}
    """
    participants_str = ", ".join(participants) if participants else "участники неизвестны"
    
    prompt = f"""Проанализируй транскрипт созвона и создай структурированное саммари.

УЧАСТНИКИ: {participants_str}

ТРАНСКРИПТ:
{transcript[:15000]}  # Limit to ~15k chars to fit context

---

Ответь в следующем формате:

САММАРИ:
[Краткое описание созвона в 2-3 предложениях]

КЛЮЧЕВЫЕ ПУНКТЫ:
- [пункт 1]
- [пункт 2]
- [пункт 3]
...

ЗАДАЧИ/ДОГОВОРЁННОСТИ:
- [задача 1]
- [задача 2]
...

Если были упомянуты проблемы или боли клиента, обязательно отметь их."""

    messages = [
        {"role": "system", "content": "Ты — ассистент для анализа деловых созвонов в сфере фулфилмента и маркетплейсов. Пиши на русском языке."},
        {"role": "user", "content": prompt},
    ]
    
    response = await glm_client.chat(messages, temperature=0.3)
    
    # Parse response
    summary = ""
    key_points = []
    action_items = []
    
    current_section = None
    for line in response.split("\n"):
        line = line.strip()
        if line.startswith("САММАРИ:"):
            current_section = "summary"
            continue
        elif line.startswith("КЛЮЧЕВЫЕ ПУНКТЫ:"):
            current_section = "key_points"
            continue
        elif line.startswith("ЗАДАЧИ") or line.startswith("ДОГОВОРЁННОСТИ"):
            current_section = "action_items"
            continue
        
        if current_section == "summary" and line:
            summary += line + " "
        elif current_section == "key_points" and line.startswith("-"):
            key_points.append(line[1:].strip())
        elif current_section == "action_items" and line.startswith("-"):
            action_items.append(line[1:].strip())
    
    return {
        "summary": summary.strip() or response,  # Fallback to full response
        "key_points": key_points,
        "action_items": action_items,
    }


async def generate_chat_summary(
    messages: List[dict],
    customer_name: str,
) -> dict:
    """
    Generate summary for a chat conversation.
    messages: [{"sender": str, "content": str, "date": str}, ...]
    """
    # Format messages
    formatted = []
    for msg in messages[-50:]:  # Last 50 messages
        sender = msg.get("sender", "Unknown")
        content = msg.get("content", "")
        formatted.append(f"{sender}: {content}")
    
    messages_text = "\n".join(formatted)
    
    prompt = f"""Проанализируй переписку с клиентом и создай краткое саммари.

КЛИЕНТ: {customer_name}

ПЕРЕПИСКА:
{messages_text}

---

Ответь в следующем формате:

САММАРИ:
[Краткое описание о чём была переписка в 1-2 предложениях]

КЛЮЧЕВЫЕ ТЕМЫ:
- [тема 1]
- [тема 2]
...

ТОНАЛЬНОСТЬ: [положительная/нейтральная/негативная]

ТРЕБУЕТСЯ ДЕЙСТВИЕ: [да/нет] - [если да, какое]"""

    chat_messages = [
        {"role": "system", "content": "Ты — ассистент для анализа деловой переписки в сфере фулфилмента. Пиши кратко и по делу."},
        {"role": "user", "content": prompt},
    ]
    
    response = await glm_client.chat(chat_messages, temperature=0.3)
    
    # Parse (simplified)
    return {
        "summary": response,
        "sentiment": "neutral",  # Could parse from response
    }


async def generate_chat_response(
    question: str,
    context: str,
    customer_profile: str,
    history: Optional[List[dict]] = None,
) -> str:
    """
    Generate RAG chat response about a customer.
    """
    system_prompt = """Ты — ассистент менеджера фулфилмента. Твоя задача — отвечать на вопросы о клиентах, 
используя предоставленный контекст (созвоны, переписки, заметки).

Правила:
1. Отвечай ТОЛЬКО на основе предоставленного контекста
2. Если информации нет в контексте — честно скажи об этом
3. Будь кратким и конкретным
4. Если видишь противоречия в данных — укажи на них
5. Пиши на русском языке"""

    user_prompt = f"""ПРОФИЛЬ КЛИЕНТА:
{customer_profile}

КОНТЕКСТ (созвоны, сообщения, заметки):
{context}

---

ВОПРОС: {question}"""

    messages = [{"role": "system", "content": system_prompt}]
    
    # Add history if provided
    if history:
        for msg in history[-6:]:  # Last 6 messages
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", ""),
            })
    
    messages.append({"role": "user", "content": user_prompt})
    
    response = await glm_client.chat(messages, temperature=0.5)
    return response


async def generate_embedding(text: str) -> Optional[List[float]]:
    """Generate embedding vector for text."""
    if not text:
        return None
    
    # Truncate if too long (GLM limit)
    text = text[:8000]
    
    try:
        embedding = await glm_client.embedding(text)
        return embedding
    except Exception as e:
        print(f"Embedding generation failed: {e}")
        return None
