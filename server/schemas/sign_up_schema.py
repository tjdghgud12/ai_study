from schemas.base_schema import BaseSchema


class SignUpRequestSchema(BaseSchema):
    id: str
    password: str


class SignUpResponseSchema(BaseSchema):
    id: str


class CheckDuplicateIdRequestSchema(BaseSchema):
    id: str


class CheckDuplicateIdResponseSchema(BaseSchema):
    is_duplicate: bool
