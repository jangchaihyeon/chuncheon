const ROUTE_STOPS_URL = "./data/chuncheon_bus_route_stops_latest.csv";
const TIMETABLE_URL = "./data/춘천시_버스_출발_시간_데이터.csv";
const WALKING_SPEED_M_PER_MINUTE = 75;
const DEFAULT_ORIGIN = {
  name: "춘천 파밀리에 리버파크",
  lat: 37.8747077,
  lng: 127.713479,
};

const state = {
  rows: [],
  timetable: [],
  data: null,
  origin: null,
  destination: null,
  routes: [],
  category: "recommended",
  hasSearched: false,
  searchToken: 0,
  watchId: null,
  map: null,
  mapReady: false,
  originOverlay: null,
  destinationOverlay: null,
};

const $ = (selector) => document.querySelector(selector);

init();

async function init() {
  state.destination = readDestination();
  renderPlaces();
  bindEvents();
  await initKakaoMap();
  await loadData();
  startLocationWatch();
}

function bindEvents() {
  $("#refresh").addEventListener("click", () => {
    setStatus("현재 위치를 다시 확인하고 있어요.");
    state.hasSearched = false;
    startLocationWatch(true);
  });
  $("#search").addEventListener("click", calculateAndRender);
  document.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      document.querySelectorAll("[data-category]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      renderRoutes(getApiCategoryRoutes());
    });
  });
  $(".detail-close").addEventListener("click", () => {
    $("#route-detail").close();
  });
  $("#route-detail").addEventListener("click", (event) => {
    if (event.target === $("#route-detail")) $("#route-detail").close();
  });
}

async function loadData() {
  $("#loading").classList.add("hidden");
}

