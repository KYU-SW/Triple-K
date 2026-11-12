const nearby = document.querySelector('#nearby-counseling');
const mapsKey = nearby.dataset.mapsKey;
const status = document.querySelector('#counseling-status');
const areaForm = document.querySelector('#counseling-area');
const district = document.querySelector('#counseling-district');
const query = '심리상담센터';

function currentLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({coords}) => resolve({lat: coords.latitude, lng: coords.longitude}),
      reject,
      {enableHighAccuracy: false, maximumAge: 0, timeout: 20000},
    );
  });
}

let placesLibrary;
function loadPlaces() {
  placesLibrary ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const params = new URLSearchParams({
      key: mapsKey, loading: 'async', callback: 'firstStepMapsReady', language: 'ko', region: 'KR',
    });
    setTimeout(() => reject(new Error('Maps load timeout')), 12000);
    window.firstStepMapsReady = () => resolve(window.google.maps.importLibrary('places'));
    window.gm_authFailure = () => reject(new Error('Maps authentication failed'));
    script.onerror = () => reject(new Error('Maps load failed'));
    script.src = 'https://maps.googleapis.com/maps/api/js?' + params;
    script.async = true;
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    document.head.append(script);
  });
  return placesLibrary;
}

function distanceScore(origin, location) {
  const radians = Math.PI / 180;
  const latitude = location.lat() * radians;
  const originLatitude = origin.lat * radians;
  const longitudeDifference = (location.lng() - origin.lng) * radians;
  // The haversine term increases with great-circle distance.
  return Math.sin((latitude - originLatitude) / 2) ** 2 +
    Math.cos(latitude) * Math.cos(originLatitude) * Math.sin(longitudeDifference / 2) ** 2;
}

function offerAreaSearch(message) {
  status.textContent = message;
  areaForm.hidden = false;
}

nearby.addEventListener('click', async () => {
  if (!mapsKey) {
    offerAreaSearch('현재 위치로 검색하는 기능이 설정되어 있지 않아요. 시·군·구를 입력해 검색할 수 있어요.');
    return;
  }

  if (!window.isSecureContext || !navigator.geolocation) {
    offerAreaSearch('이 주소에서는 위치를 사용할 수 없어요. 이 컴퓨터에서 http://127.0.0.1:5000으로 열거나 HTTPS 주소를 사용해 주세요. 시·군·구를 직접 검색할 수도 있어요.');
    return;
  }

  nearby.disabled = true;
  areaForm.hidden = true;
  status.textContent = '현재 위치를 확인하고 있어요.';

  try {
    let origin;
    try {
      origin = await currentLocation();
    } catch (error) {
      const messages = {
        1: '위치 사용이 허용되지 않았어요. 브라우저 주소창의 사이트 설정과 기기의 위치 권한을 확인해 주세요.',
        2: '기기가 현재 위치 정보를 제공하지 못했어요. 기기의 위치 서비스와 인터넷 연결을 확인해 주세요.',
        3: '20초 안에 위치를 확인하지 못했어요. 위치 서비스가 켜져 있는지 확인하고 다시 눌러 주세요.',
      };
      const message = messages[error?.code] ?? '브라우저에서 현재 위치를 가져오지 못했어요.';
      offerAreaSearch(message + ' 시·군·구를 입력해 직접 검색할 수 있어요.');
      return;
    }
    status.textContent = 'Google에서 주변 심리상담센터를 검색하고 있어요.';
    const {Place} = await loadPlaces();
    const {places} = await Place.searchByText({
      textQuery: query,
      fields: ['location', 'googleMapsURI'],
      locationBias: origin,
      language: 'ko',
      region: 'kr',
      maxResultCount: 20,
    });

    let nearest;
    let bestDistance = Infinity;
    for (const place of places) {
      if (!place.location) continue;
      const distance = distanceScore(origin, place.location);
      if (distance >= bestDistance) continue;
      nearest = place;
      bestDistance = distance;
    }
    if (!nearest) {
      offerAreaSearch('가까운 심리상담센터 검색 결과가 없어요. 시·군·구를 입력해 검색할 수 있어요.');
      return;
    }
    if (!nearest.googleMapsURI) throw new Error('Missing Google Maps URL');
    window.location.assign(nearest.googleMapsURI);
  } catch {
    offerAreaSearch('Google Places 검색을 완료하지 못했어요. 시·군·구를 입력해 검색할 수 있어요.');
  } finally {
    nearby.disabled = false;
  }
});

district.addEventListener('input', () => district.setCustomValidity(''));
areaForm.addEventListener('submit', event => {
  event.preventDefault();
  const area = district.value.trim();
  if (!area) {
    district.setCustomValidity('시·군·구 이름을 입력해 주세요.');
    district.reportValidity();
    return;
  }
  const params = new URLSearchParams({q: area + ' ' + query});
  window.location.assign('https://www.google.com/search?' + params);
});
