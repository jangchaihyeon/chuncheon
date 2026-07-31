"""Streamlit Cloud entry point for the Bomnae Tium demo service.

The Vite/React app is included in this repository for local development.
Streamlit Cloud starts from this file, so this page presents the whole service
first and only opens the transit demo when the user chooses it.
"""

from pathlib import Path
import base64
import runpy

import streamlit as st


ROOT = Path(__file__).parent
TRANSIT_APP = ROOT / "transit_backend" / "streamlit_app_2.py"
LOGO_PATH = ROOT / "public" / "bomnae-logo-transparent-v3.png"
MASCOT_PATH = ROOT / "public" / "bomnae-hero-mascots-cutout.png"
SPROUT_PATH = ROOT / "public" / "growth-stages" / "sprout-transparent.png"


def image_data_uri(path: Path) -> str:
    if not path.exists():
        return ""
    extension = path.suffix.lstrip(".").lower() or "png"
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/{extension};base64,{encoded}"


def inject_styles() -> None:
    st.markdown(
        """
        <style>
        :root {
          --green: #159447;
          --green-dark: #143528;
          --mint: #eef8ed;
          --line: #dfe8dc;
          --text: #14231c;
        }
        .stApp {
          background: #fbfcf8;
          color: var(--text);
        }
        [data-testid="stSidebar"], [data-testid="stHeader"] {
          display: none;
        }
        .block-container {
          max-width: 1180px;
          padding: 28px 36px 60px;
        }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 24px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--green);
          font-weight: 900;
          font-size: 22px;
        }
        .brand img {
          width: 126px;
          height: auto;
          object-fit: contain;
        }
        .pill {
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 9px 14px;
          background: white;
          color: #496057;
          font-size: 14px;
          font-weight: 800;
        }
        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(260px, .75fr);
          align-items: center;
          gap: 28px;
          min-height: 330px;
          margin-bottom: 24px;
          padding: 36px;
          border: 1px solid #e1eadc;
          border-radius: 24px;
          background: linear-gradient(115deg, #f2fbef 0%, #fff9df 100%);
          overflow: hidden;
        }
        .eyebrow {
          color: var(--green);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .08em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        h1 {
          margin: 0;
          color: var(--green-dark);
          font-size: 44px;
          line-height: 1.14;
          letter-spacing: 0;
        }
        .hero p {
          margin: 16px 0 0;
          color: #53645d;
          font-size: 17px;
          line-height: 1.65;
        }
        .mascot img {
          width: min(100%, 360px);
          display: block;
          margin-left: auto;
        }
        .section-title {
          margin: 30px 0 14px;
          color: var(--green-dark);
          font-size: 22px;
          font-weight: 900;
        }
        .profile {
          display: grid;
          grid-template-columns: 150px minmax(0, 1fr);
          gap: 22px;
          padding: 24px;
          border: 1px solid var(--line);
          border-radius: 18px;
          background: white;
          box-shadow: 0 18px 48px rgba(34, 60, 43, .08);
        }
        .avatar {
          display: grid;
          place-items: center;
          min-height: 146px;
          border-radius: 16px;
          background: var(--mint);
        }
        .avatar img {
          width: 92px;
        }
        .profile h2 {
          margin: 0 0 6px;
          font-size: 30px;
          color: var(--green-dark);
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 14px 0 0;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          border-radius: 999px;
          padding: 0 12px;
          background: #edf7ee;
          color: #17653b;
          font-weight: 850;
          font-size: 13px;
        }
        .grid3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        .card {
          min-height: 170px;
          padding: 18px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: white;
        }
        .card b {
          display: block;
          margin-bottom: 8px;
          color: var(--green-dark);
          font-size: 18px;
        }
        .card p {
          margin: 0;
          color: #52655c;
          line-height: 1.55;
          font-size: 14px;
        }
        .record-box {
          padding: 20px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: #ffffff;
        }
        div.stButton > button {
          width: 100%;
          border: 0;
          border-radius: 12px;
          padding: 14px 16px;
          background: #159447;
          color: white;
          font-weight: 900;
          min-height: 48px;
        }
        div.stButton > button:hover {
          background: #117c3b;
          color: white;
        }
        @media (max-width: 760px) {
          .block-container {
            padding: 20px 18px 42px;
          }
          .hero,
          .profile,
          .grid3 {
            grid-template-columns: 1fr;
          }
          h1 {
            font-size: 34px;
          }
          .mascot img {
            margin: 0;
          }
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def open_transit() -> None:
    st.session_state["page"] = "transit"
    st.rerun()


def open_home() -> None:
    st.session_state["page"] = "home"
    st.rerun()


def render_home() -> None:
    st.set_page_config(
        page_title="봄내틔움",
        page_icon="🌱",
        layout="wide",
        initial_sidebar_state="collapsed",
    )
    inject_styles()

    logo_html = ""
    logo_uri = image_data_uri(LOGO_PATH)
    if logo_uri:
        logo_html = f'<img src="{logo_uri}" alt="봄내틔움">'

    st.markdown(
        f"""
        <div class="topbar">
          <div class="brand">{logo_html or "봄내틔움"}</div>
          <div class="pill">학생 데모: STU_001 이지우</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    hero_image = ""
    mascot_uri = image_data_uri(MASCOT_PATH)
    if mascot_uri:
        hero_image = f'<img src="{mascot_uri}" alt="봄내틔움 캐릭터">'

    st.markdown(
        f"""
        <section class="hero">
          <div>
            <div class="eyebrow">BOMNAE TIUM STUDENT SERVICE</div>
            <h1>이지우에게 맞는 춘천 프로그램을 한눈에 확인해요.</h1>
            <p>
              소양중학교에 재학 중인 14세 학생 이지우의 관심사인 SW, AI, 바이오를 기준으로
              수강 이력과 성장정원, 프로그램 추천, 대중교통 길찾기를 연결한 시연용 첫 화면입니다.
            </p>
          </div>
          <div class="mascot">{hero_image}</div>
        </section>
        """,
        unsafe_allow_html=True,
    )

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.button("프로그램 보기", use_container_width=True)
    with col2:
        st.button("성장정원 보기", use_container_width=True)
    with col3:
        st.button("기록관리 보기", use_container_width=True)
    with col4:
        st.button("대중교통 길찾기", on_click=open_transit, use_container_width=True)

    st.markdown('<div class="section-title">학생 프로필</div>', unsafe_allow_html=True)

    sprout = ""
    sprout_uri = image_data_uri(SPROUT_PATH)
    if sprout_uri:
        sprout = f'<img src="{sprout_uri}" alt="새싹 단계">'

    st.markdown(
        f"""
        <section class="profile">
          <div class="avatar">{sprout}</div>
          <div>
            <h2>이지우</h2>
            <p>14세 · 소양중학교 재학 · 중학교 2학년</p>
            <div class="chips">
              <span class="chip">SW 관심</span>
              <span class="chip">AI 관심</span>
              <span class="chip">바이오 관심</span>
              <span class="chip">성장정원 새싹 단계</span>
              <span class="chip">성장 포인트 2P</span>
            </div>
          </div>
        </section>
        """,
        unsafe_allow_html=True,
    )

    st.markdown('<div class="section-title">추천 프로그램</div>', unsafe_allow_html=True)
    st.markdown(
        """
        <div class="grid3">
          <div class="card">
            <b>AI 미디어 콘텐츠 활용</b>
            <p>생성형 AI와 프롬프트를 활용해 이미지, 영상, 숏폼 콘텐츠 제작 흐름을 익히는 프로그램입니다.</p>
          </div>
          <div class="card">
            <b>드론축구 체험 과정</b>
            <p>조종, 센서, 팀 전략을 함께 배우며 SW와 로봇 분야 관심을 확장할 수 있는 수업입니다.</p>
          </div>
          <div class="card">
            <b>바이오캠프 중등부</b>
            <p>실험 중심 활동으로 바이오 산업과 과학 탐구 과정을 경험하는 중학생 대상 프로그램입니다.</p>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.markdown('<div class="section-title">수강 이력과 기록관리</div>', unsafe_allow_html=True)
    st.markdown(
        """
        <div class="grid3">
          <div class="card">
            <b>어린이 창의실험 과학교실</b>
            <p>실험 과정을 직접 기록하며 과학 탐구의 기본 흐름을 익혔습니다.</p>
          </div>
          <div class="card">
            <b>AI 미디어콘텐츠 활용</b>
            <p>AI 도구를 활용해 아이디어를 구체화하고 결과물을 만들어 보았습니다.</p>
          </div>
          <div class="card">
            <b>바이오 HPLC 정량분석</b>
            <p>바이오 실험 장비와 분석 과정을 체험하며 진로 관심을 넓혔습니다.</p>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.markdown('<div class="section-title">오늘 수업 기록</div>', unsafe_allow_html=True)
    with st.container():
        st.markdown('<div class="record-box">', unsafe_allow_html=True)
        st.text_area(
            "수업을 듣고 느낀 점",
            placeholder="오늘 배운 점, 재미있었던 점, 더 해보고 싶은 활동을 적어보세요.",
            height=120,
            label_visibility="visible",
        )
        st.button("기록 저장", use_container_width=True)
        st.markdown("</div>", unsafe_allow_html=True)


def render_transit() -> None:
    runpy.run_path(str(TRANSIT_APP), run_name="__main__")


if "page" not in st.session_state:
    st.session_state["page"] = "home"

if st.session_state["page"] == "transit":
    render_transit()
else:
    render_home()
