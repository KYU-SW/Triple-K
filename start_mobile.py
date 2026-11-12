"""같은 Wi-Fi의 휴대폰에서도 접속할 수 있는 로컬 서버."""
from app import app


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