function startLocationWatch(force = false) {
  if (!navigator.geolocation) {
    useFallbackOrigin("이 브라우저는 현재 위치를 지원하지 않아 춘천 파밀리에 리버파크 기준으로 찾습니다.");
    return;
  }

  if (state.watchId !== null && !force) return;
  if (state.watchId !== null) navigator.geolocation.clearWatch(state.watchId);

  state.watchId = navigator.geolocation.watchPosition(
    (position) => {
      state.origin = {
        name: "내 실시간 위치",
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracyM: position.coords.accuracy,
        updatedAt: new Date(),
      };
      setStatus("내 실시간 위치 기준으로 경로를 계산합니다.");
      renderPlaces();
      calculateOnceAfterLocation();
    },
    () => useFallbackOrigin("위치 권한이 없어 춘천 파밀리에 리버파크 기준으로 찾습니다."),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
  );

  navigator.geolocation.getCurrentPosition(
    (position) => {
      state.origin = {
        name: "내 현재 위치",
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracyM: position.coords.accuracy,
        updatedAt: new Date(),
      };
      setStatus("내 현재 위치를 확인했습니다.");
      renderPlaces();
      calculateOnceAfterLocation();
    },
    () => useFallbackOrigin("위치 권한이 없어 춘천 파밀리에 리버파크 기준으로 찾습니다."),
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
}

function useFallbackOrigin(message) {
  state.origin = DEFAULT_ORIGIN;
  setStatus(message);
  renderPlaces();
  calculateOnceAfterLocation();
}

function calculateOnceAfterLocation() {
  if (state.hasSearched) return;
  state.hasSearched = true;
  calculateAndRender();
}

function readDestination() {
  const params = new URLSearchParams(window.location.search);
  const lat = Number(params.get("destLat"));
  const lng = Number(params.get("destLng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    showError("목적지 좌표가 없어 프로그램 화면에서 다시 길찾기를 눌러주세요.");
    return {
      name: "프로그램 기관",
      address: "",
      lat: DEFAULT_ORIGIN.lat,
      lng: DEFAULT_ORIGIN.lng,
    };
  }
  return {
    name: params.get("destName") || "프로그램 기관",
    address: params.get("destAddress") || "",
    lat,
    lng,
  };
}

function renderPlaces() {
  const origin = state.origin || readOriginFromQuery() || DEFAULT_ORIGIN;
  state.origin = origin;
  const originLink = $("#origin-map-link");
  originLink.textContent = origin.name;
  originLink.href = getKakaoMapUrl(origin);
  originLink.title = `${origin.name} 지도에서 보기`;
  $("#origin-accuracy").textContent = getOriginAccuracyText(origin);
  $("#destination-name").textContent = state.destination.name;
  $("#destination-address").textContent = state.destination.address;
  renderTransitMap();
}

function initKakaoMap() {
  const mapElement = $("#transit-map");
  if (!mapElement) return Promise.resolve();
  if (!window.kakao?.maps) {
    setMapStatus("카카오 지도 SDK를 불러오지 못했습니다. 네트워크 또는 앱 키 설정을 확인해주세요.");
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.kakao.maps.load(() => {
      const center = new window.kakao.maps.LatLng(
        state.origin?.lat || DEFAULT_ORIGIN.lat,
        state.origin?.lng || DEFAULT_ORIGIN.lng
      );
      state.map = new window.kakao.maps.Map(mapElement, {
        center,
        level: 5,
      });
      state.mapReady = true;
      renderTransitMap();
      resolve();
    });
  });
}

function renderTransitMap() {
  if (!state.mapReady || !state.map || !state.origin || !state.destination || !window.kakao?.maps) return;

  if (state.originOverlay) state.originOverlay.setMap(null);
  if (state.destinationOverlay) state.destinationOverlay.setMap(null);

  const originPosition = new window.kakao.maps.LatLng(state.origin.lat, state.origin.lng);
  const destinationPosition = new window.kakao.maps.LatLng(state.destination.lat, state.destination.lng);
  const bounds = new window.kakao.maps.LatLngBounds();
  bounds.extend(originPosition);
  bounds.extend(destinationPosition);

  state.originOverlay = new window.kakao.maps.CustomOverlay({
    map: state.map,
    position: originPosition,
    yAnchor: 1,
    content: transitMarker("origin", "내 위치"),
  });
  state.destinationOverlay = new window.kakao.maps.CustomOverlay({
    map: state.map,
    position: destinationPosition,
    yAnchor: 1,
    content: transitMarker("destination", "목적지"),
  });

  state.map.setBounds(bounds);
  setMapStatus(getMapStatusText(state.origin));
}

function transitMarker(type, label) {
  return `<div class="transit-map-marker ${type}"><span>${label}</span></div>`;
}

function getMapStatusText(origin) {
  if (Number.isFinite(origin.accuracyM)) {
    return `현재 브라우저 위치 기준입니다. 정확도 약 ${Math.round(origin.accuracyM)}m로 확인됐습니다.`;
  }
  if (origin.updatedAt === null) {
    return "메인 화면에서 전달된 위치 기준입니다. 위치 권한을 허용하면 실제 현재 위치로 갱신됩니다.";
  }
  return "기본 위치 기준입니다. 위치 권한을 허용하면 실제 현재 위치로 다시 계산됩니다.";
}

function setMapStatus(message) {
  const status = $("#map-status");
  if (status) status.textContent = message;
}

function readOriginFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const lat = Number(params.get("originLat"));
  const lng = Number(params.get("originLng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    name: params.get("originName") || "내 위치",
    lat,
    lng,
    updatedAt: null,
  };
}

function getKakaoMapUrl(place) {
  const name = encodeURIComponent(place.name || "내 위치");
  return `https://map.kakao.com/link/map/${name},${place.lat},${place.lng}`;
}

function getOriginAccuracyText(origin) {
  const parts = [];
  if (Number.isFinite(origin.accuracyM)) {
    parts.push(`정확도 약 ${Math.round(origin.accuracyM)}m`);
  }
  if (origin.updatedAt instanceof Date) {
    parts.push(`${new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(origin.updatedAt)} 갱신`);
  }
  if (!parts.length) return "지도에서 위치 확인";
  return parts.join(" · ");
}

async function calculateAndRender() {
  if (!state.origin || !state.destination) return;

  const token = state.searchToken + 1;
  state.searchToken = token;
  $("#loading").classList.remove("hidden");
  if (!state.data) $("#route-list").classList.add("hidden");
  $("#error").classList.add("hidden");
  $("#search").disabled = true;

  try {
    const response = await fetch("/transit-api/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: {
          name: state.origin.name,
          latitude: state.origin.lat,
          longitude: state.origin.lng,
          description: state.origin.name,
        },
        destination: {
          name: state.destination.name,
          latitude: state.destination.lat,
          longitude: state.destination.lng,
          description: state.destination.address,
        },
      }),
    });
    const payload = await response.json();
    if (token !== state.searchToken) return;
    if (!response.ok) throw new Error(payload.detail || payload.error || "경로 조회 실패");
    state.data = payload;
    $("#queried-at").textContent = `${payload.queried_at} 기준`;
    renderRoutes(getApiCategoryRoutes());
  } catch (error) {
    if (token !== state.searchToken) return;
    showError(`대중교통 API를 연결하지 못했습니다. ${error.message}`);
  } finally {
    if (token === state.searchToken) {
      $("#loading").classList.add("hidden");
      $("#search").disabled = false;
    }
  }
}

