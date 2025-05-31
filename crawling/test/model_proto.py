# model_proto.py

import os
from sqlalchemy import create_engine, Column, Integer, String, Text # DateTime 임포트 제거
from sqlalchemy.orm import declarative_base # SQLAlchemy 1.4+
from sqlalchemy.orm import sessionmaker
# from sqlalchemy.sql import func # server_default=func.now() 사용 안 하므로 임포트 제거

# --- 1. 데이터베이스 설정 ---
DEFAULT_SQLITE_DB_FILE = "finally.db" # 원하시는 DB 파일명으로 변경 가능
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///./{DEFAULT_SQLITE_DB_FILE}")

engine_args = {}
if DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# --- 2. Instagram 게시물 모델 정의 ---
class InstagramPost(Base):
    __tablename__ = "instagram_posts"

    id = Column(Integer, primary_key=True, index=True)
    instagram_post_url = Column(String(512), unique=True, index=True, nullable=False)
    caption_text = Column(Text, nullable=True)
    hashtags_representation = Column(Text, nullable=True) # 예: '["#태그1", "#태그2"]'
    # crawled_at 필드 제거됨

    def __repr__(self):
        # crawled_at이 없으므로 __repr__에서도 해당 부분 제거
        return (f"<InstagramPost(id={self.id}, "
                f"url='{self.instagram_post_url}', "
                f"caption='{(self.caption_text or '')[:30]}...', "
                f"hashtags='{(self.hashtags_representation or '')[:30]}...')>")


# --- 3. 데이터베이스 테이블 생성 함수 ---
def create_db_tables():
    """
    SQLAlchemy 모델 정의에 따라 데이터베이스에 테이블을 생성합니다.
    테이블이 이미 존재하면, 스키마 변경이 없는 한 아무 작업도 수행하지 않습니다.
    """
    try:
        print(f"데이터베이스({DATABASE_URL})에 테이블 생성을 시도합니다...")
        Base.metadata.create_all(bind=engine)
        print("테이블 생성 또는 확인 완료.")
    except Exception as e:
        print(f"데이터베이스 테이블 생성 중 심각한 오류 발생: {e}")


# --- 4. 이 파일을 직접 실행했을 때 테이블 생성 테스트 ---
if __name__ == "__main__":
    print("model_proto.py가 직접 실행되었습니다.")
    print(f"데이터베이스 URL: {DATABASE_URL}")
    
    create_db_tables() # 테이블 생성 함수 호출

    print("\n테이블 생성 시도 후, 데이터베이스 파일 또는 서버를 확인해보세요.")
    if DATABASE_URL.startswith("sqlite"):
        print(f"SQLite를 사용하는 경우, 현재 디렉터리에 '{DEFAULT_SQLITE_DB_FILE}' 파일이 생성되었거나 업데이트되었을 것입니다.")