import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  BookOpenCheck,
  Building2,
  Check,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Laptop,
  LocateFixed,
  MapPin,
  Navigation,
  NotebookPen,
  Projector,
  Save,
  Star,
  Trash2,
  UserRound,
  Users,
  Wifi,
} from "lucide-react";
import { getDistanceKm } from "./uils/distance.js";

const CHUNCHEON_CENTER = {
  lat: 37.8747077,
  lng: 127.713479,
  label: "춘천 파밀리에 리버파크",
};

const FIELD_OPTIONS = ["전체", "SW·AI", "바이오", "융합"];
const STUDENT_MAP_FIELD_OPTIONS = ["SW", "AI", "바이오"];
const CAREER_GRADE_OPTIONS = [
  ...Array.from({ length: 6 }, (_, index) => ({ value: `e${index + 1}`, label: `초${index + 1}` })),
  ...Array.from({ length: 3 }, (_, index) => ({ value: `m${index + 1}`, label: `중${index + 1}` })),
  ...Array.from({ length: 3 }, (_, index) => ({ value: `h${index + 1}`, label: `고${index + 1}` })),
];
const FIELD_PARTICLES = [
  [-96, -44], [-62, -86], [-14, -96], [42, -86], [88, -48], [102, 0],
  [82, 54], [42, 88], [-10, 98], [-64, 72], [-100, 28], [-84, -16],
];
const AGE_OPTIONS = [
  { label: "전체 학년", key: "all" },
  ...CAREER_GRADE_OPTIONS.map((grade) => ({ label: grade.label, key: grade.value })),
];
const TRACK_OPTIONS = [
  { label: "SW·AI", value: "SW·AI", hint: "코딩, AI, 데이터" },
  { label: "바이오", value: "바이오", hint: "생명과학, 실험, 진로" },
  { label: "융합", value: "융합", hint: "AI 헬스케어, 바이오 데이터" },
];
const GRADE_OPTIONS = ["초등", "중등", "고등"];
const CAREER_PAGE_SIZE = 9;
const STUDENT_REFLECTIONS_KEY = "bomnae-student-class-reflections";
const DEMO_STUDENT_PROFILE = {
  stu_id: "STU_001",
  name: "이지우",
  age: "14",
  school_name: "소양중학교",
  school_level: "중학교",
  grade: "2",
  district_name: "소양동",
  interest_category: "SW,바이오",
  growth_stage: "새싹",
  fertilizer_count: 2,
  harvested_fruit_count: 1,
};
const EQUIPMENT_OPTIONS = ["노트북", "빔프로젝터", "스크린", "마이크", "VR기기", "실험키트"];
const TIME_OPTIONS = ["평일 오전", "평일 오후", "주말 오전", "주말 오후"];
const CHUNCHEON_DISTRICTS = [
  "신북읍", "동면", "동산면", "신동면", "동내면", "남면", "남산면", "서면", "사북면", "북산면",
  "소양동", "교동", "조운동", "약사명동", "근화동", "후평1동", "후평2동", "후평3동",
  "효자1동", "효자2동", "효자3동", "석사동", "퇴계동", "강남동", "신사우동",
];
const GROWTH_STAGES = [
  { key: "씨앗", title: "씨앗", level: "Level 1", fertilizer: 0, note: "신규 가입 직후", icon: "🌱", image: "/growth-stages/seed-transparent.png" },
  { key: "새싹", title: "새싹", level: "Level 2", fertilizer: 2, note: "단기 코스 참여", icon: "🌿", image: "/growth-stages/sprout-transparent.png" },
  { key: "본잎", title: "본잎", level: "Level 3", fertilizer: 6, note: "중기 코스 또는 프로젝트 참여", icon: "🍃", image: "/growth-stages/leaf-transparent.png" },
  { key: "꽃", title: "꽃", level: "Level 4", fertilizer: 12, note: "분야별 활동 누적", icon: "🌸", image: "/growth-stages/flower-transparent.png" },
  { key: "열매", title: "열매", level: "Level 5", fertilizer: 20, note: "장기 코스 다수 이수", icon: "🍎", image: "/growth-stages/fruit-transparent.png" },
];
const EQUIPMENT_ALIASES = {
  노트북: ["노트북", "PC"],
  빔프로젝터: ["빔프로젝터", "프로젝터"],
  스크린: ["스크린", "스마트TV"],
  마이크: ["마이크", "음향"],
  VR기기: ["VR"],
  실험키트: ["실험", "장비교육"],
};