function findDirectRoutes(originStops, destinationStops) {
  const results = [];
  for (const originStop of originStops) {
    for (const destinationStop of destinationStops) {
      const originRows = state.rows.filter((row) => row.stopId === originStop.stopId);
      const destinationRows = state.rows.filter((row) => row.stopId === destinationStop.stopId);
      for (const originRow of originRows) {
        const destinationRow = destinationRows.find((row) =>
          row.routeId === originRow.routeId && row.sequence > originRow.sequence
        );
        if (!destinationRow) continue;
        const inVehicleMinutes = Math.max((destinationRow.cumulativeSeconds - originRow.cumulativeSeconds) / 60, 1);
        const walkingDistanceM = originStop.distanceM + destinationStop.distanceM;
        const originWalkingMinutes = originStop.distanceM / WALKING_SPEED_M_PER_MINUTE;
        const destinationWalkingMinutes = destinationStop.distanceM / WALKING_SPEED_M_PER_MINUTE;
        const nextBus = getNextBusInfo(originRow, originWalkingMinutes);
        if (!nextBus.availableToday) continue;
        const totalMinutes = nextBus.waitMinutes + inVehicleMinutes + destinationWalkingMinutes;
        results.push({
          type: "직통",
          routeNumber: originRow.routeNumber,
          originStop,
          destinationStop,
          inVehicleMinutes,
          walkingDistanceM,
          waitText: nextBus.waitText,
          boardingTime: nextBus.boardingTime,
          arrivalTime: new Date(Date.now() + totalMinutes * 60000),
          totalMinutes,
          legs: [`${originStop.name} 승차`, `${destinationStop.name} 하차`],
          segments: [{
            routeNumber: originRow.routeNumber,
            from: originStop.name,
            to: destinationStop.name,
            stopCount: destinationRow.sequence - originRow.sequence,
            minutes: inVehicleMinutes,
          }],
        });
      }
    }
  }
  return uniqueRoutes(results);
}

