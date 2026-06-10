from sqlalchemy import Column, DateTime, String, func

from db.base import Base


class User(Base):
    __tablename__ = "users"
    index = Column(String, primary_key=True)
    id = Column(String, primary_key=True)
    password_hash = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now())
