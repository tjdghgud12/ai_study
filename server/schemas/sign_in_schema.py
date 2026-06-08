from schemas.base_schema import BaseSchema


class SignInRequestSchema(BaseSchema):
    id: str
    password: str


class signInResponseBaseSchema(BaseSchema):
    id: str


class SignInResponseSchema(signInResponseBaseSchema):
    access_token: str


class SignInWithTokenResponseSchema(signInResponseBaseSchema):
    pass