function findTransferRoutes(originStops, destinationStops) {
  const results = [];
  const rowsByRoute = groupBy(state.rows, (row) => row.routeId);
  for (const originStop of originStops.slice(0, 4)) {
    const originRows = state.rows.filter((row) => row.stopId === originStop.stopId);
    for (const destinationStop of destinationStops.slice(0, 4)) {
      const destinationRows = state.rows.filter((row) => row.stopId === destinationStop.stopId);
      for (const first of originRows) {
        const firstRouteRows = rowsByRoute.get(first.routeId) || [];
        const possibleTransfers = firstRouteRows.filter((row) => row.sequence > first.sequence);
        for (const secondDest of destinationRows) {
          const secondRouteRows = rowsByRoute.get(secondDest.routeId) || [];
          const transfer = possibleTransfers.find((candidate) =>
            secondRouteRows.some((row) => row.stopId === candidate.stopId && row.sequence < secondDest.sequence)
          );
          if (!transfer || first.routeId === secondDest.routeId) continue;
          const secondTransfer = secondRouteRows.find((row) => row.stopId === transfer.stopId && row.sequence < secondDest.sequence);
          const firstMinutes = Math.max((transfer.cumulativeSeconds - first.cumulativeSeconds) / 60, 1);
          const secondMinutes = Math.max((secondDest.cumulativeSeconds - secondTransfer.cumulativeSeconds) / 60, 1);
          const walkingDistanceM = originStop.distanceM + destinationStop.distanceM;
          const originWalkingMinutes = originStop.distanceM / WALKING_SPEED_M_PER_MINUTE;
          const destinationWalkingMinutes = destinationStop.distanceM / WALKING_SPEED_M_PER_MINUTE;
          const nextBus = getNextBusInfo(first, originWalkingMinutes);
          if (!nextBus.availableToday) continue;
          const totalMinutes = nextBus.waitMinutes + firstMinutes + 5 + secondMinutes + destinationWalkingMinutes;
          results.push({
            type: "환승 1회",
            routeNumber: `${first.routeNumber} → ${secondDest.routeNumber}`,
            originStop,
            destinationStop,
            inVehicleMinutes: firstMinutes + secondMinutes,
            walkingDistanceM,
            waitText: nextBus.waitText,
            boardingTime: nextBus.boardingTime,
            arrivalTime: new Date(Date.now() + totalMinutes * 60000),
            totalMinutes,
            legs: [`${originStop.name} 승차`, `${transfer.name} 환승`, `${destinationStop.name} 하차`],
            segments: [
              {
                routeNumber: first.routeNumber,
                from: originStop.name,
                to: transfer.name,
                stopCount: transfer.sequence - first.sequence,
                minutes: firstMinutes,
              },
              {
                routeNumber: secondDest.routeNumber,
                from: transfer.name,
                to: destinationStop.name,
                stopCount: secondDest.sequence - secondTransfer.sequence,
                minutes: secondMinutes,
              },
            ],
          });
        }
      }
    }
  }
  return uniqueRoutes(results).slice(0, 8);
}

function renderRoutes(routes) {
  const list = $("#route-list");
  list.innerHTML = "";
  if (!routes.length) {
    list.classList.remove("hidden");
    list.innerHTML = '<div class="empty-state">이 조건에 맞는 버스 경로가 없어요.</div>';
    return;
  }

  const template = $("#route-template");
  routes.slice(0, 9).forEach((route, index) => {
    const card = template.content.cloneNode(true);
    card.querySelector(".rank").textContent = index + 1;
    card.querySelector(".total-time").textContent = route.in_vehicle_text;
    card.querySelector(".route-type").textContent = route.transfer_count ? "환승 1회 경로" : "직통 경로";
    card.querySelector(".arrival strong").textContent = route.arrival_time || "시간 확인 중";
    card.querySelector(".arrival span").textContent = `버스 탑승 ${route.in_vehicle_text}`;
    card.querySelector(".tags").innerHTML = (route.tags || [])
      .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
      .join("");
    card.querySelector(".walk-breakdown").innerHTML = [
      ["출발 도보", route.origin_walking_distance_m],
      ...(route.transfer_count ? [["환승 도보", route.transfer_walking_distance_m]] : []),
      ["도착 도보", route.destination_walking_distance_m],
    ]
      .map(([label, distance]) => `<span><small>${label}</small><strong>${Math.round(distance)}m</strong></span>`)
      .join("");
    card.querySelector(".journey").innerHTML = route.segments
      .map((segment) => `
        <div class="segment">
          <span class="segment-bus">${escapeHtml(shortBusNumber(segment.route_numbers?.[0] || ""))}</span>
          <span class="segment-copy">
            <strong>${escapeHtml(segment.boarding_stop)} → ${escapeHtml(segment.alighting_stop)}</strong>
            <small>${escapeHtml(compactNumbers(segment.route_numbers || []))}번${getApiArrivalMarkup(segment)}</small>
            <small>${segment.stop_count}개 정류장 · 탑승 ${escapeHtml(segment.in_vehicle_text)}</small>
          </span>
        </div>
      `)
      .join("");
    card.querySelector(".ride-time").textContent = route.in_vehicle_text;
    card.querySelector(".walk-distance").textContent = `${Math.round(route.walking_distance_m)}m`;
    card.querySelector(".transfer-count").textContent = route.transfer_count ? "1회" : "없음";
    const routeCard = card.querySelector(".route-card");
    routeCard.tabIndex = 0;
    routeCard.setAttribute("role", "button");
    routeCard.setAttribute("aria-label", `버스 탑승 ${route.in_vehicle_text} 경로 상세 보기`);
    routeCard.addEventListener("click", () => openRouteDetail(route));
    routeCard.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openRouteDetail(route);
      }
    });
    list.appendChild(card);
  });
  list.classList.remove("hidden");
}

