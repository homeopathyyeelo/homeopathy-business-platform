from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import asyncpg
import os
from datetime import datetime

router = APIRouter(prefix="/api/v1/ai", tags=["ai-fix"])

class BugAnalysisRequest(BaseModel):
    bug_id: str
    service_name: str
    error_message: str
    stack_trace: Optional[str] = None
    http_status: Optional[int] = None

class FixSuggestion(BaseModel):
    suggestion: str
    diff_patch: str
    files_to_modify: List[str]
    confidence: float
    test_command: Optional[str] = None
    commit_message: str

class BugAnalysisResponse(BaseModel):
    bug_id: str
    root_cause: str
    severity_analysis: str
    fix_suggestions: List[FixSuggestion]
    estimated_fix_time: str

@router.post("/fix", response_model=BugAnalysisResponse)
async def analyze_and_fix(request: BugAnalysisRequest):
    """
    AI analyzes bug and generates fix suggestions
    """
    
    # TODO: Call actual LLM (OpenAI/Claude/Local model)
    # For now, rule-based analysis
    
    root_cause = analyze_error(request.error_message, request.stack_trace)
    suggestions = generate_fix_suggestions(request.service_name, root_cause, request.error_message)
    
    # Store analysis in DB
    async with get_db_conn() as conn:
        await conn.execute("""
            INSERT INTO ai_fix_suggestions (
                bug_id, root_cause, suggestions, confidence, created_at
            ) VALUES ($1, $2, $3, $4, $5)
        """, request.bug_id, root_cause, suggestions[0].suggestion if suggestions else "", 
        suggestions[0].confidence if suggestions else 0.0, datetime.utcnow())
    
    return BugAnalysisResponse(
        bug_id=request.bug_id,
        root_cause=root_cause,
        severity_analysis=determine_severity(request.http_status),
        fix_suggestions=suggestions,
        estimated_fix_time="5-15 minutes"
    )

def analyze_error(error_msg: str, stack_trace: Optional[str]) -> str:
    """Rule-based error analysis"""
    error_lower = error_msg.lower()
    
    if "null" in error_lower or "undefined" in error_lower:
        return "Null pointer or undefined variable access"
    elif "sql" in error_lower or "database" in error_lower:
        return "Database query or connection issue"
    elif "json" in error_lower or "unmarshal" in error_lower:
        return "JSON parsing or serialization error"
    elif "permission" in error_lower or "unauthorized" in error_lower:
        return "Authorization or permission check failed"
    elif "timeout" in error_lower:
        return "Request timeout or slow query"
    else:
        return "General application error - requires manual review"

def generate_fix_suggestions(service: str, root_cause: str, error: str) -> List[FixSuggestion]:
    """Generate concrete fix suggestions"""
    
    suggestions = []
    
    if "null" in root_cause.lower():
        suggestions.append(FixSuggestion(
            suggestion="Add null check before accessing variable",
            diff_patch=f"""
--- a/handlers/handler.go
+++ b/handlers/handler.go
@@ -10,6 +10,9 @@
 func Handler(c *gin.Context) {{
     var data RequestData
     c.ShouldBindJSON(&data)
+    if data.Field == nil {{
+        c.JSON(400, gin.H{{"error": "field is required"}})
+        return
+    }}
     // process data
 }}
""",
            files_to_modify=[f"services/{service}/handlers/handler.go"],
            confidence=0.85,
            test_command="go test ./...",
            commit_message=f"fix: add null check to prevent panic in {service}"
        ))
    
    elif "database" in root_cause.lower():
        suggestions.append(FixSuggestion(
            suggestion="Add database connection retry logic and timeout",
            diff_patch=f"""
--- a/db/connection.go
+++ b/db/connection.go
@@ -5,7 +5,12 @@
 
 func Connect() (*sql.DB, error) {{
-    return sql.Open("postgres", dsn)
+    db, err := sql.Open("postgres", dsn)
+    if err != nil {{
+        return nil, err
+    }}
+    db.SetMaxOpenConns(25)
+    db.SetConnMaxLifetime(5 * time.Minute)
+    return db, db.Ping()
 }}
""",
            files_to_modify=[f"services/{service}/db/connection.go"],
            confidence=0.75,
            test_command="go test ./db/...",
            commit_message=f"fix: improve database connection handling in {service}"
        ))
    
    else:
        suggestions.append(FixSuggestion(
            suggestion="Add error logging and graceful error handling",
            diff_patch="Manual review required - complex fix",
            files_to_modify=[],
            confidence=0.50,
            commit_message=f"fix: improve error handling in {service}"
        ))
    
    return suggestions

def determine_severity(http_status: Optional[int]) -> str:
    if http_status and http_status >= 500:
        return "HIGH - Server error affecting users"
    elif http_status and http_status >= 400:
        return "MEDIUM - Client error, may indicate validation issue"
    else:
        return "LOW - Non-critical issue"

async def get_db_conn():
    """Get database connection pool"""
    conn = await asyncpg.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "yeelo_homeopathy")
    )
    try:
        yield conn
    finally:
        await conn.close()
