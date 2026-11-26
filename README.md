# 아파트세금계산기 (apttaxcalc.com)

도메인: apttaxcalc.com (Cloudflare Registrar에서 구입)

- `public/` : 사이트 파일 (그대로 공개됨)
- `functions/api/gongsi.js` : 동·호수로 공시가격을 찾는 서버 함수 (Cloudflare Pages Functions)

## 올리는 방법 (Cloudflare Pages + GitHub)
1. GitHub에서 새 저장소를 만들고, 이 폴더의 파일을 모두 올립니다 (웹에서 끌어다 놓기 가능).
2. Cloudflare 대시보드 → Workers & Pages → 만들기 → Pages → **Git에 연결** → 저장소 선택.
3. 빌드 설정: 프레임워크 `없음`, 빌드 명령 `비워 둠`, 빌드 출력 디렉터리 `public`.
4. 설정 → 환경 변수(Variables and Secrets)에 추가:
   - `VWORLD_KEY` = 브이월드 인증키 (Secret으로)
   - `VWORLD_DOMAIN` = apttaxcalc.com (인증키에 등록한 도메인과 똑같이)
5. 다시 배포하면 끝.

## 도메인 연결 (Cloudflare에서 산 경우)
1. Pages 프로젝트 → 사용자 지정 도메인(Custom domains) → apttaxcalc.com 추가 → 자동 연결.
2. www.apttaxcalc.com 도 추가하면 www로 들어와도 열립니다.

※ Cloudflare 대시보드의 "끌어다 놓기(Direct Upload)"는 서버 함수를 지원하지 않아 공시가격 찾기가 동작하지 않습니다. 꼭 Git 연결로 올리세요.

## 브이월드 인증키
vworld.kr 회원가입 → 오픈API → 인증키 발급. 활용 API에 **검색 API**와 **국가중점데이터(NED) API**를 체크하고, 서비스 URL에 사이트 도메인을 적습니다.