function timelineNode(type, title, subtitle = "") {
  const row = document.createElement("section");
  row.className = `timeline-node ${type}`;
  row.innerHTML = `
    <span class="timeline-icon"></span>
    <div class="timeline-copy">
      <strong>${escapeHtml(title)}</strong>
      ${subtitle ? `<small>${escapeHtml(subtitle)}</small>` : ""}
    </div>`;
  return row;
}

function walkingNode(distance, minutes, label = "도보") {
  return timelineNode(
    "walking",
    `${label} ${Math.round(distance)}m`,
    `${Math.max(Math.round(minutes), 1)}분 예상`
  );
}

function busQualifier(number) {
  const match = String(number).match(/\(([^)]+)\)/);
  if (!match) return "";
  return match[1].replace(/경유$/, " 경유");
}

function busNode(segment) {
  const row = timelineNode(
    "bus-leg",
    `${segment.boarding_stop} ${segment.boarding_stop_number || ""}`,
    `${segment.alighting_stop}에서 하차`
  );
  const copy = row.querySelector(".timeline-copy");
  const options = document.createElement("div");
  options.className = "bus-options";
  const busOptions = segment.bus_options?.length
    ? segment.bus_options
    : (segment.route_numbers || []).map((routeNumber) => ({ route_number: routeNumber }));

  const appendOption = (container, option, realtime = null) => {
    const item = document.createElement("div");
    if (realtime) item.classList.add("realtime-option");
    const qualifier = busQualifier(option.route_number);
    item.innerHTML = `
      <b title="${escapeHtml(option.route_number)}">${escapeHtml(shortBusNumber(option.route_number))}</b>
      <span>${escapeHtml(option.wait_text || option.boarding_time || "도착정보 없음")}</span>
      ${qualifier ? `<small class="route-qualifier">${escapeHtml(qualifier)}</small>` : ""}`;
    container.appendChild(item);
  };

  const realtime = segment.realtime_arrivals?.[0];
  if (realtime) {
    appendOption(
      options,
      {
        route_number: segment.route_numbers?.[0] || "",
        wait_text: realtimeWaitText(realtime.arrival_seconds, realtime.remaining_stop_count),
      },
      realtime
    );
  } else {
    busOptions.slice(0, 3).forEach((option) => appendOption(options, option));
  }
  if (!realtime && busOptions.length > 3) {
    const more = document.createElement("details");
    more.className = "bus-option-more";
    more.innerHTML = `<summary>같은 경로 버스 ${busOptions.length - 3}대 더 보기</summary>`;
    busOptions.slice(3).forEach((option) => appendOption(more, option));
    options.appendChild(more);
  }
  copy.appendChild(options);

  const alighting = document.createElement("div");
  alighting.className = "alighting-summary";
  alighting.innerHTML = `
    <span>하차</span>
    <strong>${escapeHtml(segment.alighting_stop)}</strong>
    ${segment.alighting_stop_number ? `<small>${escapeHtml(segment.alighting_stop_number)}</small>` : ""}`;
  copy.appendChild(alighting);

  const stops = segment.stops || [];
  if (stops.length) {
    const details = document.createElement("details");
    details.className = "stop-details";
    const intermediateCount = Math.max(stops.length - 2, 0);
    details.innerHTML = `
      <summary>${stops.length}개 정류장 · ${escapeHtml(segment.in_vehicle_text)}
        <span>${intermediateCount ? "자세히 보기" : ""}</span>
      </summary>
      <ol>${stops
        .map((stop, index) =>
          `<li class="${index === 0 || index === stops.length - 1 ? "terminal" : ""}">
            <span>${escapeHtml(stop.name)}</span>
            ${stop.number ? `<small>${escapeHtml(stop.number)}</small>` : ""}
          </li>`
        )
        .join("")}</ol>`;
    copy.appendChild(details);
  }
  return row;
}

