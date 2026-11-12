# 첫걸음

## 휴대폰에서 열기

PC와 휴대폰을 같은 Wi-Fi에 연결한 뒤 `휴대폰으로 열기.cmd`를 실행하세요.
또는 `.\.venv\Scripts\python.exe start_mobile.py`로 실행할 수 있습니다.
휴대폰 브라우저에서 `http://PC의-Wi-Fi-IPv4주소:5001`을 여세요.
PC의 IPv4 주소는 PowerShell의 `ipconfig`로 확인할 수 있고 네트워크가 바뀌면 달라질 수 있습니다.
PC가 켜져 있고 서버가 실행 중이어야 합니다. Windows 방화벽 알림이 나타나면 신뢰하는 네트워크에서 접근을 허용하세요.
이 실행 방식은 같은 네트워크에 앱을 공개합니다. 할 일 내용은 OpenAI에 전송되며 다른 이용자의 호출에도 서버의 API 키가 사용됩니다.

과제를 시작하기 어려운 대학생이 작은 행동부터 시도하도록 돕는 Flask MVP입니다.
할 일 입력 → Flask → OpenAI API → 행동 카드 3개의 흐름을 구현했습니다.
로그인, 데이터베이스, 사용자 기록 저장은 없습니다.

## 현재 파일 구성

```text
first-step/
├── app.py                 # 분할·재분할·다음 행동 API와 서버 검증
├── setup_key.py           # API 키를 한 번 입력해 .env에 저장
├── requirements.txt       # Python 의존성
├── .env.example           # API 키·모델·학교 링크 설정 예시
├── .gitignore
├── README.md
├── templates/index.html   # 한국어 화면, 난이도 버튼, 전문 지원 안내
└── tests/
    ├── test_app.py         # Flask/API 응답 처리 모의 테스트
    └── test_ui.cjs         # JavaScript 화면 로직 모의 테스트
```

로컬의 `.preview.html`은 최신 화면을 확인하기 위한 정적 미리보기이며 Git에서 제외됩니다.
파일을 직접 열면 서버 API를 사용할 수 없으므로, 행동 생성과 난이도 변경은 Flask 접속 주소에서 확인하세요.

## 구성

- Python 3.10 이상, Flask, 순수 HTML/CSS/JavaScript
- LLM 제공자: **OpenAI** / 기본 모델: **gpt-4.1-mini**
- API 키는 특정 모델을 고정하지 않습니다. 서버가 `OPENAI_MODEL` 값으로 요청 모델을 선택합니다.
- 2026-11-09 실제 키로 짧은 테스트 요청을 보낸 결과, 요청 모델 `gpt-4.1-mini`의 응답 모델은 `gpt-4.1-mini-2025-04-14`였습니다. 같은 모델의 구체적인 버전명이므로 설정은 변경하지 않았습니다.
- `OPENAI_MODEL`로 모델 변경 가능. Chat Completions 및 Structured Outputs를 지원하는 모델이 필요합니다.
- JSON Schema의 `strict: true`와 Pydantic 서버 검증을 함께 사용합니다.
- 정상 결과는 행동 정확히 3개, 시간은 2~5 사이 정수입니다. 시간은 전체 과제의 완료 시간을 뜻하지 않습니다.

## Windows PowerShell 실행

Python 3.10 이상이 설치되어 있어야 합니다. `py`가 없고 `python`만 있으면 아래 `py`를 `python`으로 바꾸세요.

