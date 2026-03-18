from datetime import datetime
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Literal, Optional


VALID_LEVELS = {"easy", "medium", "hard"}
VALID_BLOCK_TYPES = {"text", "formula", "example", "image", "divider"}
VALID_AUDIENCE = {"all", "active", "inactive", "by_level"}


def _looks_like_valid_latex(value: str) -> bool:
    if not value:
        return True
    return value.count("{") == value.count("}") and value.count("$") % 2 == 0


class AdminLoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=4, max_length=128)


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PaginationMeta(BaseModel):
    total: int
    page: int
    page_size: int


class DashboardStatResponse(BaseModel):
    total_users: int
    total_problems: int
    total_tests: int
    active_today: int
    new_users_per_day: list[dict]
    problems_solved_per_topic: list[dict]
    recent_registrations: list[dict]


class ProblemAdminBase(BaseModel):
    topic: str = Field(min_length=2, max_length=120)
    question: str = Field(min_length=5)
    formula: Optional[str] = None
    correct_answer: str = Field(min_length=1, max_length=200)
    solution: Optional[str] = None
    difficulty: str = Field(default="easy")
    tags: list[str] = Field(default_factory=list)

    @field_validator("difficulty")
    @classmethod
    def validate_level(cls, v: str):
        if v not in VALID_LEVELS:
            raise ValueError("Деңгей easy/medium/hard болуы тиіс")
        return v

    @field_validator("formula")
    @classmethod
    def validate_formula(cls, v: Optional[str]):
        if v and not _looks_like_valid_latex(v):
            raise ValueError("LaTeX формуласы қате")
        return v


class ProblemAdminCreate(ProblemAdminBase):
    pass


class ProblemAdminUpdate(BaseModel):
    topic: Optional[str] = Field(default=None, min_length=2, max_length=120)
    question: Optional[str] = Field(default=None, min_length=5)
    formula: Optional[str] = None
    correct_answer: Optional[str] = Field(default=None, min_length=1, max_length=200)
    solution: Optional[str] = None
    difficulty: Optional[str] = None
    tags: Optional[list[str]] = None

    @field_validator("difficulty")
    @classmethod
    def validate_level(cls, v: Optional[str]):
        if v and v not in VALID_LEVELS:
            raise ValueError("Деңгей easy/medium/hard болуы тиіс")
        return v

    @field_validator("formula")
    @classmethod
    def validate_formula(cls, v: Optional[str]):
        if v and not _looks_like_valid_latex(v):
            raise ValueError("LaTeX формуласы қате")
        return v


class ProblemAdminOut(BaseModel):
    id: int
    topic: str
    question: str
    formula: Optional[str]
    correct_answer: str
    solution: Optional[str]
    difficulty: str
    tags: list[str]

    model_config = {"from_attributes": True}


class ProblemsListResponse(BaseModel):
    items: list[ProblemAdminOut]
    meta: PaginationMeta


class TestAdminBase(BaseModel):
    topic: str = Field(min_length=2, max_length=120)
    question: str = Field(min_length=5)
    option_a: str = Field(min_length=1)
    option_b: str = Field(min_length=1)
    option_c: str = Field(min_length=1)
    option_d: str = Field(min_length=1)
    correct_option: Literal["A", "B", "C", "D"]
    explanation: Optional[str] = None


class TestAdminCreate(TestAdminBase):
    pass


class TestAdminUpdate(BaseModel):
    topic: Optional[str] = Field(default=None, min_length=2, max_length=120)
    question: Optional[str] = Field(default=None, min_length=5)
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_option: Optional[Literal["A", "B", "C", "D"]] = None
    explanation: Optional[str] = None


class TestAdminOut(BaseModel):
    id: int
    topic: str
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    explanation: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class TestsListResponse(BaseModel):
    items: list[TestAdminOut]
    meta: PaginationMeta


class TheoryBlock(BaseModel):
    type: str
    content: Optional[str] = ""

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str):
        if v not in VALID_BLOCK_TYPES:
            raise ValueError("Блок типі жарамсыз")
        return v

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: Optional[str], info):
        if info.data.get("type") == "formula" and v and not _looks_like_valid_latex(v):
            raise ValueError("Формула блогындағы LaTeX қате")
        return v


class TheoryTopicOut(BaseModel):
    topic_id: str
    title: str
    blocks: list[TheoryBlock]
    updated_at: datetime

    model_config = {"from_attributes": True}


class TheoryUpdateRequest(BaseModel):
    title: Optional[str] = None
    blocks: list[TheoryBlock]


class UserAdminOut(BaseModel):
    id: int
    telegram_id: int
    username: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    level: str
    score: int
    streak: int
    is_active: bool
    is_banned: bool
    notifications_enabled: bool
    last_activity: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class UsersListResponse(BaseModel):
    items: list[UserAdminOut]
    meta: PaginationMeta


class UserProfileResponse(BaseModel):
    user: UserAdminOut
    tests_summary: dict
    progress_summary: dict


class ToggleFlagResponse(BaseModel):
    status: str
    value: bool


class BroadcastRequest(BaseModel):
    audience: str
    level: Optional[str] = None
    message: str = Field(min_length=2, max_length=4096)

    @field_validator("audience")
    @classmethod
    def validate_audience(cls, v: str):
        if v not in VALID_AUDIENCE:
            raise ValueError("Аудитория параметрі қате")
        return v

    @field_validator("level")
    @classmethod
    def validate_level(cls, v: Optional[str]):
        if v and v not in VALID_LEVELS:
            raise ValueError("Деңгей easy/medium/hard болуы тиіс")
        return v

    @model_validator(mode="after")
    def level_for_by_level(self):
        if self.audience == "by_level" and not self.level:
            raise ValueError("by_level үшін level міндетті")
        return self


class BroadcastResponse(BaseModel):
    status: str
    total_targets: int
    delivered: int
    failed: int


class BroadcastHistoryOut(BaseModel):
    id: int
    audience: str
    audience_level: Optional[str]
    message: str
    total_targets: int
    delivered: int
    failed: int
    created_at: datetime

    model_config = {"from_attributes": True}


class BulkImportResponse(BaseModel):
    created: int
    errors: list[dict]
