from pydantic import BaseModel, Field


class LoginReq(BaseModel):
    username: str = Field(min_length=2, max_length=64)
    password: str = Field(min_length=4, max_length=128)
