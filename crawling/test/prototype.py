from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, StaleElementReferenceException, WebDriverException
from selenium.webdriver.chrome.service import Service
from sqlalchemy.exc import IntegrityError

import time
import urllib.parse
import json
import re

# --- 데이터베이스 관련 모듈 임포트 ---
try:
    from model_proto import InstagramPost, SessionLocal, create_db_tables
    print("데이터베이스 모델, 세션, 테이블 생성 함수 임포트 성공.")
    DB_ENABLED = True
except ImportError:
    print("DB 관련 모듈 임포트 실패. DB 저장 기능 비활성화.")
    DB_ENABLED = False
    InstagramPost, SessionLocal, create_db_tables = None, None, None

# --- 설정 ---
CHROMEDRIVER_PATH = 'C:/Users/a/Desktop/programming language/chromedriver-win64/chromedriver.exe'
CHROME_BINARY_LOCATION = 'C:/Users/a/Desktop/programming language/chrome-win64/chrome.exe'

INSTAGRAM_USERNAME = 'matspotproject@gmail.com'
INSTAGRAM_PASSWORD = 'akttmvkt11!!'

TARGET_HASHTAG = "포항카페"
NUM_CONTENTS_TO_EXTRACT = 500
SCROLL_ATTEMPTS_PER_CYCLE = 1
SCROLL_PAUSE_TIME = 4

ELEMENT_WAIT_TIMEOUT = 15
INITIAL_PAGE_LOAD_TIME = 8
MANUAL_VERIFICATION_WAIT_TIME = 60

# --- 유틸리티 함수 ---
def handle_popups(driver): # 이전 버전으로 복원된 함수
    """로그인 후 나타날 수 있는 팝업들을 처리합니다."""
    print("로그인 후 팝업 처리 시도...")
    popups_config = [
        # 인스타그램 UI 언어 설정에 따라 '나중에 하기', 'Not Now' 또는 유사한 텍스트로 변경될 수 있습니다.
        # XPath에 or 조건을 사용하여 여러 가능성을 포함시키는 것이 좋습니다.
        {"name": "로그인 정보 저장", "xpath": "//button[text()='나중에 하기'] | //button[text()='Not Now'] | //div[@role='button' and (contains(text(),'나중에 하기') or contains(text(),'Not Now'))]"},
        {"name": "알림 설정", "xpath": "//button[text()='나중에 하기'] | //button[text()='Not Now'] | //div[@role='button' and (contains(text(),'나중에 하기') or contains(text(),'Not Now'))]"} # 알림 팝업도 유사한 텍스트 사용
    ]
    for popup in popups_config:
        try:
            button = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, popup["xpath"]))
            )
            print(f"'{popup['name']}' 팝업 버튼 클릭.")
            button.click()
            time.sleep(2)
            return True  # 팝업 처리 후 함수 종료
        except TimeoutException:
            print(f"'{popup['name']}' 팝업 없음 또는 시간 초과.")
        except Exception as e: # NoSuchElementException 등 다른 예외도 포함 가능
            print(f"'{popup['name']}' 팝업 처리 중 오류 발생: {e}")
    print("팝업 처리 시도 완료.")


def login_instagram(driver, username, password):
    print("인스타그램 로그인 시도...")
    driver.get("https://www.instagram.com/accounts/login/")
    try:
        WebDriverWait(driver, ELEMENT_WAIT_TIMEOUT).until(
            EC.presence_of_element_located((By.NAME, 'username'))
        ).send_keys(username)
        driver.find_element(By.NAME, 'password').send_keys(password)
        WebDriverWait(driver, ELEMENT_WAIT_TIMEOUT).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, 'button[type="submit"]'))
        ).click()
        print("로그인 정보 입력 및 버튼 클릭 완료.")
        # 로그인 후 팝업 처리 함수 호출
        handle_popups(driver)
        # 로그인 성공 여부 확인을 위한 대기
        WebDriverWait(driver, ELEMENT_WAIT_TIMEOUT).until(
            EC.url_changes("https://www.instagram.com/accounts/login/")
        )
        if ("instagram.com" in driver.current_url and
            not driver.current_url.startswith("https://www.instagram.com/accounts/login/")):
            print(f"로그인 성공 추정. 현재 URL: {driver.current_url}")
            return True
        
    except TimeoutException:
        print(f"로그인 시간 초과 또는 필수 요소 못 찾음. 현재 URL: {driver.current_url}")
        # 로그인 실패 시에도 팝업이 뜰 수 있는 경우가 있는지 확인 (예: onetap 페이지)
        if "/onetap/" in driver.current_url:
            print("Onetap 페이지 감지. 팝업 처리 후 재시도 가능성 있음.")
            handle_popups(driver) # Onetap 페이지의 팝업 처리 시도
            # 재시도 로직은 복잡하므로 여기서는 실패로 간주하거나,
            # handle_popups 후 URL을 다시 체크하는 로직 추가 필요
        return False
    except Exception as e:
        print(f"로그인 중 오류 발생: {e}")
        return False

