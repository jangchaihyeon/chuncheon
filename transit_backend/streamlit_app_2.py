"""Standalone Streamlit version of the Bomnaeum Chuncheon transit guide."""

from __future__ import annotations

from html import escape
from pathlib import Path
import sys

import streamlit as st


PROJECT_ROOT = Path(__file__).resolve().parent
WEB_ROOT = PROJECT_ROOT / "web"
SITE_PACKAGES = PROJECT_ROOT / ".venv" / "Lib" / "site-packages"
if SITE_PACKAGES.exists():
    sys.path.insert(0, str(SITE_PACKAGES))
sys.path.insert(0, str(WEB_ROOT))

from app import CATEGORY_LABELS, PLACES, calculate_routes  # noqa: E402


def query_value(name: str, default: str = "") -> str:
    value = st.query_params.get(name, default)
    if isinstance(value, list):
        return str(value[0]) if value else default
    return str(value) if value is not None else default


def query_place(prefix: str, fallback: dict) -> dict:
    lat = query_value(f"{prefix}Lat")
    lng = query_value(f"{prefix}Lng")
    try:
        latitude = float(lat)
        longitude = float(lng)
    except ValueError:
        return fallback

    name = query_value(f"{prefix}Name", fallback["name"])
    description = query_value(f"{prefix}Address", name)
    return {
        "name": name,
        "description": description,
        "latitude": latitude,
        "longitude": longitude,
    }


QUERY_ORIGIN_KEY = "query_origin"
QUERY_DESTINATION_KEY = "query_destination"
HAS_QUERY_DESTINATION = bool(query_value("destLat")) and bool(query_value("destLng"))
PLACES[QUERY_ORIGIN_KEY] = query_place("origin", PLACES["chiljeon_daewoo"])
PLACES[QUERY_DESTINATION_KEY] = query_place("dest", PLACES["bio_center"])


st.set_page_config(page_title="봄내티움 | 참여 경로 확인", page_icon="🚌", layout="wide")

