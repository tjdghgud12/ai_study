from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import ENUM

from db.base import Base

message_type_enum = ENUM("user", "ai", name="message_type", create_type=False)


class Messages(Base):
    __tablename__ = "messages"
    index = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    session_id = Column(String, ForeignKey("sessions.id"))
    turn_id = Column(String)
    role = Column(message_type_enum, nullable=False)
    sequence = Column(Integer)
    message = Column(String)
    created_at = Column(DateTime, server_default=func.now())
