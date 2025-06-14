# models.py 파일 시작 부분 (수정 버전)

# 파일 경로 관련 모듈 임포트
import os

# SQLAlchemy 관련 모듈 임포트
from sqlalchemy import Float, UniqueConstraint # <--- UniqueConstraint 임포트 확인
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker



# --- 데이터베이스 파일 경로 설정 ---
# 이 파일(models.py)이 위치한 디렉토리 경로를 가져옵니다.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# 데이터베이스 파일 경로를 완성합니다. 프로젝트 루트 폴더에 'db.sqlite3' 파일이 생성됩니다.
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'restarant.db')}"

# --- SQLAlchemy ORM 기본 설정 ---
# SQLAlchemy에서 파이썬 클래스가 데이터베이스 테이블과 매핑될 것임을 선언하는 기본 클래스입니다.
Base = declarative_base()

# --- 데이터 모델 클래스 정의 ---
# 인스타그램 게시글 데이터를 저장할 테이블 구조를 정의하는 파이썬 클래스입니다.
class mapinformation(Base):
    # __tablename__ 속성은 이 클래스가 매핑될 데이터베이스 테이블의 이름을 지정합니다.
    __tablename__ = 'mapinformation'

    # 컬럼 정의

    # 'id' 컬럼: 정수 타입, 기본 키, 자동으로 고유한 값 할당 (Primary Key)
    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text)
    area = Column(Text, index=True)  # 지역 정보, 예: 경산시 하양읍
    # 'category' 컬럼: 게시글이 속하는 카테고리 정보를 저장합니다. 예: 음식, 여행 등.
    category = Column(String)
    address2 = Column(String,index=True)
    reviewnum = Column(String)
    rating = Column(String)

   
    __table_args__ = (
        UniqueConstraint('name', 'address2', name='_name_address_uc'),
    )
    # 객체를 print() 등으로 출력했을 때 어떤 형태로 보일지 정의하는 메서드 (텍스트 위주로 수정)
    def __repr__(self):
        # text_content 내용의 일부를 포함하여 출력
        return f"<InstagramPost(id={self.id}, name='{self.name}...', address='{self.address2}...')>"


# --- 데이터베이스 엔진 및 테이블 생성 ---

# 데이터베이스 연결 엔진 생성
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Base에 정의된 모든 모델(클래스)에 해당하는 테이블들을 데이터베이스에 생성합니다.
# db.sqlite3 파일을 삭제한 상태이므로, 이 명령이 instagram_posts 테이블을 새로 생성합니다.
Base.metadata.create_all(engine)

# 테이블 생성이 완료되었음을 알리는 메시지 출력
print(f"데이터베이스 '{DATABASE_URL}' 및 테이블 '{mapinformation.__tablename__}' 생성이 완료되었습니다.")


# --- 데이터베이스 세션 관리 설정 ---
# 데이터베이스 세션을 생성하는 팩토리를 설정합니다. 세션은 DB와 실제로 상호작용하는 객체입니다.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 데이터베이스 세션을 얻기 위한 유틸리티 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# models.py 파일 끝 부분