st.markdown(
    """
    <style>
      :root { --green:#238b45; --green-dark:#166c35; --paper:#fffefa; --ink:#202522; --line:#e3e9e3; --red:#d9342b; }
      .stApp { background:#f7f7f2; color:var(--ink); } #MainMenu, footer, header { visibility:hidden; }
      .block-container { max-width:1720px; padding:0 5vw 70px !important; } div[data-testid="stVerticalBlock"] { gap:.8rem; }
      div[data-testid="stImage"] img { width:158px !important; } div[data-testid="stSelectbox"] > label { color:#8a918c; font-size:.76rem; font-weight:700; }
      div[data-testid="stSelectbox"] div[data-baseweb="select"] > div { min-height:58px; border:1px solid var(--line); border-radius:14px; background:#fbfcfa; box-shadow:none; }
      div[data-testid="stSelectbox"] div[data-baseweb="select"] span { color:var(--ink); font-weight:800; }
      div.stButton > button { min-height:58px; border:0; border-radius:14px; background:var(--green); color:#fff; font-weight:850; font-size:1rem; box-shadow:0 8px 18px rgba(35,139,69,.2); }
      div.stButton > button:hover { background:var(--green-dark); color:#fff; border:0; }
      button[data-baseweb="tab"] { border:1px solid #dfe5df !important; border-radius:999px !important; padding:9px 17px !important; background:var(--paper) !important; color:#636a65 !important; font-weight:800 !important; }
      button[data-baseweb="tab"][aria-selected="true"] { background:var(--green) !important; color:white !important; border-color:var(--green) !important; box-shadow:0 7px 15px rgba(35,139,69,.18); }
      div[data-baseweb="tab-list"] { gap:8px; border-bottom:0; } div[data-baseweb="tab-highlight"] { display:none; }
      .hero { min-height:282px; padding:48px 56px; border-radius:26px; background:linear-gradient(120deg,#eff8e9 0%,#fffbe6 62%,#fff4dc 100%); display:grid; grid-template-columns:1.2fr .8fr; overflow:hidden; position:relative; }
      .eyebrow { margin:0 0 12px; color:var(--green); font-size:11px; font-weight:900; letter-spacing:1.8px; }.hero h1 { margin:0; font-size:clamp(32px,4vw,50px); line-height:1.18; letter-spacing:-2.3px; }.hero h1 em { color:var(--green); font-style:normal; }.hero p:not(.eyebrow) { margin:20px 0 0; color:#667069; font-size:15px; }
      .hero-art { position:relative; min-height:180px; }.sun { position:absolute; width:72px; height:72px; border-radius:50%; background:#ffd965; right:12%; top:8%; box-shadow:0 0 0 16px rgba(255,217,101,.2); }.hill { position:absolute; border-radius:50% 50% 0 0; bottom:-70px; }.hill-one { width:360px;height:220px;background:#a9d792;right:-30px; }.hill-two { width:300px;height:170px;background:#63aa69;right:140px;bottom:-90px; }.bus { position:absolute; z-index:2; right:24%; bottom:18px; width:116px; height:61px; border-radius:18px 18px 10px 10px; background:#fff; border:7px solid #ec8a1b; color:#ec8a1b; display:grid; place-items:center; font-weight:900; letter-spacing:2px; box-shadow:0 12px 20px rgba(45,75,45,.18); }.bus:before,.bus:after { content:""; position:absolute; width:17px;height:17px;border-radius:50%;background:#34463a;bottom:-15px; }.bus:before { left:15px; }.bus:after { right:15px; }
      .section-title { margin:52px 0 5px; }.section-title h2 { margin:0; font-size:28px; letter-spacing:-1px; }.queried { color:#89908b; font-size:12px; text-align:right; margin:8px 0; }
      .route-card { position:relative; overflow:hidden; background:var(--paper); border:1px solid var(--line); border-radius:18px; padding:22px; min-height:365px; margin:14px 0; box-shadow:0 8px 26px rgba(44,70,50,.06); }.route-card:before { content:""; position:absolute; left:0; top:0; bottom:0; width:5px; background:var(--green); }.route-top { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }.route-title { display:flex; gap:11px; align-items:center; }.rank { display:grid; place-items:center; width:30px; height:30px; border-radius:10px; background:#eaf5eb; color:var(--green); font-size:13px; font-weight:900; }.time { font-size:25px; font-weight:900; letter-spacing:-1px; line-height:1.15; }.type,.arrival small { color:#89908b; font-size:10px; }.arrival { text-align:right; white-space:nowrap; }.arrival strong { display:block; color:var(--green-dark); font-size:16px; margin-top:3px; }.arrival span { color:#89908b; font-size:10px; }
      .tags { margin:17px 0 12px; display:flex; flex-wrap:wrap; gap:6px; }.tag { display:inline-block; border-radius:999px; padding:5px 8px; background:#edf7ed; color:var(--green-dark); font-size:10px; font-weight:800; }.tag:nth-child(even) { background:#fff2df; color:#b66a15; }.walks { display:flex; gap:7px; flex-wrap:wrap; margin-bottom:13px; }.walks span { padding:6px 9px; border-radius:9px; background:#f1f4ef; color:#69716b; font-size:10px; }.walks b { color:var(--ink); }.journey { padding:13px; background:#f8faf7; border-radius:13px; display:grid; gap:10px; }.segment { display:grid; grid-template-columns:58px 1fr; gap:10px; }.bus-number { display:grid; place-items:center; min-height:31px; padding:4px; border-radius:8px; background:var(--green); color:#fff; font-size:10px; font-weight:900; text-align:center; overflow-wrap:anywhere; }.segment strong { display:block; font-size:12px; }.segment small { color:#858d87; font-size:10px; }.realtime { color:var(--red); font-weight:900; }.stats { display:grid; grid-template-columns:repeat(3,1fr); margin-top:15px; padding-top:13px; border-top:1px solid var(--line); }.stats div { padding:0 7px; border-right:1px solid var(--line); }.stats div:last-child { border:0; }.stats small { display:block; color:#919892; font-size:9px; }.stats b { font-size:12px; } div[data-testid="stExpander"] { border:1px solid var(--line); border-radius:12px; background:#fbfcfa; margin:-5px 0 14px; }
      @media(max-width:700px) { .block-container { padding:0 14px 48px !important; }.hero { padding:34px 25px; grid-template-columns:1fr; min-height:260px; }.hero-art { position:absolute; right:-45px; bottom:-25px; width:260px; height:150px; opacity:.45; }.hero h1 { font-size:34px; }.route-card { min-height:auto; }.time { font-size:22px; } }
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_data(ttl=30, show_spinner=False)
def calculate_routes_cached(origin_key: str, destination_key: str) -> dict:
    return calculate_routes(PLACES[origin_key], PLACES[destination_key])


def place_label(key: str) -> str:
    place = PLACES[key]
    return f"{place['name']} · {place['description']}"


def short_routes(numbers: list[str]) -> str:
    return ", ".join(numbers[:2]) + (f" 외 {len(numbers) - 2}개" if len(numbers) > 2 else "")


def realtime_text(realtime: list[dict]) -> str:
    if not realtime:
        return ""
    first = realtime[0]
    minutes, seconds = divmod(max(round(first["arrival_seconds"]), 0), 60)
    when = f"{minutes}분 {seconds}초 후" if minutes else f"{seconds}초 후"
    remaining = first.get("remaining_stop_count")
    return f"실시간 {when}" + (f" · {remaining}개 전" if remaining is not None else "")


def render_route(route: dict) -> None:
    tags = "".join(f'<span class="tag">{escape(tag)}</span>' for tag in route.get("tags", []))
    walks = [("출발 도보", route["origin_walking_distance_m"])]
    if route["transfer_count"]:
        walks.append(("환승 도보", route.get("transfer_walking_distance_m", 0)))
    walks.append(("도착 도보", route["destination_walking_distance_m"]))
    walks_html = "".join(f"<span>{label} <b>{round(distance)}m</b></span>" for label, distance in walks)
    segments_html = ""
    for segment in route["segments"]:
        realtime = segment.get("realtime_arrivals", [])
        wait = f'<span class="realtime"> · {realtime_text(realtime)}</span>' if realtime else ""
        if not wait and segment.get("bus_options"):
            wait = f' · {escape(segment["bus_options"][0].get("wait_text") or "시간표 확인")}'
        segments_html += f'''<div class="segment"><span class="bus-number">{escape(short_routes(segment['route_numbers']))}</span><span><strong>{escape(segment['boarding_stop'])} → {escape(segment['alighting_stop'])}</strong><small>{escape(short_routes(segment['route_numbers']))}번{wait}</small><small>{segment['stop_count']}개 정류장 · 탑승 {escape(segment['in_vehicle_text'])}</small></span></div>'''
    route_type = f"환승 {route['transfer_count']}회 경로" if route["transfer_count"] else "직통 경로"
    st.markdown(f'''<article class="route-card"><div class="route-top"><div class="route-title"><span class="rank">{route.get('rank', '-')}</span><div><div class="time">{escape(route['in_vehicle_text'])}</div><div class="type">{route_type}</div></div></div><div class="arrival"><small>목적지 도착</small><strong>{escape(route.get('arrival_time') or '시간 확인 중')}</strong><span>버스 탑승 {escape(route['in_vehicle_text'])}</span></div></div><div class="tags">{tags}</div><div class="walks">{walks_html}</div><div class="journey">{segments_html}</div><div class="stats"><div><small>버스 탑승</small><b>{escape(route['in_vehicle_text'])}</b></div><div><small>총 도보</small><b>{round(route['walking_distance_m'])}m</b></div><div><small>환승</small><b>{route['transfer_count']}회</b></div></div></article>''', unsafe_allow_html=True)
    for segment in route["segments"]:
        with st.expander(f"{short_routes(segment['route_numbers'])}번 · 상세 경로 보기"):
            realtime = realtime_text(segment.get("realtime_arrivals", []))
            st.markdown(f"**{segment['boarding_stop']}**에서 탑승 → **{segment['alighting_stop']}**에서 하차")
            st.caption(realtime or segment.get("boarding_time") or "시간표 정보 없음")
            stops = segment.get("stops", [])
            if stops:
                st.markdown(" → ".join(f"{stop['name']} {stop.get('number') or ''}".strip() for stop in stops))


top_left, top_right = st.columns([5, 1])
with top_left:
    st.image(str(WEB_ROOT / "static" / "logo.svg"))
with top_right:
    st.button("← 프로그램 지도", use_container_width=True, disabled=True)

st.markdown('''<section class="hero"><div><p class="eyebrow">PROGRAM ACCESS GUIDE</p><h1>내게 맞는 프로그램,<br><em>직접 참여할 수 있을까요?</em></h1><p>관심 프로그램을 찾았다면 버스로 30분 안에 갈 수 있는지 확인해보세요.</p></div><div class="hero-art"><span class="sun"></span><span class="hill hill-one"></span><span class="hill hill-two"></span><span class="bus">BUS</span></div></section>''', unsafe_allow_html=True)

place_keys = list(PLACES)
default_origin_key = QUERY_ORIGIN_KEY if HAS_QUERY_DESTINATION else "chiljeon_daewoo"
default_destination_key = QUERY_DESTINATION_KEY if HAS_QUERY_DESTINATION else "bio_center"
left, right = st.columns(2)
with left:
    origin_key = st.selectbox("나의 출발 위치", place_keys, format_func=place_label, index=place_keys.index(default_origin_key))
with right:
    destination_key = st.selectbox("선택한 프로그램 장소", place_keys, format_func=place_label, index=place_keys.index(default_destination_key))

if HAS_QUERY_DESTINATION and "transit_results" not in st.session_state and origin_key != destination_key:
    with st.spinner("시간표와 춘천버스GO 실시간 도착정보를 확인하고 있습니다..."):
        try:
            st.session_state["transit_results"] = calculate_routes_cached(origin_key, destination_key)
        except Exception as error:
            st.error("경로를 계산하지 못했습니다. 잠시 후 다시 시도해주세요.")
            st.exception(error)

if st.button("⌕ 참여 경로 확인", type="primary", use_container_width=True):
    if origin_key == destination_key:
        st.warning("출발지와 도착지는 서로 다르게 선택해주세요.")
    else:
        with st.spinner("시간표와 춘천버스GO 실시간 도착정보를 확인하고 있습니다..."):
            try:
                st.session_state["transit_results"] = calculate_routes_cached(origin_key, destination_key)
            except Exception as error:
                st.error("경로를 계산하지 못했습니다. 잠시 후 다시 시도해주세요.")
                st.exception(error)

result = st.session_state.get("transit_results")
if result:
    st.markdown('<div class="section-title"><p class="eyebrow">PROGRAM ACCESS</p><h2>이 프로그램에 갈 수 있는 경로</h2></div>', unsafe_allow_html=True)
    st.markdown(f'<p class="queried">{result["queried_at"]} 기준 · <span class="realtime">빨간 글씨는 춘천버스GO 실시간 도착정보</span></p>', unsafe_allow_html=True)
    category_tabs = st.tabs([category["label"] for category in result["categories"].values()])
    for tab, category in zip(category_tabs, result["categories"].values()):
        with tab:
            routes = category["routes"]
            if not routes:
                st.info("표시할 경로가 없습니다.")
                continue
            columns = st.columns(min(3, len(routes)))
            for index, route in enumerate(routes):
                with columns[index % len(columns)]:
                    render_route(route)
else:
    st.info("출발 위치와 프로그램 장소를 선택한 뒤 참여 경로 확인을 눌러주세요.")