function openRouteDetail(route) {
  const dialog = $("#route-detail");
  $("#detail-total-time").textContent = route.in_vehicle_text;
  $("#detail-arrival").textContent = `${route.arrival_time || "시간 확인 중"} 도착 예정`;
  $("#detail-tags").innerHTML = (route.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");

  const timeline = $("#detail-timeline");
  timeline.innerHTML = "";
  timeline.appendChild(timelineNode("start", state.data?.origin?.name || "내 위치", state.data?.origin?.description || ""));
  timeline.appendChild(walkingNode(route.origin_walking_distance_m, route.origin_walking_minutes));

  route.segments.forEach((segment, index) => {
    timeline.appendChild(busNode(segment));
    if (index < route.segments.length - 1) {
      timeline.appendChild(walkingNode(route.transfer_walking_distance_m, route.transfer_walking_minutes, "환승 도보"));
    }
  });

  timeline.appendChild(walkingNode(route.destination_walking_distance_m, route.destination_walking_minutes));
  timeline.appendChild(timelineNode("destination", state.data?.destination?.name || "목적지", state.data?.destination?.description || ""));
  dialog.showModal();
}

function getApiCategoryRoutes() {
  const category = state.data?.categories?.[state.category];
  return category?.routes || [];
}

function getApiArrivalText(segment) {
  const realtime = segment.realtime_arrivals?.[0];
  if (realtime) {
    return ` · ${realtimeWaitText(realtime.arrival_seconds, realtime.remaining_stop_count)}`;
  }
  const option = segment.bus_options?.[0];
  if (option?.wait_text) return ` · ${option.wait_text}`;
  if (option?.boarding_time) return ` · ${option.boarding_time}`;
  return "";
}

function getApiArrivalMarkup(segment) {
  const realtime = segment.realtime_arrivals?.[0];
  if (realtime) {
    return ` <span class="realtime-arrival">${escapeHtml(realtimeWaitText(realtime.arrival_seconds, realtime.remaining_stop_count))}</span>`;
  }
  return escapeHtml(getApiArrivalText(segment));
}

function compactNumbers(numbers) {
  if (numbers.length <= 2) return numbers.join(", ");
  return `${numbers.slice(0, 2).join(", ")} 외 ${numbers.length - 2}개`;
}

function shortBusNumber(number) {
  const text = String(number).trim();
  const qualifierIndex = text.indexOf("(");
  return qualifierIndex > 0 ? text.slice(0, qualifierIndex).trim() : text;
}

function realtimeWaitText(seconds, remainingStopCount) {
  const safeSeconds = Math.max(Math.ceil(seconds), 0);
  const minutes = Math.max(Math.ceil(safeSeconds / 60), 1);
  const stopText = remainingStopCount != null ? ` (${remainingStopCount}정거장 전)` : "";
  const timeText = `${minutes}분 후`;
  return `${timeText}${stopText}`;
}

function sortRoutes(routes, category) {
  const sorted = [...routes];
  if (category === "fastest") {
    return sorted.sort((a, b) => a.totalMinutes - b.totalMinutes || a.walkingDistanceM - b.walkingDistanceM);
  }
  if (category === "direct") {
    return sorted.sort((a, b) =>
      Number(a.type !== "직통") - Number(b.type !== "직통") ||
      a.totalMinutes - b.totalMinutes
    );
  }
  if (category === "least-walking") {
    return sorted.sort((a, b) => a.walkingDistanceM - b.walkingDistanceM || a.totalMinutes - b.totalMinutes);
  }
  return sorted.sort((a, b) =>
    Number(a.totalMinutes > 30) - Number(b.totalMinutes > 30) ||
    a.totalMinutes - b.totalMinutes ||
    a.walkingDistanceM - b.walkingDistanceM
  );
}

function getRouteTags(route) {
  const tags = [];
  if (route.totalMinutes <= 30) tags.push("30분 안팎");
  tags.push(route.type);
  if (route.walkingDistanceM <= 700) tags.push("도보 짧음");
  if (route.waitText !== "시간표 확인 필요") tags.push("시간표 반영");
  return tags;
}

function formatArrivalTime(arrival) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(arrival);
}

