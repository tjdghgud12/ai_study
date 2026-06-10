from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func

from db.base import Base


class Sessions(Base):
    __tablename__ = "sessions"
    index = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    id = Column(String, unique=True)
    title = Column(String)
    next_sequence = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now())