def scroll_down_for_more_posts(driver, num_scrolls=SCROLL_ATTEMPTS_PER_CYCLE):
    # (이전 답변의 간소화된 버전과 동일)
    print(f"페이지 스크롤 시도 (최대 {num_scrolls}회)...")
    last_height = driver.execute_script("return document.body.scrollHeight")
    new_content_loaded = False
    for i in range(num_scrolls):
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(SCROLL_PAUSE_TIME)
        new_height = driver.execute_script("return document.body.scrollHeight")
        if new_height > last_height:
            print(f"  스크롤 {i+1}: 새 콘텐츠 로드됨.")
            last_height = new_height
            new_content_loaded = True
        else:
            print(f"  스크롤 {i+1}: 페이지 높이 변화 없음.")
            break
    return new_content_loaded

#- 1. Alt 텍스트 파싱 함수 ---
def parse_alt_text_for_content(alt_text_string, post_url=None):
    """
    주어진 alt 텍스트 문자열에서 캡션과 해시태그를 파싱합니다.
    post_url은 선택적으로 받아 DB 저장 시 사용합니다.
    """
    if not alt_text_string:
        return None
    potential_hashtag_blobs = re.findall(r"#\S+", alt_text_string)
    extracted_hashtags = []
    for blob in potential_hashtag_blobs:
        individual_tags_in_blob = blob.lstrip('#').split('#')
        for tag_text in individual_tags_in_blob:
            if tag_text:
                extracted_hashtags.append(f"#{tag_text}")

    text_content = alt_text_string
    for ht in extracted_hashtags:
        text_content = text_content.replace(ht, "")

    text_content = text_content.replace('\n', ' ').strip()
    text_content = re.sub(r'\s*-\s*', ' ', text_content).strip()
    text_content = re.sub(r'^\s*-\s*|-?\s*$', '', text_content).strip()
    text_content = re.sub(r'\s+', ' ', text_content).strip()

    final_caption = text_content.strip() if text_content.strip() else None

    if not final_caption and not extracted_hashtags:
        return None
    
    return {
        "caption": final_caption,
        "hashtags": extracted_hashtags,
        "url": post_url
    }