function getNextBusInfo(routeRow, originWalkingMinutes = 0) {
  const now = new Date();
  const day = getServiceDay(now);
  const earliestBoarding = new Date(now.getTime() + Math.ceil(originWalkingMinutes) * 60000);
  const routeTimes = state.timetable.filter((row) => row.routeId === routeRow.routeId && row.serviceDay === day);
  const candidates = routeTimes
    .map((row) => {
      const [hour, minute] = row.departureTime.split(":").map(Number);
      const departure = new Date(now);
      departure.setHours(hour, minute, 0, 0);
      return new Date(departure.getTime() + routeRow.cumulativeSeconds * 1000);
    })
    .filter((arrival) => arrival >= earliestBoarding && isSameDate(arrival, now))
    .sort((a, b) => a - b);
  if (!candidates.length) {
    return {
      availableToday: false,
      boardingTime: null,
      waitMinutes: Infinity,
      waitText: "오늘 운행 종료",
    };
  }
  const minutes = Math.max(Math.round((candidates[0] - now) / 60000), 0);
  return {
    availableToday: true,
    boardingTime: candidates[0],
    waitMinutes: minutes,
    waitText: `${minutes}분 후 예상`,
  };
}

function isSameDate(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function getServiceDay(date) {
  const day = date.getDay();
  if (day === 0) return "휴일";
  if (day === 6) return "토요일";
  return "평일";
}

function getNearestStops(place, rows, limit, maxDistanceM) {
  const stops = new Map();
  for (const row of rows) {
    if (stops.has(row.stopId)) continue;
    const distanceM = haversine(place.lat, place.lng, row.lat, row.lng);
    if (distanceM > maxDistanceM) continue;
    stops.set(row.stopId, {
      stopId: row.stopId,
      name: row.name,
      number: row.number,
      lat: row.lat,
      lng: row.lng,
      distanceM,
    });
  }
  return Array.from(stops.values()).sort((a, b) => a.distanceM - b.distanceM).slice(0, limit);
}

function parseRouteStops(rows) {
  return rows
    .map((row) => ({
      routeId: row["노선"],
      routeNumber: row["노선번호"],
      sequence: Number(row["정류장순서"]),
      stopId: row["정류장"],
      number: row["정류장 번호"],
      name: row["정류장명"],
      lng: Number(row["경도"]),
      lat: Number(row["위도"]),
      cumulativeSeconds: Number(row["누적예상시간_초"]),
    }))
    .filter((row) =>
      row.routeId && row.stopId && row.name && Number.isFinite(row.lat) && Number.isFinite(row.lng)
    );
}

function parseTimetable(rows) {
  return rows
    .map((row) => ({
      routeId: row.route_id,
      routeNumber: row.route_no,
      serviceDay: row.service_day,
      departureTime: row.departure_time,
    }))
    .filter((row) => row.routeId && row.serviceDay && row.departureTime);
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} 로드 실패`);
  return response.text();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  row.push(value);
  if (row.some((cell) => cell !== "")) rows.push(row);

  const headers = rows.shift() || [];
  return rows.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), (cells[index] || "").trim()]))
  );
}

function groupBy(items, getKey) {
  const map = new Map();
  for (const item of items) {
    const key = getKey(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function uniqueRoutes(routes) {
  const seen = new Set();
  return routes.filter((route) => {
    const key = `${route.type}|${route.routeNumber}|${route.originStop.stopId}|${route.destinationStop.stopId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function haversine(lat1, lng1, lat2, lng2) {
  const radius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(value) {
  return value * Math.PI / 180;
}

function setStatus(message) {
  $("#location-status").textContent = message;
}

function showError(message) {
  $("#loading").classList.add("hidden");
  $("#error").textContent = message;
  $("#error").classList.remove("hidden");
  if (!state.data) $("#route-list").classList.add("hidden");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
