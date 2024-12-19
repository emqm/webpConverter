# WebP Converter

JPG, PNG 이미지를 WebP 형식으로 변환하는 웹 애플리케이션입니다. 이미지 크기 조절과 품질 설정이 가능하며, 웹 인터페이스를 통해 쉽게 사용할 수 있습니다.
![webConverter](https://github.com/user-attachments/assets/7561860f-296f-4bfd-8d56-869a05d43703)

## 주요 기능

- JPG, PNG → WebP 변환
- 다중 이미지 업로드 지원
- 이미지 품질 조절 (1-100)
- 이미지 크기 조절 (최대 가로/세로 크기 설정)
- 변환 결과 정보 제공 (원본 크기, 변환 후 크기, 압축률)

## 기술 스택

- Node.js
- Express
- Sharp (이미지 처리)
- Multer (파일 업로드)

## 설치 방법

```bash
# 저장소 클론
git clone https://github.com/emqm/webpConverter.git

# 프로젝트 폴더로 이동
cd webpConverter

# 의존성 설치
npm install
```

## 실행 방법

```bash
# 개발 모드로 실행
npm run dev

# 프로덕션 모드로 실행
npm start
```

서버 실행 후 웹 브라우저에서 `http://localhost:3000`에 접속하여 사용할 수 있습니다.

## 사용 방법

1. 웹 브라우저에서 `http://localhost:3000` 접속
2. "이미지 선택" 버튼을 클릭하여 변환할 이미지 선택
3. 원하는 경우 품질과 크기 옵션 설정
4. "변환하기" 버튼 클릭
5. 변환 완료 후 결과 확인 및 다운로드

## 주의사항

- 입력 가능한 이미지 형식: JPG, JPEG, PNG
- 업로드 가능한 최대 파일 크기는 서버 설정에 따라 다름

