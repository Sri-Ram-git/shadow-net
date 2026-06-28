from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=150)
    username: str = Field(..., min_length=3, max_length=80, pattern=r"^[a-zA-Z0-9_]+$")
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    organization: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=30)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v or "." not in v:
            raise ValueError("Invalid email address")
        return v.lower().strip()


class LoginRequest(BaseModel):
    email: str = Field(...)
    password: str = Field(...)
    remember: bool = False


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 1800


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    full_name: str
    username: str
    email: str
    organization: Optional[str] = None
    role: Optional[str] = None
    profile_image: Optional[str] = None
    status: str
    last_login: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, max_length=150)
    organization: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=30)
    profile_image: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(..., min_length=8, max_length=128)


class LoginLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    login_time: datetime
    logout_time: Optional[datetime] = None
    ip_address: Optional[str] = None
    device_name: Optional[str] = None
    browser: Optional[str] = None
    operating_system: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    login_status: str
    failed_reason: Optional[str] = None

    model_config = {"from_attributes": True}


class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    resource: Optional[str] = None
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserResponse(BaseModel):
    id: str
    full_name: str
    username: str
    email: str
    organization: Optional[str] = None
    role: Optional[str] = None
    status: str
    email_verified: bool
    last_login: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