def extract_and_save_posts_from_grid(driver, target_hash, num_posts_to_collect):
    # (이전 답변의 간소화된 버전과 거의 동일, 핵심 로직 유지)
    driver.get(f"https://www.instagram.com/explore/tags/{urllib.parse.quote(target_hash)}/")
    print(f"해시태그 '{target_hash}' 페이지 접속 완료.")
    time.sleep(INITIAL_PAGE_LOAD_TIME)

    collected_count = 0
    processed_urls = set()
    collected_data=[]
    new_posts_in_iteration = 0
    no_new_posts_streak = 0
    db = SessionLocal() if DB_ENABLED and SessionLocal else None
    

    
    TARGET_DIV_INSIDE_A_XPATH = ".//div[contains(@class, '_aagv')]" # <a> 태그 내부에서 이 div를 찾음
    IMG_INSIDE_TARGET_DIV_XPATH = ".//img" # 위 div 내부에서 img를 찾음
    
   

    POST_LINK_SELECTOR = 'a[href*="/p/"], a[href*="/reel/"]' # 게시물 또는 릴스 링크
    try:
     WebDriverWait(driver, ELEMENT_WAIT_TIMEOUT).until(
         EC.presence_of_all_elements_located((By.CSS_SELECTOR, POST_LINK_SELECTOR))
     )
     print("페이지 내 게시물 링크 후보 감지됨.")
    except TimeoutException:
        print(f"시간 초과: '{POST_LINK_SELECTOR}' 선택자로 썸네일 <a> 태그를 찾을 수 없습니다.")
        return []
        
    
    
    while collected_count < num_posts_to_collect:
       
        ordered_unique_link_elements = []
        
        try:
            WebDriverWait(driver, ELEMENT_WAIT_TIMEOUT).until(
                EC.presence_of_all_elements_located((By.CSS_SELECTOR, POST_LINK_SELECTOR))
            )
            thumbnail_links = driver.find_elements(By.CSS_SELECTOR, POST_LINK_SELECTOR) # 썸네일 링크를 찾음
            print(f"현재 DOM에서 {len(thumbnail_links)}개의 썸네일 링크 발견.")

            if not thumbnail_links and collected_count == 0 :
                print("페이지에서 초기 썸네일 링크를 찾을 수 없습니다. 중단합니다.")
                break

            for link_el in thumbnail_links:
                if collected_count >= num_posts_to_collect: break
                try:
                    post_url = link_el.get_attribute('href') # <a> 태그의 href 속성에서 URL을 추출
                    if post_url and (post_url.startswith("https://www.instagram.com/p/") or post_url.startswith("https://www.instagram.com/reel/")) and post_url not in processed_urls:
                      ordered_unique_link_elements.append(link_el) # 중복되지 않는 링크만 추가
                except NoSuchElementException:
                    print("  NoSuchElementException: 해당 썸네일 링크에서 URL을 찾을 수 없음.")
                    continue
                
            
            if not ordered_unique_link_elements : # 중복된 링크가 없거나 찾을 수 없는 경우
                return []
            
            count = 0
            print(f"현재 DOM에서 {len(ordered_unique_link_elements)}개의 게시글 추출시도.")
            for link_save in ordered_unique_link_elements:
                if collected_count >= num_posts_to_collect: break
                count += 1
                print(f"{count}/{len(ordered_unique_link_elements)}: 게시물 링크 추출 시도...")

                post_url_tag = None
                try:
                    post_url_tag = link_save.get_attribute('href') 
                    if not post_url_tag: continue
                    try:
                        div_aagv_element = link_save.find_element(By.XPATH, TARGET_DIV_INSIDE_A_XPATH)
                    except NoSuchElementException: continue   

                    try:
                        img_el = div_aagv_element.find_element(By.XPATH, IMG_INSIDE_TARGET_DIV_XPATH) 
                        alt_text = img_el.get_attribute('alt')
                    except NoSuchElementException: continue

                    if alt_text:
                        parsed_data = parse_alt_text_for_content(alt_text, post_url_tag)
                        if parsed_data:
                            collected_data.append(parsed_data)  # 1. 파싱된 데이터를 리스트에 저장
                            collected_count += 1
                              
                    else:
                        print("  NoSuchElementException: alt 텍스트를 찾을 수 없음.")
                        continue
                    processed_urls.add(post_url_tag)   #중복된 URL을 처리하기 위해 추가  

                except StaleElementReferenceException:
                    print("  StaleElementReferenceException: 해당 썸네일 스킵.")
                    continue
                

                if not post_url:
                    print("  NoSuchElementException: 해당 썸네일 링크에서 URL을 찾을 수 없음.")
                    continue

                if post_url in processed_urls:
                    print(f"  이미 처리된 URL: {post_url}. 스킵합니다.")
                    continue

                print(f"  게시물 URL: {post_url}")

              

                

                if parsed_data:
                    print(f"  추출: {parsed_data['url'][:50]}... (캡션: {(parsed_data['caption'] or '')[:20]}...)")
                    if db:
                        try:
                            hashtags_json = json.dumps(parsed_data["hashtags"], ensure_ascii=False) if parsed_data["hashtags"] else None
                            new_post = InstagramPost(
                                instagram_post_url=parsed_data["url"],
                                caption_text=parsed_data["caption"],
                                hashtags_representation=hashtags_json
                            )
                            db.add(new_post)
                            db.commit()
                            print(f"DB 저장 성공.")
                            
                            new_posts_in_iteration += 1
                        except IntegrityError:
                            db.rollback()
                            print(f"    이미 DB에 존재하거나 저장 실패 (IntegrityError): {parsed_data['url']}")
                        except Exception as e_db_save:
                            db.rollback()
                            print(f"    DB 저장 중 기타 오류: {e_db_save}")
                    elif not DB_ENABLED:
                        
                        new_posts_in_iteration += 1
        except StaleElementReferenceException:
                print("  StaleElement - 해당 썸네일 스킵.")
                continue
        except Exception as e_inner:
                print(f"  개별 썸네일 처리 중 오류: {e_inner}")

        if new_posts_in_iteration == 0 and thumbnail_links:
                no_new_posts_streak +=1
                print(f"이번 DOM 탐색에서 새로운 게시물을 찾지 못했습니다. (연속 {no_new_posts_streak}회)")
        else:
                no_new_posts_streak = 0
            
            
        scroll_down_for_more_posts(driver, SCROLL_ATTEMPTS_PER_CYCLE) # 스크롤 시도
       

        if collected_count < num_posts_to_collect:
            if not scroll_down_for_more_posts(driver, SCROLL_ATTEMPTS_PER_CYCLE):
                print("스크롤해도 페이지 변화 없음. 크롤링 종료.")
                break
            

    if db: db.close(); print("DB 세션 종료.")
    print(f"--- 그리드 뷰 게시물 추출 완료 (총 {collected_count}개 수집) ---")

# --- 메인 실행 ---
if __name__ == "__main__":
    driver = None
    print("--- Instagram 콘텐츠 크롤링 (그리드 뷰, 스크롤) 시작 ---")

    if DB_ENABLED and create_db_tables:
        try: create_db_tables(); print("DB 테이블 확인/생성 완료.")
        except Exception as e: DB_ENABLED = False; print(f"DB 테이블 생성 오류: {e}. DB 비활성화.")

    try:
        options = webdriver.ChromeOptions()
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        if CHROME_BINARY_LOCATION: options.binary_location = CHROME_BINARY_LOCATION
        service = Service(CHROMEDRIVER_PATH)
        driver = webdriver.Chrome(service=service, options=options)
        print("WebDriver 실행 완료.")

        if login_instagram(driver, INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD):
            print("로그인 성공.")
            extract_and_save_posts_from_grid(driver, TARGET_HASHTAG, NUM_CONTENTS_TO_EXTRACT)
        else:
            print("로그인 실패. 크롤링 중단.")

    except WebDriverException as e_wd: print(f"WebDriver 오류: {e_wd}")
    except Exception as e_main: print(f"메인 스크립트 오류: {e_main}")
    finally:
        if driver: driver.quit(); print("WebDriver 종료.")
        print("--- 크롤링 프로세스 종료 ---")