# 필요 라이브러리 설치
# pip install selenium pandas openpyxl webdriver-manager

import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from model import SessionLocal
from model import mapinformation

# --- 데이터베이스 관련 모듈 임포트 ---
try:
    from model import mapinformation, SessionLocal
    print("데이터베이스 모델, 세션, 테이블 생성 함수 임포트 성공.")
    DB_ENABLED = True
except ImportError:
    print("DB 관련 모듈 임포트 실패. DB 저장 기능 비활성화.")
    DB_ENABLED = False
    mapinformation, SessionLocal = None, None

# 1. 크롤링할 지역 리스트 정의
# 경산시의 모든 읍/면/동을 여기에 넣습니다.

GYEONGSAN_AREAS = [
    

    "유곡동", "여천동", "갑제동", "대정동",
]

SEARCH_KEYWORD = "음식점"
Search_Area = "경산시"


# --- 설정 ---
CHROMEDRIVER_PATH = 'C:/Users/a/Desktop/programming language/chromedriver-win64/chromedriver.exe' # 크롬 드라이버 경로
CHROME_BINARY_LOCATION = 'C:/Users/a/Desktop/programming language/chrome-win64/chrome.exe' # 크롬 브라우저 실행 파일 경로



def setup_driver():
    """지정된 경로의 로컬 드라이버와 브라우저를 사용해 셀레니움 드라이버를 설정하는 함수"""
    options = webdriver.ChromeOptions()
    
    # ★★★ [수정] 크롬 브라우저의 실행 파일 경로를 지정합니다. ★★★
    options.binary_location = CHROME_BINARY_LOCATION
    
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
    options.add_argument("--start-maximized")
    # options.add_argument("--headless")
    
    # ★★★ [수정] 크롬 드라이버의 실행 파일 경로를 Service 객체에 전달합니다. ★★★
    service = Service(executable_path=CHROMEDRIVER_PATH)
    
    # ★★★ [수정] service와 options를 사용해 드라이버 객체를 생성합니다. ★★★
    driver = webdriver.Chrome(service=service, options=options)
    
    # ★★★ [수정] 생성된 드라이버 객체를 반환합니다. ★★★
    return driver
    
def switch_frame(frame): #중요요
    driver.switch_to.default_content()  # frame 초기화
    driver.switch_to.frame(frame)  # frame 변경    

