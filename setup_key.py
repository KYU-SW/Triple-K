"""로컬 PowerShell에서 한 번 실행해 API 키를 .env에 저장한다."""
from argparse import ArgumentParser
from getpass import getpass
from pathlib import Path

from dotenv import set_key

ENV_FILE = Path(__file__).with_name(".env")


def save_key(key, env_file=ENV_FILE, *, google_places=False):
    key = key.strip()
    if not key or any(character.isspace() for character in key):
        raise ValueError("API 키는 공백 없이 입력해 주세요.")
    if google_places:
        set_key(str(env_file), "GOOGLE_MAPS_BROWSER_KEY", key, encoding="utf-8")
        return
    set_key(str(env_file), "OPENAI_API_KEY", key, encoding="utf-8")
    set_key(str(env_file), "OPENAI_API_ACTIVE_UNTIL", "2026-12-15", encoding="utf-8")


if __name__ == "__main__":
    parser = ArgumentParser(description="API 키를 프로젝트의 .env에 저장합니다.")
    parser.add_argument("--google-places", action="store_true", help="Google Places 브라우저용 키 저장")
    args = parser.parse_args()
    label = "Google Places 브라우저용 API 키" if args.google_places else "OpenAI API 키"
    try:
        save_key(getpass(f"{label} (입력 내용은 화면에 표시되지 않음): "), google_places=args.google_places)
    except (EOFError, KeyboardInterrupt):
        print("설정을 취소했어요.")
    except ValueError:
        print("API 키를 저장하지 않았어요. 공백 없이 입력해 주세요.")
    except OSError:
        print(".env 파일을 저장하지 못했어요. 프로젝트 폴더의 쓰기 권한을 확인해 주세요.")
    else:
        print("API 키를 .env에 저장했어요. 컴퓨터를 다시 켜도 재입력이 필요하지 않아요.")
        if not args.google_places:
            print("이 앱의 API 사용 종료일: 2026-12-15 (한국 시간). 서버를 재시작해 주세요.")