```powershell
cd D:\codex\first-run\first-step
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
if (!(Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

`.env`의 `OPENAI_API_KEY=` 뒤에 본인의 키를 입력해 저장하세요. `.env`는 Git에서 제외됩니다.
모델과 학교 링크도 같은 파일에 설정할 수 있습니다.

키를 화면에 표시하지 않고 저장하려면 메모장 대신 다음 도구를 한 번 실행하세요.

```powershell
.\.venv\Scripts\python.exe setup_key.py
```

입력한 키는 로컬 `.env`에 저장되므로 컴퓨터를 껐다 켜도 다시 입력할 필요가 없습니다.
키 입력 시 화면에는 아무 글자도 표시되지 않습니다. 붙여넣은 뒤 Enter를 누르세요.
이 도구는 키와 사용 종료일을 설정하며, 모델명·학교 링크 등 다른 설정은 유지합니다.
`.env`에는 키가 평문으로 저장되므로 이 파일을 공유하거나 Git에 추가하지 마세요.
재부팅 후에는 서버 실행 명령만 다시 실행하면 됩니다. 서버의 자동 시작은 포함하지 않습니다.

```dotenv
OPENAI_API_KEY=여기에_본인의_키_입력
OPENAI_MODEL=gpt-4.1-mini
OPENAI_API_ACTIVE_UNTIL=2026-12-15
CAMPUS_SUPPORT_URL=
```

`OPENAI_API_ACTIVE_UNTIL`은 한국 시간 기준 사용 가능한 마지막 날짜입니다.
기본값은 **2026-12-15**이며, **2026-12-16 00:00부터** 모든 AI API 요청을 차단합니다.
날짜 형식이 잘못되면 호출을 허용하지 않고 설정 오류를 표시합니다.
종료일 이후에도 메인 화면과 전문 지원 안내는 열립니다. 종료 직전에 시작한 요청은 완료될 수 있습니다.
이는 이 앱의 호출 제한이며 OpenAI 계정의 키 자체를 만료·폐기하지 않습니다.
다른 앱에서도 키 사용을 중단하려면 종료 후 OpenAI의 API 키 관리 화면에서 해당 키를 폐기하세요.
[OpenAI API 키 관리 안내](https://developers.openai.com/api/docs/guides/api-keys)

건양대학교 학생상담센터 주소가 기본으로 설정되어 있어 별도 입력이 필요하지 않습니다.
`CAMPUS_SUPPORT_URL`을 비워도 https://kyucounsel.konyang.ac.kr/kyucounsel.do 링크가 표시됩니다.
다른 공식 상담센터로 변경할 때만 이 설정을 수정하세요. http/https 주소만 허용합니다.
전문 지원 안내에는 정신건강 위기상담전화, 보건복지상담센터, 자살예방 상담전화도 표시됩니다.

가상환경 활성화 없이 아래 명령으로 실행할 수 있습니다. PowerShell 실행 정책 변경이 필요하지 않습니다.

```powershell
.\.venv\Scripts\python.exe app.py
```

접속: **http://127.0.0.1:5000** / 종료: `Ctrl+C`
서버는 로컬 주소에만 바인딩하며 디버그 모드는 꺼져 있습니다. Flask 개발 서버를 사용합니다.

이미 가상환경과 `.env`를 설정했다면 초기 설치는 반복할 필요가 없습니다.
파일 수정 후 실행 중인 서버에서 `Ctrl+C`를 누른 뒤 위 실행 명령으로 재시작하고,
브라우저에서 `Ctrl+F5`로 새로고침하세요. 디버그 모드가 꺼져 있어 서버 코드는 자동으로 다시 로드되지 않습니다.

`.env` 대신 현재 PowerShell 프로세스의 환경 변수로 설정할 수도 있습니다. 같은 항목이 있으면 프로젝트의 `.env` 값이 우선합니다.
`.env`를 저장한 뒤에는 서버 재시작 없이 다음 요청부터 적용됩니다. 상담센터 링크는 브라우저를 새로고침하면 반영됩니다.
메모장에서는 `D:\codex\first-run\first-step\.env`를 열고 저장하세요. `.env.txt` 또는 `.env.example`에 저장한 내용은 읽지 않습니다.
아래 방법만 사용하면 터미널을 닫거나 컴퓨터를 재시작할 때 키 설정이 사라집니다.
재입력을 피하려면 위의 `setup_key.py` 또는 `.env` 저장 방식을 사용하세요.
아래 방식은 API 키를 명령 기록에 직접 적지 않도록 숨김 입력을 사용합니다.

```powershell
$keyInput = Read-Host 'OpenAI API 키' -AsSecureString
$env:OPENAI_API_KEY = [System.Net.NetworkCredential]::new('', $keyInput).Password
$env:OPENAI_MODEL = 'gpt-4.1-mini'
.\.venv\Scripts\python.exe app.py
```

API 키가 없어도 메인 화면과 전문 지원 안내는 열립니다. 행동 생성은 설정 오류로 안내되며 가짜 결과를 반환하지 않습니다.

## API

`POST /api/split`, `Content-Type: application/json`

```json
{"task":"보고서 작성하기"}
```

`POST /api/refine`: 현재 카드 하나를 같은 형식의 더 쉬운 행동 3개로 교체합니다.
이미 작은 행동이라면 준비 단계나 더 쉬운 시작 행동을 제안하도록 지시합니다.
서버는 상태를 저장하지 않으므로 원래 할 일과 대상 행동을 함께 보내야 합니다.

```json
{
  "task": "보고서 작성하기",
  "step": {
    "title": "보고서 파일 열기",
    "description": "문서 작성 도구를 열고 빈 문서를 준비해요.",
    "minutes": 2,
    "completion_criteria": "빈 문서가 화면에 열려 있어요."
  }
}
```

`POST /api/advance`: ‘쉬워요’ 버튼으로 선택한 행동에서 이어갈 조금 더 도전적인 다음 행동 3개를 제안합니다.
요청 본문은 `/api/refine`과 동일한 `task`, `step` 형식입니다. 시간은 각 2~5분으로 유지하고,
‘쉬워요’를 완료 표시로 취급하거나 행동을 끝냈다고 단정하지 않습니다.

세 API의 성공 응답은 다음 형태입니다. 아래는 형식 설명용이며 실제 결과로 제공되지 않습니다.

```text
{"steps":[{title, description, minutes, completion_criteria} × 3], "feedback":"피드백 한 줄"}
```

실패 응답: `{"error":{"code":"오류 코드","message":"한국어 안내"}}`

- 400: 빈 입력, 1,000자 초과, 잘못된 JSON·행동
- 403: 한국 시간 기준 API 사용 기간 종료
- 413: 전체 요청 본문 16KiB 초과
- 422: 모델의 응답 거절
- 429: 호출 제한·사용 한도
- 502: 연결·외부 서비스 오류, 잘못되거나 불완전한 모델 응답
- 503: API 키 누락·인증 오류, 종료일 설정 오류
- 504: AI 호출 시간 초과 (SDK 타임아웃 25초, 자동 재시도 없음)

## 화면 동작과 범위

- 카드마다 제목·설명·예상 시간·완료 기준과 ‘어려워요’, ‘쉬워요’ 버튼이 있습니다.
- ‘어려워요’는 더 쉬운 시작 행동 3개로, ‘쉬워요’는 조금 더 도전적인 다음 행동 3개로 바꿉니다.
- 두 기능 모두 요청 중에는 대상 행동 제목을 표시하고, 성공하면 현재 카드 3개를 교체합니다. 실패하면 이전 결과를 유지합니다.
- 로딩 중 중복 요청 방지, 브라우저 요청 제한 35초, 실패 후 버튼 복구를 구현했습니다.
- 전문 지원 안내는 상단 헤더와 할 일 입력창 바로 위의 강조 배너에서 접근할 수 있습니다. 하단 고정 링크도 항상 표시되며 모두 실제 안내 영역으로 이동합니다.
- 사용자 및 모델 텍스트는 `textContent` 또는 텍스트 노드로만 표시합니다.
- 입력과 결과는 앱의 DB·파일·브라우저 저장소에 저장하지 않습니다. 화면을 새로 고치면 사라집니다.
- 입력은 OpenAI에 전송됩니다. `store=False`로 요청하며, 제공자 측 데이터 처리는 OpenAI 정책을 따릅니다.
- 원문 입력·응답·예외·API 키는 앱 로그에 남기지 않습니다. 로그에는 고정된 오류 코드만 기록합니다.
- 입력을 작업 데이터로 분리하고 규칙 변경 지시를 무시하도록 프롬프트에 명시했습니다. 의미의 적절성은 모델에 의존하며 형식 검증이 의미까지 보장하지는 않습니다.
- 진단, 치료 효과, 위험도 판단 기능은 없습니다.

## 지역 상담기관 검색

전문 지원 안내의 **지역 상담기관** 버튼을 누르면 브라우저에 현재 위치를 한 번 요청합니다. 위치는 Google Places 검색에 전달되며 첫걸음은 저장하지 않습니다. ‘심리상담센터’ 결과 중 좌표가 있는 곳을 직선거리로 비교해 가장 가까운 기관의 Google 지도 상세 화면을 현재 탭에 엽니다. Places 미설정, 위치 확인 실패·거부, 검색 실패·결과 없음에는 시·군·구 직접 검색을 제공합니다.

1. Google Cloud 프로젝트에 결제를 연결하고 **Maps JavaScript API**와 **Places API (New)**를 활성화합니다.
2. 브라우저용 API 키에 두 API와 접속할 웹사이트 주소(예: `http://127.0.0.1:5000/*`)를 제한으로 등록합니다. 배포 환경의 위치 기능에는 HTTPS가 필요합니다.
3. Flask 프로젝트 폴더에서 아래 명령을 실행하고 브라우저용 키를 입력합니다. 입력 내용은 화면에 표시되지 않습니다. 키는 프로젝트의 `.env`에 저장되어 터미널을 닫거나 컴퓨터를 재부팅해도 유지됩니다. 앱은 페이지를 열 때 이 키를 브라우저에 전달합니다.