def crawl_places(driver, area):
    
    search_query = f"{Search_Area} {area} {SEARCH_KEYWORD}"
    print(f"--- '{search_query}' 검색 시작 ---")
    
    # 네이버버맵 검색 URL로 이동
    naver_map_search_url = f"https://map.naver.com/p/search/{search_query}"
    driver.get(naver_map_search_url)
    
    time.sleep(5)  # 페이지 로딩 대기
    print(" - 페이지 로딩 완료, 스크롤 시작")

    db = SessionLocal()
    page_num = 1
    while True:
        print(f" - {page_num}페이지 크롤링 중...")
        
        # 현재 페이지의 가게 목록 가져오기
        # ★★★ 이 부분이 가장 중요! 웹사이트 구조가 바뀌면 여기를 수정해야 합니다. ★★★
        # frame 변경 메소드
        switch_frame("searchIframe") 
        try:
            # ★★★ 스크롤 가능한 요소를 찾습니다. ★★★
            scrollable_element = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "Ryr1F"))
            )
        
            last_height = driver.execute_script("return arguments[0].scrollHeight", scrollable_element)
            while True:
                driver.execute_script("arguments[0].scrollTop += 600;", scrollable_element)
                time.sleep(1)
                new_height = driver.execute_script("return arguments[0].scrollHeight", scrollable_element)
                if new_height == last_height:
                    print(" - 스크롤 끝에 도달했습니다.")
                    break
                last_height = new_height
        except TimeoutException:
            print(" - 스크롤 가능한 요소를 찾을 수 없습니다. 페이지 구조가 변경되었을 수 있습니다.")
            break        
        print(" - 스크롤 완료 크롤링 시작")
        try:
            place_elements = driver.find_elements(By.CSS_SELECTOR, "li.UEzoS.rTjJo")
            print(" - %d개의 가게 정보를 찾았습니다." % len(place_elements))
        except NoSuchElementException:
            print(" - 가게 목록을 찾을 수 없습니다.")
            
        item_count_on_page = len(driver.find_elements(By.CSS_SELECTOR, "li.UEzoS.rTjJo"))
        
        
        for i in range(item_count_on_page):
            place_elements = driver.find_elements(By.CSS_SELECTOR, "li.UEzoS.rTjJo")
            try:
                    place = place_elements[i]
                    link_selector = "a.place_bluelink.N_KDL.CtW3e"
                    target_link = place.find_element(By.CSS_SELECTOR, link_selector)
                    target_link.click()  # 가게 상세 페이지로 이동
                    print(" - 가게 상세 페이지로 이동 중...")
                    time.sleep(3)  # 상세 페이지 로딩 대기
            
                    driver.switch_to.default_content() 
                    entry_iframe_selector = (By.ID, "entryIframe")  
                    WebDriverWait(driver, 8).until(
                        EC.frame_to_be_available_and_switch_to_it(entry_iframe_selector)
                    )
                    print(" - 상세 정보 iframe(entryIframe)으로 성공적으로 전환했습니다.")     
                    
                    info_container = WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, "div.zD5Nm"))
                    )
                    print(" - 상세 정보 패널(info_container) 요소를 찾았습니다.")
            except (NoSuchElementException, IndexError):
                    print(f"   -> {i+1}번째 아이템은 가게 정보가 아니거나 클릭할 수 없어 건너뜁니다.")
                    continue

           
            try:
                # 가게 이름, 주소, 카테고리, 리뷰 수 등을 추출합니다.
                place_name = info_container.find_element(By.CSS_SELECTOR, "span.GHAhO").text
                print(f"   -> 상세 정보: 가게 이름 '{place_name}' 획득")
            
                try:
                    address = driver.find_element(By.CSS_SELECTOR, "span.LDgIH").text
                    print(f"   -> 주소: '{address}'")
                except:
                    print("   -> 주소를 찾지 못함")
                    address =  None

                try:
                    category = info_container.find_element(By.CSS_SELECTOR, "span.lnJFt").text
                    print(f"   -> 상세 정보: 카테고리 '{category}' 획득")
                except:
                    category =  None

                try:
                    review_link_selector = "a[href*='/review/visitor']" # '방문자 리뷰' 링크를 찾음
                    review_element = driver.find_element(By.CSS_SELECTOR, review_link_selector)
                    full_text = review_element.text  # "방문자 리뷰 377"
                
                # 텍스트에서 숫자만 추출
                    digits_only = "".join(filter(str.isdigit, full_text))
                    if digits_only:
                        reviewnum = int(digits_only)
                        print(f"   -> 상세 정보: 리뷰 수 {reviewnum}개 획득")
                except:
                    print("   -> 상세 정보: 리뷰 수를 찾지 못함")
                    reviewnum = 0
                try: rating = float(place.find_element(By.CSS_SELECTOR, "em.num").text)
                except: rating = 0.0

            
            # ★★★ 2. 추출한 정보를 출력합니다. ★★★
                existing_item = db.query(mapinformation).filter_by(name=place_name, address2=address).first()
                print(f" - DB 중복 확인: {place_name} / {address}")
                # 3. 중복 데이터가 없으면 새로 추가합니다.
                if not existing_item:
                        print(f" - 신규 데이터 발견: {place_name} / {address}")
                        db_item = mapinformation(
                            area=area, name=place_name, category=category,
                            address2=address, rating=rating, reviewnum=reviewnum
                    )
                        # ★★★ 3. DB에 추가할 아이템을 생성합니다. ★★★
                        db.add(db_item)
                        print(f" -> 신규 데이터 추가 준비: {place_name}")
                        db.commit()  # 즉시 커밋
                else:
                        print(f" - 중복 데이터 발견: {place_name} / {address}") 
                        
     
            except Exception as e:
                print(f" - 오류 발생: {e}")
            finally:
                # ★★★ 5. 상세 페이지에서 나와서 목록 페이지로 돌아갑니다. ★★★
                print(f"   -> 목록 페이지로 복귀.")
                driver.back()  # 목록 페이지로 돌아가기
                time.sleep(2)
                # ★★★ 6. 목록 페이지로 돌아온 후, 다시 iframe으로 전환합니다. ★★★
                driver.switch_to.default_content()
                WebDriverWait(driver, 10).until(EC.frame_to_be_available_and_switch_to_it("searchIframe"))
                WebDriverWait(driver, 10).until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "li.UEzoS.rTjJo")))
                    
        
        
        try:
            switch_frame("searchIframe")
            
            pagination_container = driver.find_element(By.CSS_SELECTOR, "div.zRM9F") # 예시: 이전 대화에서 나왔던 컨테이너
            print(" - 페이지네이션 컨테이너 로딩 확인. 다음 페이지로 이동 준비...")
            next_button = pagination_container.find_element(
            By.XPATH, ".//a[contains(@class, 'eUTV2') and .//span[text()='다음페이지']]")
            print(" - 다음 페이지 버튼 찾음")
            page_num += 1
            if next_button.get_attribute('aria-disabled') == 'true':
                print("다음 페이지 버튼이 비활성화되었습니다. 크롤링을 종료합니다.")
                break
            
            svg_button_to_click = next_button.find_element(By.CSS_SELECTOR, "svg.yUtES")
            svg_button_to_click.click()
            print(f" - {page_num}페이지로 이동 완료")
            time.sleep(3)  # 페이지 로딩 대기
        except Exception as e:
            print(f"페이지네이션 오류: {e}")
            break
    db.close()        
    

# --- 메인 실행 로직 ---
if __name__ == "__main__":
    # ★★★ [수정] setup_driver()가 반환하는 driver 객체를 변수에 할당합니다. ★★★
    driver = setup_driver()
    print("크롤링을 시작합니다...")
    for area in GYEONGSAN_AREAS:
        area_results = crawl_places(driver, area)
        time.sleep(3) # 다음 지역 검색 전 IP 차단 방지를 위한 휴식
    
    driver.quit()

  
    