export default function App() {
  const mapRef = useRef(null);
  const mapOwnerRef = useRef("");
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const selectedPlaceOverlayRef = useRef(null);

  const [activeView, setActiveView] = useState("landing");
  const [spaces, setSpaces] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [careerTracks, setCareerTracks] = useState({});
  const [careerPrograms, setCareerPrograms] = useState([]);
  const [careerPlaces, setCareerPlaces] = useState([]);
  const [studentDemand, setStudentDemand] = useState([]);
  const [districtLocations, setDistrictLocations] = useState([]);
  const [userPosition, setUserPosition] = useState(CHUNCHEON_CENTER);
  const [locationStatus, setLocationStatus] = useState("현재 위치를 불러오는 중");
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [studentFieldFilter, setStudentFieldFilter] = useState("SW");
  const [studentAgeFilter, setStudentAgeFilter] = useState("all");
  const [selectedTrack, setSelectedTrack] = useState("융합");
  const [selectedGrade, setSelectedGrade] = useState("중등");
  const [studentCount, setStudentCount] = useState(20);
  const [selectedTime, setSelectedTime] = useState("주말 오전");
  const [selectedEquipment, setSelectedEquipment] = useState(["노트북", "빔프로젝터", "마이크"]);
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [studentStatsInterest, setStudentStatsInterest] = useState("AI");

  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get("view");
    if (["studentHome", "studentCareer", "student", "studentGarden", "mentor", "studentStats"].includes(view)) {
      setActiveView(view);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetchCsv("/space.csv"),
      fetchCsv("/equipment.csv"),
      fetchCsv("/programs.csv").catch(() => []),
      fetchCsv("/chuncheon_students.csv").catch(() => []),
      fetchCsv("/district_locations.csv").catch(() => []),
    ])
      .then(([spaceRows, equipmentRows, programRows, studentRows, districtRows]) => {
        setSpaces(spaceRows);
        setEquipment(equipmentRows);
        setPrograms(programRows);
        setStudentDemand(studentRows);
        setDistrictLocations(districtRows);
      })
      .catch(() => setLocationStatus("공간 데이터를 불러오지 못했습니다."));
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/career-tracks.json").then((response) => {
        if (!response.ok) throw new Error("진로 데이터를 불러오지 못했습니다.");
        return response.json();
      }),
      fetchCsv("/career-programs.csv"),
      fetchCsv("/career-places.csv"),
      fetchCsv("/career-places-manual.csv").catch(() => []),
    ])
      .then(([trackRows, programRows, placeRows, manualPlaceRows]) => {
        setCareerTracks(trackRows);
        setCareerPrograms(programRows);
        setCareerPlaces([...placeRows, ...manualPlaceRows]);
      })
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    loadKakaoMaps()
      .then(() => setMapReady(true))
      .catch((error) => {
        console.error(error);
        setMapError(error.message);
      });
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("현재 위치를 지원하지 않아 춘천 파밀리에 리버파크 기준으로 표시합니다.");
      return;
    }

    const updatePosition = (position) => {
      setUserPosition({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        label: "내 위치",
      });
      setLocationStatus("내 실시간 위치 기준 가까운 기관");
    };
    const handlePositionError = () => {
      setLocationStatus("위치 권한이 없어 춘천 파밀리에 리버파크 기준으로 표시합니다.");
    };

    const watchId = navigator.geolocation.watchPosition(
      updatePosition,
      handlePositionError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    navigator.geolocation.getCurrentPosition(
      updatePosition,
      handlePositionError,
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const studentNearbySpaces = useMemo(() => {
    return getStudentProgramPlaces({
      fieldFilter: studentFieldFilter,
      gradeFilter: studentAgeFilter,
      places: careerPlaces,
      programs: careerPrograms,
      userPosition,
    });
  }, [careerPlaces, careerPrograms, studentAgeFilter, studentFieldFilter, userPosition]);

  const recommendedSpaces = useMemo(() => {
    return spaces
      .filter((space) => space.latitude && space.longitude)
      .filter((space) => spaceMatchesTrack(space, selectedTrack))
      .filter((space) => Number(space.capacity || 0) >= Number(studentCount))
      .filter((space) => space[gradeToTargetKey(selectedGrade)] === "Y")
      .filter((space) => space.rental_available === "Y")
      .map((space) => ({
        ...space,
        equipmentList: equipmentForSpace(equipment, space.space_id),
        matchedEquipment: selectedEquipment.filter((item) =>
          spaceHasEquipment(equipment, space.space_id, item)
        ),
        missingEquipment: selectedEquipment.filter(
          (item) => !spaceHasEquipment(equipment, space.space_id, item)
        ),
        distanceKm: getDistanceKm(
          userPosition.lat,
          userPosition.lng,
          Number(space.latitude),
          Number(space.longitude)
        ),
      }))
      .map((space) => ({
        ...space,
        recommendationScore: getRecommendationScore(space, selectedEquipment),
      }))
      .sort((a, b) => b.recommendationScore - a.recommendationScore || a.distanceKm - b.distanceKm)
      .slice(0, 6);
  }, [equipment, selectedEquipment, selectedGrade, selectedTrack, spaces, studentCount, userPosition]);

  const selectedSpace = useMemo(() => {
    return recommendedSpaces.find((space) => space.space_id === selectedSpaceId) || recommendedSpaces[0];
  }, [recommendedSpaces, selectedSpaceId]);

  const feedbackSummary = useMemo(() => getMatchSummary(selectedSpace, {
    selectedEquipment,
    selectedGrade,
    selectedTime,
    selectedTrack,
    studentCount,
  }), [
    selectedEquipment,
    selectedGrade,
    selectedSpace,
    selectedTime,
    selectedTrack,
    studentCount,
  ]);

  const equipmentSummary = useMemo(() => {
    const total = equipment.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const laptop = equipment
      .filter((item) => item.equipment_name.includes("노트북"))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const vr = equipment
      .filter((item) => item.equipment_name.includes("VR"))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    return { total, laptop, vr };
  }, [equipment]);

  const dashboardStats = useMemo(() => {
    return [
      { label: "추천 가능 공간", value: `${recommendedSpaces.length}곳`, hint: "조건 변경 시 자동 갱신", icon: Building2 },
      { label: "보유 기자재", value: `${equipmentSummary.total}개`, hint: `노트북 ${equipmentSummary.laptop}개 · VR ${equipmentSummary.vr}개`, icon: Laptop },
      { label: "적합도 평균", value: `${feedbackSummary.overallAvg}점`, hint: "선택 공간 기준 산정", icon: BarChart3 },
      { label: "기본 수강 인원", value: `${studentCount}명`, hint: "학생 수 적합도에 반영", icon: Users },
    ];
  }, [equipmentSummary.laptop, equipmentSummary.total, equipmentSummary.vr, feedbackSummary.overallAvg, recommendedSpaces.length, studentCount]);

  const studentDemandStats = useMemo(
    () => getStudentDemandStats(studentDemand, districtLocations, spaces, studentStatsInterest),
    [studentDemand, districtLocations, spaces, studentStatsInterest]
  );

  const visibleMapSpaces = activeView === "student" ? studentNearbySpaces : recommendedSpaces;

  useEffect(() => {
    if (!mapReady) return;
    if (activeView !== "student" && !spaces.length) return;
    if (activeView === "landing" || activeView === "studentLogin" || activeView === "studentHome" || activeView === "studentCareer" || activeView === "studentGarden") return;

    if (mapRef.current && mapOwnerRef.current === activeView) return;

    infoWindowRef.current?.close();
    selectedPlaceOverlayRef.current?.setMap(null);
    selectedPlaceOverlayRef.current = null;
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    mapRef.current = null;

    const mapContainerId =
      activeView === "student" ? "student-map" : activeView === "mentor" ? "mentor-map" : "student-stats-map";
    const mapContainer = document.getElementById(mapContainerId);
    if (!mapContainer) return;

    const map = new window.kakao.maps.Map(mapContainer, {
      center: new window.kakao.maps.LatLng(userPosition.lat, userPosition.lng),
      level: activeView === "studentStats" ? 8 : 7,
    });

    mapRef.current = map;
    mapOwnerRef.current = activeView;
    infoWindowRef.current = new window.kakao.maps.InfoWindow({ zIndex: 2 });
  }, [activeView, mapReady, spaces.length, studentNearbySpaces.length, userPosition.lat, userPosition.lng]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const map = mapRef.current;
    infoWindowRef.current?.close();
    selectedPlaceOverlayRef.current?.setMap(null);
    selectedPlaceOverlayRef.current = null;
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (activeView === "landing" || activeView === "studentLogin" || activeView === "studentHome" || activeView === "studentCareer" || activeView === "studentGarden") {
      mapRef.current = null;
      mapOwnerRef.current = "";
      return;
    }

    if (activeView === "studentStats") {
      const bounds = new window.kakao.maps.LatLngBounds();

      studentDemandStats.bubbleRows.forEach((row) => {
        const position = new window.kakao.maps.LatLng(Number(row.location.latitude), Number(row.location.longitude));
        const content = document.createElement("div");
        content.className = `district-bubble map-bubble interest-${row.topInterest}`;
        content.style.width = `${row.size}px`;
        content.style.height = `${row.size}px`;
        content.title = `${row.district}: ${row.total}명, ${row.topInterest} 관심 최다`;
        content.innerHTML = `<strong>${row.total}</strong><span>${escapeHtml(row.district)}</span>`;
        content.addEventListener("click", () => {
          selectedPlaceOverlayRef.current?.setMap(null);

          const nearestSpace = getNearestVenueForDistrict(row, spaces);
          if (!nearestSpace) return;

          const placeOverlay = new window.kakao.maps.CustomOverlay({
            position,
            xAnchor: 0.5,
            yAnchor: 1.08,
            zIndex: 9,
            content: createDistrictNearestOverlayElement(row, nearestSpace, () => {
              selectedPlaceOverlayRef.current?.setMap(null);
              selectedPlaceOverlayRef.current = null;
            }),
          });

          placeOverlay.setMap(map);
          selectedPlaceOverlayRef.current = placeOverlay;
          markersRef.current.push(placeOverlay);
          map.panTo(position);
        });

        const overlay = new window.kakao.maps.CustomOverlay({
          map,
          position,
          content,
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 3,
        });
        markersRef.current.push(overlay);
        bounds.extend(position);
      });

      studentDemandStats.venueBubbleRows.forEach((row) => {
        const position = new window.kakao.maps.LatLng(Number(row.latitude), Number(row.longitude));
        const content = document.createElement("div");
        content.className = "venue-pin map-venue-pin";
        content.title = row.venue;
        content.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 4.9-8 12-8 12S4 14.9 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

        const overlay = new window.kakao.maps.CustomOverlay({
          map,
          position,
          content,
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 4,
        });
        markersRef.current.push(overlay);
        bounds.extend(position);
      });

      if (studentDemandStats.bubbleRows.length || studentDemandStats.venueBubbleRows.length) map.setBounds(bounds);
      return;
    }

    const userLatLng = new window.kakao.maps.LatLng(userPosition.lat, userPosition.lng);
    map.setCenter(userLatLng);

    const userMarker = new window.kakao.maps.CustomOverlay({
      map,
      position: userLatLng,
      yAnchor: 0.5,
      content: `<div class="user-location-marker" title="${escapeHtml(userPosition.label)}">
        <span></span>
        <b>내 위치</b>
      </div>`,
    });
    markersRef.current.push(userMarker);

    const bounds = new window.kakao.maps.LatLngBounds();
    bounds.extend(userLatLng);

    const mapItems = visibleMapSpaces;

    mapItems.forEach((space) => {
      const position = new window.kakao.maps.LatLng(Number(space.latitude), Number(space.longitude));

      if (activeView === "student") {
        const markerContent = document.createElement("button");
        markerContent.type = "button";
        markerContent.className = `place-marker ${getFieldMarkerClass(space)} ${space.programs?.length > 1 ? "has-count" : ""}`;
        markerContent.title = space.venueName;
        markerContent.innerHTML = `<span>${getFieldMarkerIcon(space)}</span>${
          space.programs?.length > 1 ? `<b>${space.programs.length}</b>` : ""
        }`;

        const marker = new window.kakao.maps.CustomOverlay({
          map,
          position,
          yAnchor: 1,
          content: markerContent,
        });

        markerContent.addEventListener("click", () => {
          selectedPlaceOverlayRef.current?.setMap(null);
          const placeOverlay = new window.kakao.maps.CustomOverlay({
            position,
            xAnchor: 0.5,
            yAnchor: 1.08,
            zIndex: 8,
            content: createProgramPlaceOverlayElement(space, () => {
              selectedPlaceOverlayRef.current?.setMap(null);
              selectedPlaceOverlayRef.current = null;
            }),
          });
          placeOverlay.setMap(map);
          selectedPlaceOverlayRef.current = placeOverlay;
          markersRef.current.push(placeOverlay);
          map.panTo(position);
        });

        markersRef.current.push(marker);
        bounds.extend(position);
        return;
      }

      const marker = new window.kakao.maps.Marker({ map, position, title: space.name });

      window.kakao.maps.event.addListener(marker, "click", () => {
        if (activeView === "mentor") setSelectedSpaceId(space.space_id);
        infoWindowRef.current.setContent(createInfoContent(space));
        infoWindowRef.current.open(map, marker);
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    if (visibleMapSpaces.length > 0) map.setBounds(bounds);
  }, [activeView, mapReady, spaces, studentDemandStats, userPosition, visibleMapSpaces]);

  if (activeView === "landing") {
    return <LandingPage programs={programs} setActiveView={setActiveView} />;
  }

  if (activeView === "studentLogin") {
    return <StudentLoginPage students={studentDemand} setActiveView={setActiveView} />;
  }

  if (activeView === "mentorLogin") {
    return <MentorLoginPage setActiveView={setActiveView} />;
  }

  const isStudentMode = activeView === "studentHome" || activeView === "studentCareer" || activeView === "student" || activeView === "studentGarden";
  const isMentorMode = activeView === "mentor" || activeView === "studentStats";

  return (
    <main className="page">
      <aside className="sidebar">
        <button className="brand brand-home-button" type="button" onClick={() => setActiveView("landing")} aria-label="봄내틔움 첫 화면으로 이동">
          <img src="/bomnae-logo-transparent-v3.png" alt="봄내틔움" />
        </button>
        <nav className="nav-list" aria-label="서비스 화면 전환">
          {isStudentMode && null}
          {isMentorMode && (
            <>
              <button
                className={activeView === "mentor" ? "active" : ""}
                type="button"
                onClick={() => setActiveView("mentor")}
              >
                <BookOpenCheck size={16} />
                멘토 지원
              </button>
              <button
                className={activeView === "studentStats" ? "active" : ""}
                type="button"
                onClick={() => setActiveView("studentStats")}
              >
                <BarChart3 size={16} />
                학생 통계 보기
              </button>
            </>
          )}
        </nav>
      </aside>

      {activeView === "studentHome" ? (
        <StudentHomeView
          activeView={activeView}
          programs={careerPrograms}
          setActiveView={setActiveView}
          students={studentDemand}
        />
      ) : activeView === "studentCareer" ? (
        <StudentCareerView
          activeView={activeView}
          places={careerPlaces}
          programs={careerPrograms}
          setActiveView={setActiveView}
          students={studentDemand}
          tracks={careerTracks}
          userPosition={userPosition}
        />
      ) : activeView === "student" ? (
        <StudentMapView
          activeView={activeView}
          fieldFilter={studentFieldFilter}
          setActiveView={setActiveView}
          setFieldFilter={setStudentFieldFilter}
          ageFilter={studentAgeFilter}
          setAgeFilter={setStudentAgeFilter}
          mapError={mapError}
          nearbySpaces={studentNearbySpaces}
          locationStatus={locationStatus}
          userPosition={userPosition}
        />
      ) : activeView === "studentGarden" ? (
        <StudentGrowthGardenView activeView={activeView} setActiveView={setActiveView} students={studentDemand} />
      ) : activeView === "studentStats" ? (
        <StudentStatsView
          selectedInterest={studentStatsInterest}
          setSelectedInterest={setStudentStatsInterest}
          stats={studentDemandStats}
          spaces={spaces}
        />
      ) : (
        <MentorDashboard
          dashboardStats={dashboardStats}
          feedbackSummary={feedbackSummary}
          mapError={mapError}
          recommendedSpaces={recommendedSpaces}
          selectedEquipment={selectedEquipment}
          selectedGrade={selectedGrade}
          selectedSpace={selectedSpace}
          selectedTime={selectedTime}
          selectedTrack={selectedTrack}
          setSelectedEquipment={setSelectedEquipment}
          setSelectedGrade={setSelectedGrade}
          setSelectedSpaceId={setSelectedSpaceId}
          setSelectedTime={setSelectedTime}
          setSelectedTrack={setSelectedTrack}
          setStudentCount={setStudentCount}
          setActiveView={setActiveView}
          studentCount={studentCount}
        />
      )}
    </main>
  );
}

function LandingPage({ programs, setActiveView }) {
  const recommendedPrograms = useMemo(
    () => getLandingPrograms(programs),
    [programs]
  );

  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="첫 화면 메뉴">
        <a className="landing-brand" href="#top" aria-label="봄내틔움 첫 화면" onClick={(event) => {
          event.preventDefault();
          setActiveView("landing");
        }}>
          <img src="/bomnae-logo-transparent-v3.png" alt="봄내틔움" />
        </a>
        <div className="landing-login-actions">
          <button type="button" onClick={() => setActiveView("studentLogin")}>학생 로그인</button>
          <button type="button" onClick={() => setActiveView("mentorLogin")}>멘토 로그인</button>
        </div>
      </nav>

      <section className="landing-hero" id="top">
        <div className="landing-copy">
          <span className="landing-chip">CHUNCHEON YOUTH LEARNING PLATFORM</span>
          <h1 className="landing-title-roll" aria-label="춘천 청소년들의 배움이 열매 맺는 곳">
            {["춘천 청소년들의 배움이", "열매 맺는 곳"].map((line, lineIndex) => (
              <span className="title-line" key={line}>
                {[...line].map((char, charIndex) => (
                  <span
                    className="title-char"
                    style={{ "--char-index": lineIndex * 13 + charIndex }}
                    key={`${line}-${charIndex}`}
                  >
                    <span>{char === " " ? "\u00A0" : char}</span>
                    <span aria-hidden="true">{char === " " ? "\u00A0" : char}</span>
                  </span>
                ))}
              </span>
            ))}
          </h1>
          <p>
            춘천 초·중·고 청소년의 관심 수요와 공공 교육 공간을 연결해
            <br />
            학생에게는 더 쉬운 배움의 기회를, 멘토에게는 더 나은 프로그램 운영을 지원합니다.
          </p>
        </div>

        <div className="landing-photo-slot" aria-label="상단 대표 이미지 영역">
          <img src="/bomnae-hero-mascots-cutout.png" alt="봄내틔움 나무 아래에서 책을 읽는 두 캐릭터" />
          <span className="hero-leaf hero-leaf-one">🍃</span>
          <span className="hero-leaf hero-leaf-two">🍃</span>
          <span className="hero-leaf hero-leaf-three">🍃</span>
        </div>
      </section>

      <section className="landing-program-section" aria-label="인기 프로그램 현황">
        <div className="landing-program-heading">
          <div>
            <span>PROGRAMS</span>
            <h2>지금 인기 있는 프로그램</h2>
          </div>
        </div>

        <div className="landing-program-marquee">
          <div className="landing-program-row">
            {[...recommendedPrograms, ...recommendedPrograms].map((program, index) => (
              <a
                href="#student-login"
                onClick={(event) => {
                  event.preventDefault();
                  try {
                    localStorage.setItem("bomnae-pending-program", JSON.stringify(program));
                  } catch {
                    // 로그인 이동은 계속 진행합니다.
                  }
                  setActiveView("studentLogin");
                }}
                key={`${program.program_id || program.title}-${index}`}
              >
                <div className="program-card-top">
                  <div>
                    {getProgramTags(program).map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <small>{program.status_label || "현황 확인"}</small>
                </div>
                <strong>{program.title}</strong>
                <p>{getLandingProgramDescription(program)}</p>
                <dl>
                  <div><dt>대상</dt><dd>{program.grade_label || "초·중·고"}</dd></div>
                  <div><dt>기간</dt><dd>{formatProgramDate(program.start_date, program.end_date)}</dd></div>
                  <div><dt>장소</dt><dd>{program.place_name || program.provider || "춘천시"}</dd></div>
                </dl>
                <em>신청하기 <ChevronRight size={14} /></em>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function MentorLoginPage({ setActiveView }) {
  const [mentorId, setMentorId] = useState("MENTOR_001");
  const [password, setPassword] = useState("1234");
  const [error, setError] = useState("");

  function enterMentor(event) {
    event.preventDefault();
    if (!mentorId.trim() || !password.trim()) {
      setError("아이디와 비밀번호를 입력해주세요.");
      return;
    }
    localStorage.setItem("bomnae-mentor-profile", JSON.stringify({
      mentor_id: mentorId.trim(),
      logged_at: new Date().toISOString(),
    }));
    setActiveView("mentor");
  }

  return (
    <main className="student-login-page mentor-login-page">
      <nav className="landing-nav" aria-label="멘토 로그인 메뉴">
        <a className="landing-brand" href="#top" aria-label="봄내틔움 첫 화면" onClick={(event) => {
          event.preventDefault();
          setActiveView("landing");
        }}>
          <img src="/bomnae-logo-transparent-v3.png" alt="봄내틔움" />
        </a>
        <div className="landing-login-actions">
          <button type="button" onClick={() => setActiveView("studentLogin")}>학생 로그인</button>
          <button type="button" onClick={() => setActiveView("landing")}>처음으로</button>
        </div>
      </nav>

      <section className="student-login-card mentor-login-card" id="top">
        <div className="student-login-showcase mentor-login-showcase">
          <span>MENTOR ACCESS</span>
          <img src="/bomnae-running-mascots-cutout.png" alt="" />
          <strong>수업 공간과 학생 수요를 한 번에 확인해요.</strong>
          <p>멘토는 조건에 맞는 기관, 기자재, 학생 통계를 연결해 프로그램 운영 계획을 빠르게 세울 수 있습니다.</p>
        </div>

        <div className="student-login-form">
          <div className="student-login-heading">
            <span>MENTOR LOGIN</span>
            <h1>멘토 로그인</h1>
            <p>멘토 계정으로 들어가 멘토 지원 화면을 확인합니다.</p>
          </div>

          <form className="existing-student-panel mentor-login-form" onSubmit={enterMentor}>
            <label>
              <span>아이디</span>
              <input
                value={mentorId}
                onChange={(event) => setMentorId(event.target.value)}
                placeholder="MENTOR_001"
                autoComplete="username"
              />
            </label>
            <label>
              <span>비밀번호</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호"
                autoComplete="current-password"
              />
            </label>
            <button className="join-submit" type="submit">로그인</button>
          </form>

          {error && <p className="profile-error">{error}</p>}
        </div>
      </section>
    </main>
  );
}

function StudentLoginPage({ students, setActiveView }) {
  const [mode, setMode] = useState("existing");
  const [studentId, setStudentId] = useState("STU_001");
  const [error, setError] = useState("");
  const [joinForm, setJoinForm] = useState({
    name: "",
    school_level: "",
    grade: "",
    district_name: "",
    interest_category: "",
  });
  const maxGrade = joinForm.school_level === "초등학교" ? 6 : 3;

  function enterExistingStudent(event) {
    event.preventDefault();
    const normalizedId = studentId.trim().toUpperCase();
    const student = students.find((row) => row.stu_id?.toUpperCase() === normalizedId);
    if (!student) {
      setError("학생 ID를 찾지 못했어요. 예: STU_001");
      return;
    }
    localStorage.setItem("bomnae-student-profile", JSON.stringify(student));
    setActiveView("studentCareer");
  }

  function enterNewStudent(event) {
    event.preventDefault();
    if (Object.values(joinForm).some((value) => !String(value).trim())) {
      setError("학생 정보를 모두 입력해주세요.");
      return;
    }
    const profile = {
      stu_id: `DEMO_${Date.now().toString().slice(-5)}`,
      ...joinForm,
      growth_stage: "씨앗",
      fertilizer_count: 0,
      harvested_fruit_count: 0,
    };
    localStorage.setItem("bomnae-student-profile", JSON.stringify(profile));
    setActiveView("studentCareer");
  }

  return (
    <main className="student-login-page">
      <nav className="landing-nav" aria-label="학생 로그인 화면 메뉴">
        <a className="landing-brand" href="#top" aria-label="봄내틔움 첫 화면" onClick={(event) => {
          event.preventDefault();
          setActiveView("landing");
        }}>
          <img src="/bomnae-logo-transparent-v3.png" alt="봄내틔움" />
        </a>
        <div className="landing-login-actions">
          <button type="button" onClick={() => setActiveView("landing")}>첫 화면</button>
          <button type="button" onClick={() => setActiveView("mentorLogin")}>멘토 로그인</button>
        </div>
      </nav>

      <section className="student-login-card">
        <div className="student-login-showcase">
          <span>STUDENT SERVICE</span>
          <img src="/bomnae-running-mascots-cutout.png" alt="" />
          <strong>배움이 자라고 경험이 열매가 되는 곳</strong>
          <p>학생 정보를 확인한 뒤 수강이력, 수업 기록, 맞춤 프로그램을 볼 수 있어요.</p>
        </div>

        <div className="student-login-form">
          <div className="student-login-heading">
            <span>{mode === "existing" ? "다시 만나 반가워요" : "처음 시작해볼까요"}</span>
            <h1>{mode === "existing" ? "학생 서비스 입장" : "학생 정보 등록"}</h1>
            <p>{mode === "existing" ? "학생 ID로 빠르게 입장하세요." : "기본 정보를 입력하면 학생 서비스로 이동합니다."}</p>
          </div>

          <div className="join-tabs">
            <button className={mode === "existing" ? "active" : ""} type="button" onClick={() => {
              setMode("existing");
              setError("");
            }}>기존 학생</button>
            <button className={mode === "new" ? "active" : ""} type="button" onClick={() => {
              setMode("new");
              setError("");
            }}>신규 가입</button>
          </div>

          {mode === "existing" ? (
            <form className="existing-student-panel" onSubmit={enterExistingStudent}>
              <label>
                <span>학생 ID</span>
                <input value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="예: STU_001" />
              </label>
              <div className="selected-preview">
                <span>🌱</span>
                <p><b>데모용 학생 ID로 입장해요.</b>STU_001은 이지우, 14세, 소양중학교, SW·바이오 관심 학생입니다.</p>
              </div>
              <button className="join-submit" type="submit">학생 서비스 입장하기</button>
            </form>
          ) : (
            <form className="join-form" onSubmit={enterNewStudent}>
              <label className="full-field">
                <span>이름</span>
                <input value={joinForm.name} onChange={(event) => setJoinForm({ ...joinForm, name: event.target.value })} placeholder="이름을 입력하세요" />
              </label>
              <label>
                <span>학교급</span>
                <select value={joinForm.school_level} onChange={(event) => setJoinForm({ ...joinForm, school_level: event.target.value, grade: "" })}>
                  <option value="">선택</option>
                  <option value="초등학교">초등학교</option>
                  <option value="중학교">중학교</option>
                  <option value="고등학교">고등학교</option>
                </select>
              </label>
              <label>
                <span>학년</span>
                <select value={joinForm.grade} onChange={(event) => setJoinForm({ ...joinForm, grade: event.target.value })} disabled={!joinForm.school_level}>
                  <option value="">선택</option>
                  {Array.from({ length: maxGrade }, (_, index) => <option value={index + 1} key={index + 1}>{index + 1}학년</option>)}
                </select>
              </label>
              <label>
                <span>사는 지역</span>
                <select value={joinForm.district_name} onChange={(event) => setJoinForm({ ...joinForm, district_name: event.target.value })}>
                  <option value="">지역 선택</option>
                  {CHUNCHEON_DISTRICTS.map((district) => <option value={district} key={district}>{district}</option>)}
                </select>
              </label>
              <label>
                <span>관심 분야</span>
                <select value={joinForm.interest_category} onChange={(event) => setJoinForm({ ...joinForm, interest_category: event.target.value })}>
                  <option value="">선택</option>
                  <option value="AI">AI</option>
                  <option value="SW">SW</option>
                  <option value="바이오">바이오</option>
                </select>
              </label>
              <button className="join-submit full-field" type="submit">학생 서비스 시작하기</button>
            </form>
          )}

          {error && <p className="profile-error">{error}</p>}
        </div>
      </section>
    </main>
  );
}

function StudentHomeView({ activeView, programs, setActiveView, students }) {
  const profile = getCurrentStudentProfile(students);
  const courseHistory = useMemo(() => getStudentCourseHistory(programs, profile), [programs, profile?.stu_id]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [rating, setRating] = useState(4);
  const [note, setNote] = useState("");
  const [records, setRecords] = useState(() => loadStudentReflectionRecords(profile));

  useEffect(() => {
    setRecords(loadStudentReflectionRecords(profile));
    setSelectedProgramId("");
    setRating(4);
    setNote("");
  }, [profile?.stu_id]);

  useEffect(() => {
    if (!selectedProgramId && courseHistory[0]?.program.id) {
      setSelectedProgramId(courseHistory[0].program.id);
    }
  }, [courseHistory, selectedProgramId]);

  function saveRecord(event) {
    event.preventDefault();
    const selectedCourse = courseHistory.find((item) => item.program.id === selectedProgramId) || courseHistory[0];
    if (!selectedCourse || !note.trim()) return;

    const nextRecord = {
      id: String(Date.now()),
      programId: selectedCourse.program.id,
      title: selectedCourse.program.title || "수강 프로그램",
      provider: selectedCourse.program.provider || selectedCourse.program.place_name || "춘천 프로그램",
      rating,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };
    const nextRecords = [nextRecord, ...records];
    setRecords(nextRecords);
    saveStudentReflectionRecords(profile, nextRecords);
    setNote("");
    setRating(4);
  }

  function deleteRecord(recordId) {
    const nextRecords = records.filter((record) => record.id !== recordId);
    setRecords(nextRecords);
    saveStudentReflectionRecords(profile, nextRecords);
  }

  const studentName = profile?.name || profile?.stu_id || "학생";
  const interestTags = getStudentInterestTags(profile);
  const schoolInfo = `${profile?.school_name || profile?.school_level || "학교"} ${profile?.grade ? `${profile.grade}학년` : ""}`.trim();

  return (
    <section className="mentor-shell student-home-shell">
      <StudentTopNav activeView={activeView} setActiveView={setActiveView} />

      <header className="student-home-hero">
        <div className="student-profile-card">
          <div className="profile-avatar" aria-label="학생 프로필 아이콘">
            <UserRound size={48} strokeWidth={2.4} />
          </div>
          <div className="profile-main-copy">
            <span className="profile-status">시연 학생 프로필</span>
            <h1>{studentName}</h1>
            <p>{profile?.age || 14}세 · {schoolInfo} · {profile?.district_name || "춘천"}</p>
            <div className="profile-tags" aria-label="관심 분야">
              {interestTags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          </div>
          <div className="profile-side-stats" aria-label="프로필 요약">
            <span>성장 단계</span>
            <strong>{profile?.growth_stage || "꽃"}</strong>
            <small>수업 기록 {records.length}개</small>
          </div>
        </div>

        <div className="student-home-intro">
          <p className="eyebrow">STUDENT HOME</p>
          <h2>{studentName}님의 수강 기록관리</h2>
          <p>
            참여했던 프로그램을 확인하고, 수업마다 느낀 점을 남겨 다음 선택에 활용할 수 있어요.
          </p>
        </div>
      </header>

      <section className="student-home-section" aria-labelledby="course-history-title">
        <div className="section-head compact">
          <div>
            <p className="eyebrow">COURSE HISTORY</p>
            <h2 id="course-history-title">최근 수강이력</h2>
          </div>
          <button className="text-action-button" type="button" onClick={() => setActiveView("studentCareer")}>
            <BookOpenCheck size={16} />
            프로그램 더 보기
          </button>
        </div>

        <div className="student-history-grid">
          {courseHistory.map(({ program, status }, index) => (
            <article className="student-history-card" key={program.id || `${program.title}-${index}`}>
              <div className="history-card-topline">
                <span>{status}</span>
                <small>{formatProgramDate(program.start_date, program.end_date)}</small>
              </div>
              <h3>{program.title || "프로그램명 확인"}</h3>
              <p>{program.provider || program.place_name || "춘천 교육기관"}</p>
              <div className="history-card-meta">
                <b>{program.grade_label || "청소년 대상"}</b>
                <b>{getReadableProgramTags(program).join(" · ") || "진로 탐색"}</b>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="student-reflection-panel" aria-labelledby="reflection-title">
        <div className="reflection-write-area">
          <div className="section-head compact">
            <div>
              <p className="eyebrow">CLASS NOTE</p>
              <h2 id="reflection-title">수업 기록 남기기</h2>
            </div>
          </div>

          <form className="reflection-form" onSubmit={saveRecord}>
            <label>
              <span>기록할 수업</span>
              <select value={selectedProgramId} onChange={(event) => setSelectedProgramId(event.target.value)}>
                {courseHistory.map(({ program }) => (
                  <option value={program.id} key={program.id}>{program.title || "수강 프로그램"}</option>
                ))}
              </select>
            </label>

            <label>
              <span>만족도</span>
              <div className="rating-control">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    className={score <= rating ? "active" : ""}
                    type="button"
                    key={score}
                    onClick={() => setRating(score)}
                    aria-label={`${score}점`}
                  >
                    <Star size={17} />
                  </button>
                ))}
              </div>
            </label>

            <label className="full-field">
              <span>수업이 어땠나요?</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="기억에 남은 활동, 어려웠던 점, 다음에 더 배우고 싶은 내용을 적어보세요."
                rows={5}
              />
            </label>

            <button className="reflection-submit" type="submit" disabled={!note.trim()}>
              <Save size={16} />
              기록 저장
            </button>
          </form>
        </div>

        <div className="reflection-list-area">
          <div className="section-head compact">
            <div>
              <p className="eyebrow">MY RECORDS</p>
              <h2>내가 남긴 기록</h2>
            </div>
          </div>

          {records.length ? (
            <div className="reflection-list">
              {records.map((record) => (
                <article className="reflection-card" key={record.id}>
                  <div>
                    <span>{formatReflectionDate(record.createdAt)}</span>
                    <button type="button" onClick={() => deleteRecord(record.id)} aria-label="기록 삭제">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <h3>{record.title}</h3>
                  <small>{record.provider} · 만족도 {record.rating}/5</small>
                  <p>{record.note}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="reflection-empty">
              <NotebookPen size={22} />
              <strong>아직 남긴 기록이 없어요.</strong>
              <p>수업을 들은 뒤 바로 적어두면 다음 프로그램을 고를 때 훨씬 편해요.</p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

function StudentCareerView({ activeView, places, programs, setActiveView, students, tracks, userPosition }) {
  const profile = getCurrentStudentProfile(students);
  const [selectedFields, setSelectedFields] = useState(() => getInitialCareerFields(profile));
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(() => getProfileGradeCode(profile));
  const [showPastPrograms, setShowPastPrograms] = useState(false);
  const [fieldBurst, setFieldBurst] = useState(null);
  const [page, setPage] = useState(1);
  const trackEntries = Object.entries(tracks || {});
  const placesByName = useMemo(() => getPlacesByName(places), [places]);
  const visibleJobs = useMemo(
    () => selectedFields.flatMap((field) =>
      (tracks[field]?.jobs || []).map((job) => ({ ...job, field }))
    ),
    [selectedFields, tracks]
  );

  useEffect(() => {
    setSelectedJobs((jobs) => jobs.filter((job) => visibleJobs.some((item) => item.code === job)));
  }, [visibleJobs]);

  useEffect(() => {
    setPage(1);
  }, [selectedFields, selectedJobs, selectedGrade]);

  const filteredPrograms = useMemo(
    () => getCareerPrograms(programs, selectedFields, selectedJobs, selectedGrade),
    [programs, selectedFields, selectedJobs, selectedGrade]
  );
  const displayPrograms = useMemo(
    () => filteredPrograms.filter((program) => showPastPrograms || getCareerProgramOpportunity(program, programs).key !== "past"),
    [filteredPrograms, programs, showPastPrograms]
  );
  const pastProgramCount = filteredPrograms.filter((program) => getCareerProgramOpportunity(program, programs).key === "past").length;
  const hiddenPastCount = showPastPrograms ? 0 : pastProgramCount;
  const pageCount = Math.max(1, Math.ceil(displayPrograms.length / CAREER_PAGE_SIZE));
  const visiblePrograms = displayPrograms.slice((page - 1) * CAREER_PAGE_SIZE, page * CAREER_PAGE_SIZE);
  const resultTitle = getCareerResultTitle(tracks, selectedFields, selectedJobs, selectedGrade);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  function toggleField(field) {
    setSelectedFields((fields) => toggleValue(fields, field));
    setFieldBurst({ field, id: Date.now() });
  }

  function toggleJob(job) {
    setSelectedJobs((jobs) => toggleValue(jobs, job));
  }

  function toggleGrade(grade) {
    setSelectedGrade((current) => (current === grade ? "" : grade));
  }

  return (
    <section className="mentor-shell career-shell">
      <StudentTopNav activeView={activeView} setActiveView={setActiveView} />
      <header className="mentor-header career-header">
        <div>
          <p className="eyebrow">STUDENT CURATION</p>
          <h1 className="career-title">
            미래의 나는 뭐가 되고 싶어?
            <span className="title-underline" aria-hidden="true" />
          </h1>
          <p className="career-subtitle">
            {profile?.stu_id ? `${profile.stu_id} 기준으로 프로그램을 정리했어요.` : "분야와 학년을 고르면 지금 볼 만한 프로그램이 정리됩니다."}
          </p>
        </div>
        <div className="career-header-actions">
          <button className="career-map-shortcut primary" type="button" onClick={() => setActiveView("student")}>
            <LocateFixed size={16} />
            가장 가까운 프로그램부터 보기
          </button>
          <button className="career-map-shortcut" type="button" onClick={() => setActiveView("studentHome")}>
            <NotebookPen size={16} />
            내 수강 기록 관리
          </button>
        </div>
      </header>

      <section className="career-builder" aria-label="진로 기반 프로그램 추천">
        <div className="career-step">
          <div className="career-step-title">
            <strong>분야</strong>
            <span>여러 개 선택 가능</span>
          </div>
          <div className="career-field-grid">
            {trackEntries.map(([key, track]) => (
              <button
                className={`career-field-card ${selectedFields.includes(key) ? "selected" : ""}`}
                type="button"
                key={key}
                onClick={() => toggleField(key)}
              >
                <span className={`field-visual field-${key}`} aria-hidden="true">
                  <i />
                </span>
                {fieldBurst?.field === key && (
                  <span className="field-particles" aria-hidden="true" key={fieldBurst.id}>
                    {FIELD_PARTICLES.map(([x, y], index) => (
                      <span
                        style={{ "--particle-x": `${x}px`, "--particle-y": `${y}px` }}
                        key={`${fieldBurst.id}-${index}`}
                      />
                    ))}
                  </span>
                )}
                <strong>{track.label}</strong>
                <small>{countCareerPrograms(programs, "fields", key)}건</small>
              </button>
            ))}
          </div>
        </div>

        {selectedFields.length > 0 && (
          <div className="career-step">
            <div className="career-step-title">
              <strong>관심 있는 직업군을 골라요</strong>
            </div>
            <div className="career-chip-grid">
              {visibleJobs.map((job) => (
                <button
                  className={`career-chip ${selectedJobs.includes(job.code) ? "selected" : ""}`}
                  type="button"
                  title={job.desc}
                  key={job.code}
                  onClick={() => toggleJob(job.code)}
                >
                  <span className={`job-dot field-${job.field}`} aria-hidden="true" />
                  {job.name}
                  <small>{countCareerPrograms(programs, "jobs", job.code)}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="career-step">
          <div className="career-step-title">
            <strong>학년</strong>
          </div>
          <div className="career-grade-grid">
            {CAREER_GRADE_OPTIONS.map((grade) => (
              <button
                className={`career-chip compact ${selectedGrade === grade.value ? "selected" : ""}`}
                type="button"
                key={grade.value}
                onClick={() => toggleGrade(grade.value)}
              >
                {grade.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="career-results" aria-label="추천 프로그램 목록">
        <div className="section-head">
          <div>
            <p className="eyebrow">PROGRAMS</p>
            <h2>{resultTitle}</h2>
          </div>
          <div className="career-result-actions">
            <span className="career-total">{displayPrograms.length}개 중 {visiblePrograms.length}개 표시</span>
            {pastProgramCount > 0 && (
              <button type="button" onClick={() => setShowPastPrograms((value) => !value)}>
                {showPastPrograms ? "지난 공고 숨기기" : `지난 공고 ${hiddenPastCount}개 보기`}
              </button>
            )}
          </div>
        </div>

        <div className="career-program-grid">
          {visiblePrograms.map((program) => {
            const opportunity = getCareerProgramOpportunity(program, programs);
            const place = getProgramTransitPlace(program, placesByName);

            return (
              <article
                className={`career-program-card opportunity-${opportunity.key}`}
                key={program.program_id || program.title}
              >
                <div className="career-card-tags">
                  {splitPipe(program.fields).map((field) => (
                    <span className={`field-${field}`} key={field}>{getCareerFieldLabel(tracks, field)}</span>
                  ))}
                  <span className={`opportunity-tag ${opportunity.key}`}>{opportunity.label}</span>
                </div>
                <strong>{program.title}</strong>
                <span className="program-opportunity-note">{opportunity.hint}</span>
                <p>{program.grade_label || "학년 정보 없음"} · {program.provider || program.source_name || "춘천 교육 프로그램"}</p>
                <small>{program.place_name || (program.is_online === "1" ? "온라인" : "장소 확인")}</small>
                {getCareerWhy(program, selectedJobs, tracks) && (
                  <em>{getCareerWhy(program, selectedJobs, tracks)}</em>
                )}
                <div className="career-program-actions">
                  <a href={program.detail_url || "#"} target="_blank" rel="noreferrer">
                    {opportunity.action}
                    <ChevronRight size={14} />
                  </a>
                  {place && (
                    <a
                      className="transit-link"
                      href={getTransitUrl(place, userPosition)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Navigation size={14} />
                      길찾기
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {!visiblePrograms.length && (
          <div className="career-empty">
            <strong>조건에 맞는 프로그램이 아직 없어요.</strong>
            <p>분야나 학년 선택을 조금 넓히면 더 많은 프로그램을 볼 수 있습니다.</p>
          </div>
        )}

        {pageCount > 1 && (
          <div className="career-pagination">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
              이전
            </button>
            <span>{page} / {pageCount}</span>
            <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount}>
              다음
            </button>
          </div>
        )}
      </section>
    </section>
  );
}

function StudentTopNav({ activeView, setActiveView }) {
  const items = [
    { key: "studentCareer", label: "프로그램", icon: BookOpenCheck },
    { key: "studentGarden", label: "성장정원", icon: BookOpenCheck },
    { key: "studentHome", label: "메인", icon: ClipboardList },
  ];

  return (
    <nav className="student-top-nav" aria-label="학생 화면 이동">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            className={activeView === item.key ? "active" : ""}
            type="button"
            key={item.key}
            onClick={() => setActiveView(item.key)}
          >
            <Icon size={16} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function StudentGrowthGardenView({ activeView, setActiveView, students }) {
  const profile = getCurrentStudentProfile(students);
  const [fertilizerCount, setFertilizerCount] = useState(Number(profile?.fertilizer_count || 0));
  const [basketCount, setBasketCount] = useState(Number(profile?.harvested_fruit_count || 0));
  const [isFeeding, setIsFeeding] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const currentStageIndex = getGrowthStageIndexByFertilizer(fertilizerCount);
  const currentStage = GROWTH_STAGES[currentStageIndex]?.key || "씨앗";
  const nextStage = GROWTH_STAGES[currentStageIndex + 1];
  const currentStageFertilizer = GROWTH_STAGES[currentStageIndex]?.fertilizer || 0;
  const nextStageFertilizer = nextStage?.fertilizer || Math.max(fertilizerCount, currentStageFertilizer + 1);
  const progress = nextStage
    ? Math.min(100, Math.round(((fertilizerCount - currentStageFertilizer) / Math.max(1, nextStageFertilizer - currentStageFertilizer)) * 100))
    : 100;
  const growthPoint = fertilizerCount * 10;
  const studentName = profile?.name || profile?.stu_id || "김학생";
  const interest = getStudentInterestTags(profile).join(" · ");

  useEffect(() => {
    setFertilizerCount(Number(profile?.fertilizer_count || 0));
    setBasketCount(Number(profile?.harvested_fruit_count || 0));
  }, [profile?.stu_id, profile?.fertilizer_count, profile?.harvested_fruit_count]);

  function feedGarden() {
    if (fertilizerCount >= 20) return;
    const nextCount = fertilizerCount + 1;
    const nextStageName = GROWTH_STAGES[getGrowthStageIndexByFertilizer(nextCount)]?.key || currentStage;
    const nextProfile = {
      ...profile,
      fertilizer_count: nextCount,
      growth_stage: nextStageName,
    };
    setFertilizerCount(nextCount);
    setIsFeeding(true);
    localStorage.setItem("bomnae-student-profile", JSON.stringify(nextProfile));
    window.setTimeout(() => setIsFeeding(false), 950);
  }

  function harvestFruit() {
    if (fertilizerCount < 20) return;
    const nextBasketCount = basketCount + 1;
    const nextProfile = {
      ...profile,
      fertilizer_count: 0,
      harvested_fruit_count: nextBasketCount,
      growth_stage: "씨앗",
    };
    setIsHarvesting(true);
    setBasketCount(nextBasketCount);
    localStorage.setItem("bomnae-student-profile", JSON.stringify(nextProfile));
    window.setTimeout(() => {
      setFertilizerCount(0);
      setIsHarvesting(false);
    }, 720);
  }

  return (
    <section className="mentor-shell growth-garden-shell">
      <StudentTopNav activeView={activeView} setActiveView={setActiveView} />
      <header className="mentor-header">
        <div>
          <h1 className="sparkles-title student-map-title">
            나의 성장정원
            <span className="title-underline" aria-hidden="true" />
          </h1>
          <p className="growth-subtitle">
            수업 참여와 활동 기록이 쌓일수록 정원이 한 단계씩 자라나요.
          </p>
        </div>
      </header>

      <section className="growth-hero-card">
        <div className="growth-hero-copy">
          <span>{studentName}님의 현재 단계</span>
          <h2>{GROWTH_STAGES[currentStageIndex]?.icon} {currentStage}</h2>
          <p>
            {profile?.school_level || "중학교"} {profile?.grade || 2}학년 · {profile?.district_name || "퇴계동"} · {interest} 관심
          </p>
          <div className="growth-progress">
            <div>
              <b>{growthPoint}P</b>
              <small>{nextStage ? `${nextStage.title} 단계로 자라는 중` : "열매를 수확할 수 있어요"}</small>
            </div>
            <i><em style={{ width: `${progress}%` }} /></i>
          </div>
          {fertilizerCount >= 20 ? (
            <button className="fertilizer-button harvest-button" type="button" onClick={harvestFruit}>
              열매 수확하기
            </button>
          ) : (
            <button className="fertilizer-button" type="button" onClick={feedGarden}>
              비료 주기
            </button>
          )}
        </div>

        <div className={`growth-garden-visual stage-${currentStage} ${isFeeding ? "feeding" : ""} ${isHarvesting ? "harvesting" : ""}`}>
          <div className="fertilizer-motion" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <GrowthPlantShape stage={currentStage} />
          <div className="growth-ground" />
        </div>
      </section>

      <section className="growth-stage-panel">
        <div className="section-head compact">
          <div>
            <span>GROWTH ROADMAP</span>
            <h2>성장 단계</h2>
          </div>
        </div>
        <div
          className="growth-stage-line"
          role="list"
          aria-label="성장 단계"
          style={{
            "--growth-step-progress": `${Math.round((currentStageIndex / Math.max(1, GROWTH_STAGES.length - 1)) * 100)}%`,
            "--growth-step-ratio": currentStageIndex / Math.max(1, GROWTH_STAGES.length - 1),
          }}
        >
          {GROWTH_STAGES.map((stage, index) => {
            const stepState = index < currentStageIndex ? "completed" : index === currentStageIndex ? "active" : "upcoming";
            return (
              <article
                className={`growth-step ${stepState}`}
                key={stage.key}
                role="listitem"
                aria-current={stepState === "active" ? "step" : undefined}
                style={{ "--stage-delay": index }}
              >
                <span className="growth-step-indicator">
                  <img src={stage.image} alt="" />
                  {stepState === "completed" && <i aria-hidden="true">✓</i>}
                </span>
                <strong>{stage.title}</strong>
                <p>{stage.note}</p>
                <small>{stage.level}</small>
              </article>
            );
          })}
        </div>
      </section>

      <section className="growth-detail-grid">
        <article className="growth-mini-card">
          <span>활동 기록</span>
          <strong>성장 포인트 {growthPoint}P · 수확 {basketCount}회</strong>
        </article>
        <article className="growth-mini-card fruit-basket-card">
          <span>내 열매 바구니 현황</span>
          <strong>{basketCount}개 수확</strong>
          <p>수확한 열매가 작은 바구니에 차곡차곡 담겨요.</p>
          <div className="fruit-basket" aria-label={`수확한 열매 ${basketCount}개`}>
            <div className="fruit-basket-bowl" aria-hidden="true">
              {Array.from({ length: Math.min(8, basketCount) }, (_, index) => {
                const fruitLeft = 18 + (index % 4) * 20;
                const fruitBottom = 25 + Math.floor(index / 4) * 14;
                const fruitRotate = (index - 3) * 5;
                return (
                  <i
                    key={index}
                    style={{
                      "--fruit-left": `${fruitLeft}px`,
                      "--fruit-bottom": `${fruitBottom}px`,
                      "--fruit-rotate": `${fruitRotate}deg`,
                    }}
                  />
                );
              })}
            </div>
            <small>{basketCount === 0 ? "아직 비어 있어요" : "다음 열매도 담을 수 있어요"}</small>
          </div>
        </article>
      </section>

    </section>
  );
}

function GrowthPlantShape({ stage }) {
  const stageInfo = GROWTH_STAGES.find((item) => item.key === stage) || GROWTH_STAGES[0];
  return (
    <div className={`growth-plant plant-${stage}`} aria-hidden="true">
      <img src={stageInfo.image} alt="" />
    </div>
  );
}

function StudentMapView({
  activeView,
  fieldFilter,
  setActiveView,
  setFieldFilter,
  ageFilter,
  setAgeFilter,
  mapError,
  nearbySpaces,
  locationStatus,
  userPosition,
}) {
  return (
    <section className="mentor-shell">
      <StudentTopNav activeView={activeView} setActiveView={setActiveView} />
      <header className="mentor-header">
        <div>
          <p className="eyebrow">학생 서비스</p>
          <h1 className="sparkles-title student-map-title">
            프로그램 기관 지도
            <span className="title-underline" aria-hidden="true" />
          </h1>
          <p className="status">
            <LocateFixed size={16} />
            {locationStatus}
          </p>
        </div>
        <div className="count">{nearbySpaces.length}곳</div>
      </header>

      <section className="student-map-panel">
        <div className="student-filters" aria-label="주변 기관 필터">
          <select value={ageFilter} onChange={(event) => setAgeFilter(event.target.value)}>
            {AGE_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <select value={fieldFilter} onChange={(event) => setFieldFilter(event.target.value)}>
            {STUDENT_MAP_FIELD_OPTIONS.map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>

        <div className="student-layout">
          <div id="student-map" className="map large-map">
            {mapError && <MapError error={mapError} />}
          </div>
          <aside className="student-list" aria-label="프로그램 기관 목록">
            {nearbySpaces.map((space) => (
              <article
                className="student-space-card"
                key={space.place_id}
              >
                <div className="card-title">
                  <MapPin size={18} />
                  <strong>{space.name}</strong>
                </div>
                <p>{space.address || "기관 위치 정보 확인"}</p>
                <div className="meta">
                  <span>{space.distanceKm.toFixed(1)}km</span>
                  <span>{space.programs?.length || 0}개 프로그램</span>
                </div>
                <div className="badges">
                  {splitLabelList(space.suitable_field).map((field) => <span key={field}>{field}</span>)}
                </div>
                <div className="student-card-actions">
                  <a
                    className="transit-link"
                    href={getTransitUrl(space, userPosition)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Navigation size={14} />
                    길찾기
                  </a>
                  <a href={space.programs?.[0]?.detail_url || "#"} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} />
                    기관 보기
                  </a>
                </div>
              </article>
            ))}
            {!nearbySpaces.length && (
              <div className="student-space-card empty-card">
                <div className="card-title">
                  <MapPin size={18} />
                  <strong>표시할 기관이 없어요</strong>
                </div>
                <p>분야나 학년 필터를 넓히면 프로그램 기관을 다시 볼 수 있습니다.</p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </section>
  );
}

function StudentStatsView({ selectedInterest, setSelectedInterest, stats, spaces }) {
  return (
    <section className="mentor-shell stats-shell">
      <header className="mentor-header">
        <div>
          <p className="eyebrow">멘토 지원</p>
          <h1 className="underline-title">학생 통계 보기</h1>
          <p className="stats-subtitle">동별 학생 수요와 관심 분야를 한 화면에서 비교합니다.</p>
        </div>
      </header>

      <section className="stats-kpi-grid" aria-label="학생 수요 요약">
        <div>
          <span>현재 전체 학생</span>
          <strong>{stats.total}명</strong>
        </div>
        {stats.interestTotals.map((item) => (
          <div key={item.name}>
            <span>{item.name} 관심</span>
            <strong>{item.count}명</strong>
          </div>
        ))}
      </section>

      <section className="stats-dashboard-grid">
        <article className="stats-panel compact-rank">
          <div className="section-head compact">
            <div>
              <span>동별 총 학생 수</span>
              <h2>{selectedInterest} 수요 TOP 3</h2>
            </div>
          </div>
          <div className="district-rank-list">
            {stats.topDistrictRows.map((row, index) => (
              <div key={row.district}>
                <b>{index + 1}</b>
                <span>{row.district}</span>
                <i>
                  <em style={{ width: `${row.percent}%` }} />
                </i>
                <strong>{row.total}명</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="stats-panel wide">
          <div className="section-head compact">
            <div>
              <span>통계</span>
              <h2>{selectedInterest} 수요 버블 지도</h2>
            </div>
          </div>
          <div id="student-stats-map" className="demand-bubble-map map" aria-label="동별 학생 수요 버블 지도" />
          <div className="bubble-filter" role="tablist" aria-label="관심 분야 필터">
            {stats.interestKeys.map((key) => (
              <button
                className={selectedInterest === key ? `active interest-${key}` : `interest-${key}`}
                type="button"
                key={key}
                onClick={() => setSelectedInterest(key)}
              >
                <i />
                {key}
              </button>
            ))}
            <span><MapPin size={13} />기관</span>
          </div>
        </article>

        <article className="stats-panel">
          <div className="section-head compact">
            <div>
              <span>동별 학년 수</span>
              <h2>{selectedInterest} 관심 학년 분포 TOP 5</h2>
            </div>
          </div>
          <div className="grade-demand-list">
            {stats.gradeDistrictRows.map((row) => (
              <div key={row.district}>
                <div className="grade-demand-head">
                  <strong>{row.district}</strong>
                  <span>{row.total}명</span>
                </div>
                <div className="grade-demand-bars">
                  {stats.schoolLevels.map((level) => (
                    <p key={level}>
                      <span>{level.replace("학교", "")}</span>
                      <i>
                        <em className={`school-${getSchoolLevelClass(level)}`} style={{ width: `${row.levelPercents[level]}%` }} />
                      </i>
                      <strong>{row.levels[level]}명</strong>
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}

function MentorDashboard({
  dashboardStats,
  feedbackSummary,
  mapError,
  recommendedSpaces,
  selectedEquipment,
  selectedGrade,
  selectedSpace,
  selectedTime,
  selectedTrack,
  setSelectedEquipment,
  setSelectedGrade,
  setSelectedSpaceId,
  setSelectedTime,
  setSelectedTrack,
  setStudentCount,
  setActiveView,
  studentCount,
}) {
  return (
    <section className="mentor-shell">
      <header className="mentor-header" id="dashboard">
        <div>
          <p className="eyebrow">멘토 지원</p>
          <h1 className="underline-title">안녕하세요, 멘토님</h1>
        </div>
        <button className="primary-action" type="button" onClick={() => setActiveView("studentStats")}>
          + 학생 통계 보기
        </button>
      </header>

      <div className="mentor-focus-grid">
        <section className="recommend-section" id="recommend">
          <div className="section-head">
            <div>
              <span>1. 장소·기자재 추천</span>
              <h2>강좌 개설 조건</h2>
            </div>
          </div>

          <div className="match-ribbon" aria-label="현재 추천 조건">
            <span>{selectedTrack}</span>
            <span>{selectedGrade}</span>
            <span>{studentCount}명</span>
            <span>{selectedTime}</span>
            <strong>{selectedEquipment.length}개 기자재 조건 반영 중</strong>
          </div>

          <div className="planner-grid">
            <fieldset className="control-group">
              <legend>수업 분야</legend>
              <div className="radio-grid">
                {TRACK_OPTIONS.map((track) => (
                  <label className="radio-tile" key={track.value}>
                    <input
                      type="radio"
                      name="track"
                      value={track.value}
                      checked={selectedTrack === track.value}
                      onChange={(event) => setSelectedTrack(event.target.value)}
                    />
                    <strong>{track.label}</strong>
                    <span>{track.hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="control-group compact-controls">
              <legend>대상과 규모</legend>
              <div className="segmented">
                {GRADE_OPTIONS.map((grade) => (
                  <button
                    className={selectedGrade === grade ? "selected" : ""}
                    type="button"
                    key={grade}
                    onClick={() => setSelectedGrade(grade)}
                  >
                    {grade}
                  </button>
                ))}
              </div>
              <label className="number-control">
                예상 수강 인원
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={studentCount}
                  onChange={(event) => setStudentCount(event.target.value)}
                />
              </label>
              <label className="select-control">
                희망 운영 시간
                <select value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)}>
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>

            <fieldset className="control-group equipment-picker">
              <legend>필요 기자재</legend>
              {EQUIPMENT_OPTIONS.map((item) => (
                <label className="check-tile" key={item}>
                  <input
                    type="checkbox"
                    checked={selectedEquipment.includes(item)}
                    onChange={() => setSelectedEquipment((current) => toggleValue(current, item))}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </fieldset>
          </div>
        </section>

        <FeedbackDashboard summary={feedbackSummary} />
      </div>

      <section className="stat-grid" aria-label="추천 요약">
        {dashboardStats.map(({ label, value, hint, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <Icon size={20} />
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{hint}</small>
          </div>
        ))}
      </section>

      <section className="results-grid">
        <div className="space-results">
          <div className="section-head">
            <div>
              <span>조건에 맞는 추천 공간</span>
              <h2>{recommendedSpaces.length}곳을 찾았어요</h2>
            </div>
          </div>
          <div className="space-list">
            {recommendedSpaces.map((space, index) => (
              <button
                className={`recommend-card ${selectedSpace?.space_id === space.space_id ? "selected" : ""}`}
                type="button"
                key={space.space_id}
                onClick={() => setSelectedSpaceId(space.space_id)}
              >
                <SpacePhoto space={space} />
                <div className="rank">추천 {index + 1}순위</div>
                <strong>{space.name}</strong>
                <p>{space.suitable_field}</p>
                <div className="meta">
                  <span>{space.capacity}명</span>
                  <span>{space.distanceKm.toFixed(1)}km</span>
                  <span>점수 {space.recommendationScore}</span>
                </div>
                <div className="fit-row">
                  <span>
                    <Check size={14} />
                    충족 {space.matchedEquipment.length}
                  </span>
                  <span>부족 {space.missingEquipment.length}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside className="space-detail" id="inventory">
          <div className="section-head">
            <div>
              <span>2. 기관·기자재 현황</span>
              <h2>{selectedSpace?.name || "추천 공간 없음"}</h2>
            </div>
          </div>
          {selectedSpace && (
            <>
              <SpacePhoto space={selectedSpace} size="large" />
              <div className="detail-row">
                <span>주소</span>
                <strong>{selectedSpace.address}</strong>
              </div>
              <div className="detail-row">
                <span>운영 시간</span>
                <strong>{selectedSpace.available_time}</strong>
              </div>
              <div className="equipment-status">
                <div>
                  <h3>충족 기자재</h3>
                  <div className="pill-list">
                    {selectedSpace.matchedEquipment.length ? (
                      selectedSpace.matchedEquipment.map((item) => <span key={item}>{item}</span>)
                    ) : (
                      <span>없음</span>
                    )}
                  </div>
                </div>
                <div>
                  <h3>추가 준비</h3>
                  <div className="pill-list warning">
                    {selectedSpace.missingEquipment.length ? (
                      selectedSpace.missingEquipment.map((item) => <span key={item}>{item}</span>)
                    ) : (
                      <span>없음</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="inventory-table" role="table" aria-label="기자재 가용 현황">
                <div role="row">
                  <span role="columnheader">기자재</span>
                  <span role="columnheader">수량</span>
                  <span role="columnheader">상태</span>
                </div>
                {selectedSpace.equipmentList.slice(0, 8).map((item) => {
                  const isRequired = selectedEquipment.some((need) =>
                    (EQUIPMENT_ALIASES[need] || [need]).some((alias) => item.equipment_name.includes(alias))
                  );
                  return (
                    <div role="row" key={item.equipment_id}>
                      <span role="cell">{item.equipment_name}</span>
                      <strong role="cell">{item.quantity}개</strong>
                      <em role="cell" className={isRequired ? "matched" : ""}>
                        {isRequired ? "필수 충족" : "보유"}
                      </em>
                    </div>
                  );
                })}
              </div>
              <div className="action-row">
                <a href={selectedSpace.reservation_url || selectedSpace.related_site} target="_blank" rel="noreferrer">
                  예약/홈페이지
                  <ChevronRight size={15} />
                </a>
              </div>
            </>
          )}
        </aside>
      </section>

      <section className="map-band">
        <div className="section-head">
          <div>
            <span>지도에서 보기</span>
            <h2>추천 공간 위치</h2>
          </div>
          <div className="map-chip">
            {selectedTrack} · {selectedGrade} · {selectedTime}
          </div>
        </div>
        <div id="mentor-map" className="map">
          {mapError && <MapError error={mapError} />}
        </div>
      </section>
    </section>
  );
}

function SpacePhoto({ space, size = "card" }) {
  const imageUrl = getSpaceImageUrl(space);

  if (imageUrl) {
    return (
      <div className={`space-photo ${size} with-image`}>
        <img src={imageUrl} alt={`${space.name} 사진`} loading="lazy" />
      </div>
    );
  }

  return (
    <div className={`space-photo ${size} ${getSpacePhotoClass(space)}`}>
      <span>{getSpacePhotoLabel(space)}</span>
    </div>
  );
}

function FeedbackDashboard({ summary }) {
  const metrics = [
    { label: "기자재 만족도", value: summary.equipmentAvg },
    { label: "공간 만족도", value: summary.spaceAvg },
    { label: "학생 인원 만족도", value: summary.studentCountAvg },
  ];

  return (
    <aside className="feedback-dashboard" aria-label="학습 경험 데이터">
      <div className="section-head compact">
        <div>
          <span>4. 학습 경험 데이터</span>
          <h2>
            조건 적합도 요약
            <span
              className="formula-tip"
              tabIndex="0"
              aria-label="계산식: 기자재, 공간, 학생 인원 적합도 점수를 평균냅니다."
            >
               ?
              <b>종합 평균 = 기자재 적합도 + 공간 적합도 + 학생 인원 적합도 / 3</b>
            </span>
          </h2>
        </div>
      </div>

      <div className="feedback-score">
        <BarChart3 size={24} />
        <div>
          <span>종합 평균</span>
          <strong>{summary.overallAvg}점</strong>
        </div>
        <small>{summary.scopeLabel}</small>
      </div>

      <div className="feedback-bars">
        {metrics.map((metric) => (
          <div className="feedback-bar" key={metric.label}>
            <div>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
            <i style={{ "--value": `${Number(metric.value) * 20}%` }} />
          </div>
        ))}
      </div>

      <div className="weak-point">
        <span>부족한 기자재</span>
        <div className="missing-equipment-list">
          {summary.missingEquipmentRows.length ? (
            summary.missingEquipmentRows.map((item) => (
              <strong key={item.name}>
                {item.name}
              </strong>
            ))
          ) : (
            <strong>부족 기자재 없음</strong>
          )}
        </div>
      </div>
    </aside>
  );
}

function MapError({ error }) {
  return (
    <div className="map-message">
      <strong>카카오 지도를 불러오지 못했습니다.</strong>
      <p>{error}</p>
      <p>브라우저 콘솔에서 자세한 오류를 확인해주세요.</p>
    </div>
  );
}

function loadKakaoMaps() {
  const appKey = import.meta.env.VITE_KAKAO_JS_KEY;

  if (!appKey) {
    return Promise.reject(new Error(".env 파일에 VITE_KAKAO_JS_KEY가 없습니다."));
  }

  if (window.kakao?.maps) {
    return new Promise((resolve) => window.kakao.maps.load(resolve));
  }

  return new Promise((resolve, reject) => {
    const previousScript = document.querySelector("script[data-kakao-map-sdk]");
    if (previousScript) {
      previousScript.addEventListener("load", () => window.kakao.maps.load(resolve));
      previousScript.addEventListener("error", () =>
        reject(new Error("카카오 지도 SDK 스크립트 로드에 실패했습니다."))
      );
      return;
    }

    const script = document.createElement("script");
    script.dataset.kakaoMapSdk = "true";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.onload = () => {
      if (!window.kakao?.maps) {
        reject(new Error("카카오 SDK가 로드됐지만 maps 객체가 없습니다. JavaScript 키 도메인 설정을 확인해주세요."));
        return;
      }
      window.kakao.maps.load(resolve);
    };
    script.onerror = () =>
      reject(new Error("카카오 지도 SDK 스크립트 로드에 실패했습니다. JavaScript 키 또는 도메인 등록을 확인해주세요."));
    document.head.appendChild(script);
  });
}

function createInfoContent(space) {
  return `
    <div class="info-window">
      <strong>${escapeHtml(space.name)}</strong>
      <p>${escapeHtml(space.suitable_field || "")}</p>
      <p>${Number(space.distanceKm).toFixed(1)}km · ${escapeHtml(space.capacity)}명</p>
      <a href="${getSpaceSiteUrl(space)}" target="_blank" rel="noreferrer">기관 사이트</a>
    </div>
  `;
}

function createPlaceOverlayElement(space, onClose) {
  const imageUrl = getSpaceImageUrl(space);
  const spaces = space.spaces || [space];
  const title = space.venueName || space.name;
  const totalCapacity = spaces.reduce((sum, item) => sum + Number(item.capacity || 0), 0);
  const element = document.createElement("article");
  element.className = `place-overlay-card ${imageUrl ? "has-photo" : ""}`;
  element.innerHTML = `
    <button class="place-overlay-close" type="button" aria-label="닫기">×</button>
    ${
      imageUrl
        ? `<img class="place-overlay-photo" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)} 사진" />`
        : `<div class="place-overlay-photo placeholder ${getSpacePhotoClass(space)}"><span>${getSpacePhotoLabel(space)}</span></div>`
    }
    <span class="place-overlay-type">${escapeHtml(space.suitable_field || "교육 공간")}</span>
    <strong>${escapeHtml(title)}</strong>
    <p>${escapeHtml(space.address || "")}</p>
    <div class="place-overlay-meta">
      <span>${Number(space.distanceKm).toFixed(1)}km</span>
      <span>${spaces.length}개 공간</span>
      <span>총 ${totalCapacity || "-"}명</span>
    </div>
    ${spaces.length > 1 ? createVenueRoomList(spaces) : ""}
  `;
  element.querySelector(".place-overlay-close").addEventListener("click", (event) => {
    event.stopPropagation();
    onClose();
  });
  return element;
}

function createProgramPlaceOverlayElement(place, onClose) {
  const programs = place.programs || [];
  const displayPrograms = getProgramsForPlaceOverlay(programs);
  const element = document.createElement("article");
  element.className = "place-overlay-card program-place-card";
  element.innerHTML = `
    <button class="place-overlay-close" type="button" aria-label="닫기">×</button>
    <span class="place-overlay-type">${escapeHtml(place.suitable_field || "프로그램 기관")}</span>
    <strong>${escapeHtml(place.name)}</strong>
    <p>${escapeHtml(place.address || "주소 정보 확인 중")}</p>
    <div class="place-overlay-meta">
      <span>${Number(place.distanceKm).toFixed(1)}km</span>
      <span>${programs.length}개 프로그램</span>
    </div>
    <a class="place-overlay-transit" href="${escapeHtml(getTransitUrl(place))}" target="_blank" rel="noreferrer">대중교통 길찾기</a>
    <div class="place-program-list">
      ${displayPrograms
        .map((program) => {
          const opportunity = getCareerProgramOpportunity(program, programs);
          return `
            <a class="program-${escapeHtml(opportunity.key)}" href="${escapeHtml(program.detail_url || "#")}" target="_blank" rel="noreferrer">
              <b>${escapeHtml(program.title)}</b>
              <small>${escapeHtml(program.grade_label || "학년 정보 없음")} · ${escapeHtml(opportunity.label)}</small>
            </a>
          `;
        })
        .join("")}
    </div>
  `;
  element.querySelector(".place-overlay-close").addEventListener("click", (event) => {
    event.stopPropagation();
    onClose();
  });
  return element;
}

function createDistrictNearestOverlayElement(district, space, onClose) {
  const imageUrl = getSpaceImageUrl(space);
  const spaces = space.spaces || [space];
  const title = space.venueName || space.name;
  const totalCapacity = spaces.reduce((sum, item) => sum + Number(item.capacity || 0), 0);
  const element = document.createElement("article");
  element.className = `place-overlay-card district-nearest-card ${imageUrl ? "has-photo" : ""}`;
  element.innerHTML = `
    <button class="place-overlay-close" type="button" aria-label="닫기">×</button>
    ${
      imageUrl
        ? `<img class="place-overlay-photo" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)} 사진" />`
        : `<div class="place-overlay-photo placeholder ${getSpacePhotoClass(space)}"><span>${getSpacePhotoLabel(space)}</span></div>`
    }
    <span class="place-overlay-context">${escapeHtml(district.district)} 기준 가까운 기관</span>
    <span class="place-overlay-type">${escapeHtml(space.suitable_field || "교육 공간")}</span>
    <strong>${escapeHtml(title)}</strong>
    <p>${escapeHtml(space.address || "")}</p>
    <div class="place-overlay-meta">
      <span>${Number(space.distanceKm).toFixed(1)}km</span>
      <span>${spaces.length}개 공간</span>
      <span>총 ${totalCapacity || "-"}명</span>
    </div>
    ${spaces.length > 1 ? createVenueRoomList(spaces) : ""}
  `;
  element.querySelector(".place-overlay-close").addEventListener("click", (event) => {
    event.stopPropagation();
    onClose();
  });
  return element;
}

function getSpaceImageUrl(space) {
  if (space.image_url || space.space_image_url || space.photo_url) {
    return space.image_url || space.space_image_url || space.photo_url;
  }
  const match = space.spaces?.find((item) => item.image_url || item.space_image_url || item.photo_url);
  return match ? match.image_url || match.space_image_url || match.photo_url : "";
}

function getSpaceSiteUrl(space) {
  return space.reservation_url || space.related_site || "#";
}

function getTransitUrl(place, userPosition = null) {
  const params = new URLSearchParams();
  params.set("destName", place.name || place.venueName || place.place_name || "프로그램 기관");
  params.set("destLat", place.latitude);
  params.set("destLng", place.longitude);
  if (place.address) params.set("destAddress", place.address);
  if (userPosition?.lat && userPosition?.lng) {
    params.set("originLat", userPosition.lat);
    params.set("originLng", userPosition.lng);
    params.set("originName", userPosition.label || "내 위치");
  }
  return `/transit/index.html?${params.toString()}`;
}

function getFieldInitial(space) {
  const field = space.suitable_field || "";
  if (field.includes("바이오")) return "B";
  if (field.includes("메이커")) return "M";
  if (field.includes("SW·AI")) return "AI";
  return "ED";
}

function getFieldMarkerClass(space) {
  const field = space.suitable_field || "";
  if (field.includes("바이오")) return "bio-marker";
  if (field.includes("메이커")) return "maker-marker";
  if (field.includes("SW·AI")) return "ai-marker";
  return "edu-marker";
}

function getFieldMarkerIcon(space) {
  const type = getFieldMarkerClass(space);
  if (type === "bio-marker") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6"/><path d="M10 3v5.2l-4.7 8.1A3.2 3.2 0 0 0 8.1 21h7.8a3.2 3.2 0 0 0 2.8-4.7L14 8.2V3"/><path d="M8 15h8"/></svg>`;
  }
  if (type === "maker-marker") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.7 6.3 3-3 3 3-3 3"/><path d="m17.7 9.3-9.9 9.9a2.1 2.1 0 0 1-3-3l9.9-9.9"/><path d="m6.3 17.7 2 2"/></svg>`;
  }
  if (type === "ai-marker") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/><path d="M10 14v-4h4v4"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H7a3 3 0 0 0-3 3V5.5Z"/><path d="M8 7h8M8 11h6"/></svg>`;
}

function groupSpacesByVenue(spaces) {
  const groups = new Map();

  spaces.forEach((space) => {
    const venueName = getVenueName(space.name);
    const key = `${venueName}|${space.latitude}|${space.longitude}`;
    const existing = groups.get(key);
    if (existing) {
      existing.spaces.push(space);
      existing.capacity = String(Number(existing.capacity || 0) + Number(space.capacity || 0));
      existing.suitable_field = mergeLabels(existing.suitable_field, space.suitable_field);
      existing.distanceKm = Math.min(existing.distanceKm, space.distanceKm);
      return;
    }

    groups.set(key, {
      ...space,
      name: venueName,
      venueName,
      spaces: [space],
    });
  });

  return Array.from(groups.values()).sort((a, b) => a.distanceKm - b.distanceKm);
}

function getNearestVenueForDistrict(district, spaces) {
  const districtLat = Number(district.location?.latitude);
  const districtLng = Number(district.location?.longitude);
  if (!Number.isFinite(districtLat) || !Number.isFinite(districtLng)) return null;

  const matchedSpaces = spaces
    .filter((space) => space.latitude && space.longitude)
    .filter((space) => space.rental_available === "Y")
    .filter((space) => spaceMatchesStudentInterest(space, district.topInterest));
  const baseSpaces = matchedSpaces.length
    ? matchedSpaces
    : spaces.filter((space) => space.latitude && space.longitude && space.rental_available === "Y");

  return groupSpacesByVenue(
    baseSpaces.map((space) => ({
      ...space,
      distanceKm: getDistanceKm(districtLat, districtLng, Number(space.latitude), Number(space.longitude)),
    }))
  )[0] || null;
}

function spaceMatchesStudentInterest(space, interest) {
  const field = space.suitable_field || "";
  if (interest === "AI" || interest === "SW") return field.includes("SW") || field.includes("AI");
  if (interest === "바이오") return field.includes("바이오");
  return true;
}

function getVenueName(name) {
  const text = String(name || "");
  if (text.startsWith("커먼즈필드 춘천")) return "커먼즈필드 춘천";
  if (text.startsWith("춘천바이오산업진흥원") || text.startsWith("춘천바이오타운")) return "춘천바이오산업진흥원";
  if (text.startsWith("춘천시자원봉사센터")) return "춘천시자원봉사센터";
  if (text.startsWith("춘천시 평생학습관")) return "춘천시 평생학습관";
  return text.replace(/\s+(BIO-\d동|[0-9]+층|[0-9]+호|대강당|회의실|교육장|미팅룸|커뮤니티룸|컨퍼런스 홀|코워킹 그라운드|안녕하우스).*/, "");
}

function mergeLabels(current = "", next = "") {
  const labels = new Set(
    `${current};${next}`
      .split(";")
      .map((label) => label.trim())
      .filter(Boolean)
  );
  return Array.from(labels).join(";");
}

function getInitialCareerFields(profile) {
  const interest = profile?.interest_category || "";
  const fields = [];
  if (interest.includes("SW")) fields.push("sw");
  if (interest.includes("AI")) fields.push("ai");
  if (interest.includes("바이오")) fields.push("bio");
  return fields;
}

function getProfileGradeCode(profile) {
  const grade = Number(profile?.grade || 0);
  if (!grade) return "";
  const schoolLevel = profile?.school_level || "";
  if (schoolLevel.includes("초")) return `e${Math.min(6, Math.max(1, grade))}`;
  if (schoolLevel.includes("중")) return `m${Math.min(3, Math.max(1, grade))}`;
  if (schoolLevel.includes("고")) return `h${Math.min(3, Math.max(1, grade))}`;
  return "";
}

function getCareerPrograms(programs, fields, jobs, grade) {
  return programs
    .filter((program) => {
      const programFields = splitPipe(program.fields);
      const programJobs = splitPipe(program.jobs);
      const gradeCodes = splitPipe(program.grade_codes);

      if (fields.length && !fields.some((field) => programFields.includes(field))) return false;
      if (jobs.length && !jobs.some((job) => programJobs.includes(job))) return false;
      if (grade && gradeCodes.length && !gradeCodes.includes(grade)) return false;
      return true;
    })
    .sort((a, b) =>
      getCareerProgramOpportunity(a, programs).priority - getCareerProgramOpportunity(b, programs).priority ||
      a.title.localeCompare(b.title, "ko")
    );
}

function getCareerProgramOpportunity(program, programs = []) {
  if (program.status_label === "모집중") {
    return {
      key: "open",
      label: "지금 신청 가능",
      hint: "바로 신청하세요",
      action: "신청하러 가기",
      priority: 0,
    };
  }

  if (program.status_label === "진행중") {
    return {
      key: "running",
      label: "지금 운영 중",
      hint: "이번 회차는 진행 중이에요",
      action: "공고 확인하러 가기",
      priority: 1,
    };
  }

  if (isRecurringCareerProgram(program, programs)) {
    return {
      key: "recurring",
      label: "다시 열릴 수 있어요",
      hint: "전에 열린 적이 있어요 · 공고 확인",
      action: "공고 확인하러 가기",
      priority: 2,
    };
  }

  return {
    key: "past",
    label: "지난 공고",
    hint: "기본으로 숨긴 공고예요",
    action: "내용 보기",
    priority: 3,
  };
}

function getProgramsForPlaceOverlay(programs) {
  return [...programs].sort((a, b) =>
    getCareerProgramOpportunity(a, programs).priority - getCareerProgramOpportunity(b, programs).priority ||
    a.title.localeCompare(b.title, "ko")
  );
}

function isRecurringCareerProgram(program, programs) {
  const titleKey = normalizeCareerProgramTitle(program.title);
  const sameTitleCount = programs.filter((item) => normalizeCareerProgramTitle(item.title) === titleKey).length;
  const text = `${program.title || ""} ${program.provider || ""} ${program.source_name || ""}`;

  if (sameTitleCount > 1) return true;
  if (/2024|2023|\[종료\]|운영 안내/.test(text)) return false;
  return /주말|정기|기수|분기|교육생 모집|체험|클래스|배우기|창의|실험/.test(text);
}

function normalizeCareerProgramTitle(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/\[[^\]]+\]/g, "")
    .replace(/20\d{2}|[0-9]+기|[0-9]+분기|상반기|하반기|초급|중급|고급|반|모집|공고|종료/g, "")
    .replace(/[^가-힣a-z0-9]/g, "")
    .trim();
}

function getCareerStatusScore(program) {
  if (program.status_label === "모집중") return 0;
  if (program.status_label === "예정") return 1;
  if (program.status_label === "진행중") return 2;
  return 3;
}

function getCareerResultTitle(tracks, fields, jobs, grade) {
  const jobNames = new Map(
    Object.values(tracks || {}).flatMap((track) => (track.jobs || []).map((job) => [job.code, job.name]))
  );
  const head =
    jobs.map((job) => jobNames.get(job)).filter(Boolean).join(" · ") ||
    fields.map((field) => tracks[field]?.label).filter(Boolean).join(" · ");
  const gradeLabel = CAREER_GRADE_OPTIONS.find((item) => item.value === grade)?.label || "";

  if (head && gradeLabel) return `${gradeLabel}이 지금 할 수 있는 · ${head}`;
  if (head) return `${head} 프로그램`;
  if (gradeLabel) return `${gradeLabel}이 할 수 있는 프로그램`;
  return "이런 프로그램이 있어요";
}

function getCareerFieldLabel(tracks, field) {
  return tracks[field]?.label || ({ sw: "SW", ai: "AI", bio: "바이오" }[field] || field);
}

function getCareerWhy(program, jobs, tracks) {
  const reason = parseJsonObject(program.job_reason);
  const jobNames = new Map(
    Object.values(tracks || {}).flatMap((track) => (track.jobs || []).map((job) => [job.code, job.name]))
  );
  const shownJobs = (jobs.length ? jobs : Object.keys(reason)).filter((job) => reason[job]);

  return shownJobs
    .slice(0, 2)
    .map((job) => `${jobNames.get(job) || job}: ${reason[job]}`)
    .join(" · ");
}

function parseJsonObject(value) {
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function countCareerPrograms(programs, key, value) {
  return programs.filter((program) => splitPipe(program[key]).includes(value)).length;
}

function splitPipe(value) {
  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getPlacesByName(places) {
  const map = new Map();
  places
    .filter((place) => place.latitude && place.longitude)
    .forEach((place) => {
      const name = place.name || place.place_name;
      if (!name) return;
      map.set(normalizePlaceName(name), {
        ...place,
        name,
      });
    });
  return map;
}

function getProgramTransitPlace(program, placesByName) {
  if (program.is_online === "1") return null;
  const candidates = [
    program.place_name,
    program.provider,
    program.source_name,
  ].filter(Boolean);

  for (const name of candidates) {
    const exact = placesByName.get(normalizePlaceName(name));
    if (exact) return exact;
  }

  for (const name of candidates) {
    const normalized = normalizePlaceName(name);
    const partial = Array.from(placesByName.entries()).find(([placeName]) =>
      placeName.includes(normalized) || normalized.includes(placeName)
    );
    if (partial) return partial[1];
  }

  return null;
}

function normalizePlaceName(value) {
  return String(value || "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function getStudentProgramPlaces({ fieldFilter, gradeFilter, places, programs, userPosition }) {
  const programById = new Map(programs.map((program) => [program.program_id, program]));

  return places
    .filter((place) => place.latitude && place.longitude)
    .map((place, index) => {
      const placeName = place.name || place.place_name;
      const programIds = splitPipe(place.program_ids);
      const linkedPrograms = programIds.length
        ? programIds.map((programId) => programById.get(programId)).filter(Boolean)
        : programs.filter((program) => program.place_name === placeName);
      const placePrograms = linkedPrograms
        .filter((program) => programMatchesStudentField(program, fieldFilter))
        .filter((program) => programMatchesStudentGrade(program, gradeFilter));
      const fieldLabels = getProgramFieldLabels(placePrograms);

      return {
        ...place,
        name: placeName,
        place_id: `career-place-${index}-${placeName}`,
        venueName: placeName,
        latitude: place.latitude,
        longitude: place.longitude,
        programs: placePrograms,
        suitable_field: fieldLabels.join("; ") || "프로그램",
        distanceKm: getDistanceKm(
          userPosition.lat,
          userPosition.lng,
          Number(place.latitude),
          Number(place.longitude)
        ),
      };
    })
    .filter((place) => place.programs.length)
    .sort((a, b) => a.distanceKm - b.distanceKm || b.programs.length - a.programs.length);
}

function programMatchesStudentField(program, fieldFilter) {
  if (!fieldFilter || fieldFilter === "전체") return true;
  const fields = splitPipe(program.fields);
  if (fieldFilter === "SW") return fields.includes("sw");
  if (fieldFilter === "AI") return fields.includes("ai");
  if (fieldFilter === "SW·AI") return fields.includes("sw") || fields.includes("ai");
  if (fieldFilter === "바이오") return fields.includes("bio");
  if (fieldFilter === "융합") return fields.length > 1;
  return true;
}

function programMatchesStudentGrade(program, gradeFilter) {
  if (!gradeFilter || gradeFilter === "all") return true;
  const gradeCodes = splitPipe(program.grade_codes);
  if (!gradeCodes.length) return true;

  if (/^[emh][1-6]$/.test(gradeFilter)) return gradeCodes.includes(gradeFilter);

  const prefix = {
    target_elementary: "e",
    target_middle: "m",
    target_high: "h",
  }[gradeFilter];

  return prefix ? gradeCodes.some((grade) => grade.startsWith(prefix)) : true;
}

function getProgramFieldLabels(programs) {
  const fields = new Set(programs.flatMap((program) => splitPipe(program.fields)));
  const labels = [];
  if (fields.has("sw")) labels.push("SW");
  if (fields.has("ai")) labels.push("AI");
  if (fields.has("bio")) labels.push("바이오");
  if (fields.size > 1) labels.push("융합");
  return labels;
}

function splitLabelList(value) {
  return String(value || "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createVenueRoomList(spaces) {
  return `
    <div class="place-room-list">
      ${spaces
        .slice(0, 5)
        .map((item) => `<span>${escapeHtml(getRoomName(item))}<b>${escapeHtml(item.capacity || "-")}명</b></span>`)
        .join("")}
      ${spaces.length > 5 ? `<small>외 ${spaces.length - 5}개 공간</small>` : ""}
    </div>
  `;
}

function getRoomName(space) {
  const venue = getVenueName(space.name);
  return String(space.name || "").replace(venue, "").trim() || space.facility_type || "교육 공간";
}

function getStudentCourseHistory(programs, profile) {
  if (profile?.stu_id === "STU_001") {
    const demoPrograms = getDemoStudentCoursePrograms(programs);
    if (demoPrograms.length >= 3) return attachCourseHistoryStatuses(demoPrograms);
  }

  const gradeCode = getProfileGradeCode(profile);
  const initialFields = getInitialCareerFields(profile);
  const matchedPrograms = getCareerPrograms(programs, initialFields, [], gradeCode).filter((program) =>
    isRelevantForStudentProfile(program, profile)
  );
  const source = matchedPrograms.length >= 3 ? matchedPrograms : getLandingPrograms(programs).filter((program) =>
    isRelevantForStudentProfile(program, profile)
  );

  return attachCourseHistoryStatuses(source.slice(0, 3));
}

function attachCourseHistoryStatuses(programs) {
  const statuses = ["수강 완료", "참여 중", "신청 예정"];

  return programs.map((program, index) => ({
    program: {
      ...program,
      id: program.program_id || program.id || `${program.title || "program"}-${index}`,
    },
    status: statuses[index] || "수강 기록",
  }));
}

function getDemoStudentCoursePrograms(programs) {
  const preferredTitles = [
    "[주말] 어린이 창의실험과학교실",
    "드론축구(강원도 춘천센터)",
    "제31회 바이오캠프 (중등부) HPLC 정량분석",
    "찾아가는 디지털 VR-XR 메타버스(진로) 체험",
    "인식개선교육(빅데이터/AI분야) 교육생 모집 공고",
  ];
  const picked = [];
  const seen = new Set();

  preferredTitles.forEach((title) => {
    const program = programs.find((item) => normalizeDemoTitle(item.title) === normalizeDemoTitle(title));
    const key = normalizeDemoTitle(program?.title);
    if (program && !seen.has(key)) {
      picked.push(program);
      seen.add(key);
    }
  });

  if (picked.length >= 3) return picked.slice(0, 3);

  programs
    .filter((program) => isRelevantForStudentProfile(program, DEMO_STUDENT_PROFILE))
    .forEach((program) => {
      const key = normalizeDemoTitle(program.title);
      if (picked.length < 3 && !seen.has(key)) {
        picked.push(program);
        seen.add(key);
      }
    });

  return picked.slice(0, 3);
}

function normalizeDemoTitle(title) {
  return String(title || "").replace(/\s+/g, "").toLowerCase();
}

function isRelevantForStudentProfile(program, profile) {
  const text = `${program.title || ""} ${program.summary || ""} ${program.track_group || ""} ${program.interest_tags || ""} ${program.search_text || ""}`.toLowerCase();
  if (/여행|스페인어|일어|일본어|영어|회화|글쓰기|심리/.test(text)) return false;

  const tags = getStudentInterestTags(profile);
  const wantsSw = tags.includes("SW");
  const wantsBio = tags.includes("바이오");

  const swMatch =
    program.is_sw === "1" ||
    program.is_sw_ai_related === "1" ||
    /코딩|sw|프로그래밍|아두이노|마이크로비트|피지컬|로봇|드론|디지털|소프트웨어/.test(text);
  const bioMatch =
    program.is_bio === "1" ||
    program.is_bio_related === "1" ||
    /바이오|생명|과학|실험|플라나리아|환경|생태/.test(text);

  return (wantsSw && swMatch) || (wantsBio && bioMatch);
}

function getStudentReflectionStorageKey(profile) {
  return `${STUDENT_REFLECTIONS_KEY}:${profile?.stu_id || "demo"}`;
}

function loadStudentReflectionRecords(profile) {
  try {
    const stored = localStorage.getItem(getStudentReflectionStorageKey(profile));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveStudentReflectionRecords(profile, records) {
  try {
    localStorage.setItem(getStudentReflectionStorageKey(profile), JSON.stringify(records));
  } catch {
    // 로컬 저장소를 사용할 수 없는 환경에서는 화면 상태만 유지합니다.
  }
}

function getReadableInterest(interest) {
  const text = String(interest || "");
  if (text.includes("AI")) return "AI";
  if (text.includes("SW")) return "SW";
  if (text.includes("bio") || text.includes("Bio") || text.includes("바이오")) return "바이오";
  return text;
}

function getStudentInterestTags(profile) {
  const text = String(profile?.interest_category || "");
  const tags = [];
  if (text.includes("SW")) tags.push("SW");
  if (text.includes("AI")) tags.push("AI");
  if (text.includes("bio") || text.includes("Bio") || text.includes("바이오")) tags.push("바이오");
  return tags.length ? tags : ["관심 분야 탐색"];
}

function getReadableProgramTags(program) {
  const tags = [];
  if (program.is_sw === "1" || program.is_sw_ai_related === "1") tags.push("SW");
  if (program.is_ai === "1") tags.push("AI");
  if (program.is_bio === "1" || program.is_bio_related === "1") tags.push("바이오");
  return tags.length ? tags.slice(0, 2) : getProgramTags(program).map(getReadableInterest).filter(Boolean).slice(0, 2);
}

function formatReflectionDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "방금 전";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getCurrentStudentProfile(students) {
  try {
    const stored = localStorage.getItem("bomnae-student-profile");
    if (stored) return normalizeDemoStudentProfile(JSON.parse(stored));
  } catch {
    // localStorage를 사용할 수 없는 환경에서는 CSV 첫 학생으로 대체합니다.
  }
  return normalizeDemoStudentProfile(students.find((student) => student.stu_id === "STU_001") || students[0] || null);
}

function normalizeDemoStudentProfile(profile) {
  if (!profile) return DEMO_STUDENT_PROFILE;
  if (profile.stu_id === "STU_001") {
    return {
      ...profile,
      ...DEMO_STUDENT_PROFILE,
    };
  }
  return profile;
}

function normalizeGrowthStage(stage) {
  const text = String(stage || "").trim();
  if (text.includes("열매")) return "열매";
  if (text.includes("꽃")) return "꽃";
  if (text.includes("본잎")) return "본잎";
  if (text.includes("잎")) return "본잎";
  if (text.includes("새싹")) return "새싹";
  if (text.includes("씨앗")) return "씨앗";
  return "씨앗";
}

function getGrowthStageIndexByFertilizer(fertilizerCount) {
  const count = Number(fertilizerCount || 0);
  return GROWTH_STAGES.reduce((currentIndex, stage, index) => (
    count >= stage.fertilizer ? index : currentIndex
  ), 0);
}

function fetchCsv(url) {
  return fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`${url} 로드 실패`);
      return response.text();
    })
    .then((text) => parseCsv(text));
}

function toggleValue(values, value) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function gradeToTargetKey(grade) {
  return {
    초등: "target_elementary",
    중등: "target_middle",
    고등: "target_high",
  }[grade];
}

function spaceMatchesTrack(space, track) {
  const field = space.suitable_field || "";
  if (track === "SW·AI") return field.includes("SW·AI");
  if (track === "바이오") return field.includes("바이오");
  return field.includes("융합") || (field.includes("SW·AI") && field.includes("바이오"));
}

function equipmentForSpace(equipment, spaceId) {
  return equipment.filter((item) => item.space_id === spaceId);
}

function spaceHasEquipment(equipment, spaceId, need) {
  const names = equipmentForSpace(equipment, spaceId)
    .map((item) => item.equipment_name)
    .join(" ");
  return (EQUIPMENT_ALIASES[need] || [need]).some((alias) => names.includes(alias));
}

function getRecommendationScore(space, selectedEquipment) {
  const base = 44;
  const capacityScore = Math.min(16, Math.floor(Number(space.capacity || 0) / 5));
  const equipmentScore = selectedEquipment.length
    ? Math.round((space.matchedEquipment.length / selectedEquipment.length) * 28)
    : 28;
  const infraScore = (space.wifi === "Y" ? 6 : 0) + (space.projector === "Y" ? 6 : 0);
  return Math.min(100, base + capacityScore + equipmentScore + infraScore);
}

function getMatchSummary(space, options) {
  if (!space) {
    return {
      equipmentAvg: "0.0",
      spaceAvg: "0.0",
      studentCountAvg: "0.0",
      overallAvg: "0.0",
      missingEquipmentRows: [],
      scopeLabel: "추천 공간 없음",
    };
  }

  const {
    selectedEquipment,
    selectedGrade,
    selectedTime,
    selectedTrack,
    studentCount,
  } = options;
  const equipmentAvg = selectedEquipment.length
    ? ((space.matchedEquipment.length / selectedEquipment.length) * 5).toFixed(1)
    : "5.0";
  const spaceChecks = [
    spaceMatchesTrack(space, selectedTrack),
    space[gradeToTargetKey(selectedGrade)] === "Y",
    spaceMatchesTime(space, selectedTime),
  ];
  const spaceAvg = ((spaceChecks.filter(Boolean).length / spaceChecks.length) * 5).toFixed(1);
  const capacity = Number(space.capacity || 0);
  const expected = Math.max(1, Number(studentCount || 1));
  const studentCountAvg = (Math.min(1, capacity / expected) * 5).toFixed(1);
  const overallAvg = (
    (Number(equipmentAvg) + Number(spaceAvg) + Number(studentCountAvg)) /
    3
  ).toFixed(1);

  return {
    equipmentAvg,
    spaceAvg,
    studentCountAvg,
    overallAvg,
    missingEquipmentRows: space.missingEquipment.map((name) => ({ name })),
    scopeLabel: "선택 공간 기준",
  };
}

function getStudentDemandStats(students, districtLocations, spaces, selectedInterest = "AI") {
  const interestKeys = ["AI", "SW", "바이오"];
  const schoolLevels = ["초등학교", "중학교", "고등학교"];
  const districtMap = new Map();
  const locationMap = new Map(districtLocations.map((row) => [row.district_name, row]));
  const interestTotals = new Map(interestKeys.map((key) => [key, 0]));

  students.forEach((student) => {
    if (interestKeys.includes(student.interest_category)) {
      interestTotals.set(student.interest_category, (interestTotals.get(student.interest_category) || 0) + 1);
    }
  });

  students
    .filter((student) => student.interest_category === selectedInterest)
    .forEach((student) => {
    const district = student.district_name || "미상";
    if (!districtMap.has(district)) {
      districtMap.set(district, {
        district,
        total: 0,
        levels: Object.fromEntries(schoolLevels.map((key) => [key, 0])),
      });
    }
    const row = districtMap.get(district);
    row.total += 1;
    if (schoolLevels.includes(student.school_level)) row.levels[student.school_level] += 1;
  });

  const districtRows = [...districtMap.values()].sort((a, b) => b.total - a.total || a.district.localeCompare(b.district, "ko"));
  const maxDistrict = Math.max(1, ...districtRows.map((row) => row.total));

  const locatedDistrictRows = districtRows
    .map((row) => ({
      ...row,
      location: locationMap.get(row.district),
      topInterest: selectedInterest,
    }))
    .filter((row) => row.location?.latitude && row.location?.longitude);
  const venueLocations = getUniqueVenueLocations(spaces);
  const bounds = getCoordinateBounds([
    ...locatedDistrictRows.map((row) => row.location),
    ...venueLocations,
  ]);

  const bubbleRows = locatedDistrictRows.map((row) => {
    const point = projectCoordinate(row.location, bounds);
    return {
      ...row,
      ...point,
      size: Math.round(26 + (row.total / maxDistrict) * 34),
    };
  });
  const venueBubbleRows = venueLocations.map((venue) => ({
    ...venue,
    ...projectCoordinate(venue, bounds),
  }));

  return {
    total: students.length,
    interestKeys,
    schoolLevels,
    interestTotals: interestKeys.map((name) => ({
      name,
      count: interestTotals.get(name) || 0,
    })),
    topDistrictRows: districtRows.slice(0, 3).map((row) => ({
      ...row,
      percent: Math.round((row.total / maxDistrict) * 100),
    })),
    districtRows: districtRows.map((row) => ({
      ...row,
      percent: Math.round((row.total / maxDistrict) * 100),
    })),
    gradeDistrictRows: districtRows.slice(0, 5).map((row) => ({
      ...row,
      levelPercents: Object.fromEntries(
        schoolLevels.map((level) => [level, row.total ? (row.levels[level] / row.total) * 100 : 0])
      ),
    })),
    bubbleRows,
    venueBubbleRows,
  };
}

function getLandingPrograms(programs) {
  const seenTitles = new Set();

  return programs
    .filter((program) => program.is_adult_only !== "1")
    .filter((program) => program.is_elementary === "1" || program.is_middle === "1" || program.is_high === "1")
    .filter((program) => getProgramTags(program).length > 0)
    .sort((a, b) => {
      const statusScore = (program) => (program.status_label === "모집중" ? 0 : program.status_label === "진행중" ? 1 : 2);
      const popularityA = Number(a.duplicate_count || 0) + Number(a.youth_fit || 0);
      const popularityB = Number(b.duplicate_count || 0) + Number(b.youth_fit || 0);
      const dateA = Date.parse(a.apply_end || a.start_date || "") || Number.MAX_SAFE_INTEGER;
      const dateB = Date.parse(b.apply_end || b.start_date || "") || Number.MAX_SAFE_INTEGER;
      return statusScore(a) - statusScore(b) || popularityB - popularityA || dateA - dateB || a.title.localeCompare(b.title, "ko");
    })
    .filter((program) => {
      const key = normalizeLandingProgramTitle(program.title);
      if (seenTitles.has(key)) return false;
      seenTitles.add(key);
      return true;
    })
    .slice(0, 10);
}

function normalizeLandingProgramTitle(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/\[[^\]]+\]/g, "")
    .replace(/20\d{2}|[0-9]+기|[0-9]+분기|상반기|하반기|초급|중급|고급|오전|오후|반/g, "")
    .replace(/[^가-힣a-z0-9]/g, "")
    .trim();
}

function getProgramTags(program) {
  const tags = [];
  if (program.is_sw === "1" || program.is_sw_ai_related === "1") tags.push("SW");
  if (program.is_ai === "1") tags.push("AI");
  if (program.is_bio === "1" || program.is_bio_related === "1") tags.push("바이오");
  return tags.slice(0, 2);
}

function getLandingProgramDescription(program) {
  const tags = getProgramTags(program).join("·") || "진로 탐색";
  const place = program.place_name || program.provider || "춘천";
  const grade = program.grade_label || "청소년";
  const status = program.status_label === "모집중"
    ? "지금 신청할 수 있는"
    : program.status_label === "진행중"
      ? "현재 운영 중인"
      : "다시 열릴 수 있는";
  return `${place}에서 ${grade} 학생이 ${tags}를 경험할 수 있는 ${status} 프로그램입니다.`;
}

function formatProgramDate(startDate, endDate) {
  if (!startDate && !endDate) return "일정 확인";
  if (startDate && endDate) return `${startDate} ~ ${endDate}`;
  return startDate || endDate;
}

function getSchoolLevelClass(level) {
  if (level.includes("초")) return "elementary";
  if (level.includes("중")) return "middle";
  if (level.includes("고")) return "high";
  return "default";
}

function getUniqueVenueLocations(spaces) {
  const rows = [];
  const seen = new Set();

  spaces
    .filter((space) => space.latitude && space.longitude)
    .forEach((space) => {
      const venue = getVenueName(space.name);
      if (!venue || seen.has(venue)) return;
      seen.add(venue);
      rows.push({
        venue,
        latitude: Number(space.latitude),
        longitude: Number(space.longitude),
      });
    });

  return rows;
}

function getCoordinateBounds(points) {
  const valid = points
    .map((point) => ({
      latitude: Number(point.latitude),
      longitude: Number(point.longitude),
    }))
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));

  if (!valid.length) {
    return {
      minLat: 37.82,
      maxLat: 37.94,
      minLng: 127.66,
      maxLng: 127.79,
    };
  }

  const lats = valid.map((point) => point.latitude);
  const lngs = valid.map((point) => point.longitude);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

function projectCoordinate(point, bounds) {
  const latRange = Math.max(0.001, bounds.maxLat - bounds.minLat);
  const lngRange = Math.max(0.001, bounds.maxLng - bounds.minLng);
  const x = 8 + ((Number(point.longitude) - bounds.minLng) / lngRange) * 84;
  const y = 8 + ((bounds.maxLat - Number(point.latitude)) / latRange) * 84;
  return {
    x: Math.max(6, Math.min(94, x)),
    y: Math.max(6, Math.min(94, y)),
  };
}

function getVenueDistrictRows(spaces) {
  const venueDistricts = new Map([
    ["춘천시 평생학습관", "퇴계동"],
    ["커먼즈필드 춘천", "근화동"],
    ["춘천바이오산업진흥원", "후평동"],
    ["춘천바이오타운", "후평동"],
    ["춘천시자원봉사센터", "소양동"],
    ["춘천시청소년수련관", "강남동"],
    ["춘천시청소년문화의집", "소양동"],
  ]);
  const rows = [];
  const seen = new Set();

  spaces.forEach((space) => {
    const venue = getVenueName(space);
    if (!venue || seen.has(venue)) return;
    seen.add(venue);
    rows.push({
      venue,
      district: venueDistricts.get(venue) || "",
    });
  });

  return rows;
}

function spaceMatchesTime(space, selectedTime) {
  const available = `${space.available_time || ""}`;
  if (!selectedTime) return true;
  const wantsWeekend = selectedTime.includes("주말");
  const wantsMorning = selectedTime.includes("오전");
  const wantsAfternoon = selectedTime.includes("오후");
  const hasWeekend = /토|일|주말/.test(available);
  const hasWeekday = /평일|월|화|수|목|금/.test(available);
  const hasMorning = /오전|09|10|11|12/.test(available);
  const hasAfternoon = /오후|13|14|15|16|17|18|19|20|21/.test(available);
  const dayMatches = wantsWeekend ? hasWeekend : hasWeekday;
  const timeMatches = wantsMorning ? hasMorning : wantsAfternoon ? hasAfternoon : true;
  return dayMatches && timeMatches;
}

function getSpacePhotoClass(space) {
  const text = `${space.name || ""} ${space.facility_type || ""} ${space.suitable_field || ""}`;
  if (text.includes("바이오")) return "bio-photo";
  if (text.includes("도서관")) return "library-photo";
  if (text.includes("청소년")) return "youth-photo";
  if (text.includes("커먼즈필드")) return "commons-photo";
  return "learning-photo";
}

function getSpacePhotoLabel(space) {
  const text = `${space.name || ""} ${space.facility_type || ""} ${space.suitable_field || ""}`;
  if (text.includes("바이오")) return "Bio Lab";
  if (text.includes("도서관")) return "Library";
  if (text.includes("청소년")) return "Youth Space";
  if (text.includes("커먼즈필드")) return "Commons";
  return "Learning Space";
}

function parseCsv(text) {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  if (current || row.length) {
    row.push(current);
    rows.push(row);
  }

  const headers = rows.shift()?.map((header) => header.replace(/^\uFEFF/, "")) || [];
  return rows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