```powershell
.\.venv\Scripts\python.exe setup_key.py --google-places
```

[Google Places 텍스트 검색 설정](https://developers.google.com/maps/documentation/javascript/place-search)

## 검증

외부 API 호출 없이 모의 응답으로 서버를 검증할 수 있습니다.

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Node.js가 있으면 브라우저 로직 모의 테스트도 실행할 수 있습니다. 실제 DOM 렌더링·Flask 검증과는 별개입니다.

```powershell
node tests/test_ui.cjs
```

실제 API 연결 확인: 키 설정 후 화면에 ‘보고서 작성하기’를 입력하고 카드 3개가 나오는지 확인하세요.
이어서 카드의 ‘어려워요’와 ‘쉬워요’를 각각 눌러 대상 제목, 변경 방향과 새로운 카드 3개를 확인하세요.
테스트의 모의 응답은 테스트에서만 사용하며 서비스에는 대체 결과 생성 기능이 없습니다.

현재 확인 결과(2026-11-09): Flask·설정 모의 테스트 15개와 JavaScript 모의 테스트가 통과했습니다.
‘쉬워요’의 요청 대상·다음 행동 지시·잘못된 응답 처리와 두 난이도 버튼의 요청 중 비활성화·실패 후 복구를 포함합니다.
키 저장 시 기존 설정 보존, 한국 시간 기준 종료일 경계, 종료 후 세 API의 호출 차단도 확인했습니다.
2026-11-09 실제 OpenAI API에 짧은 테스트 요청 1회를 보내 인증·응답 모델을 확인했습니다.
이 확인은 전체 행동 분할·재분할 흐름의 실호출 검증과는 별개입니다. 실제 브라우저에서의 시각적 렌더링은 검증하지 않았습니다.

OpenAI 연동 참고: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=chat), [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini).
