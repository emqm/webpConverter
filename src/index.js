const express = require("express");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;
const multer = require("multer");

const app = express();
const port = process.env.PORT || 3000;

// Multer 설정
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 정적 파일 제공
app.use(express.static("src/public"));
app.use(express.json());

// HTML 폼 제공
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 이미지 변환 API
app.post("/convert", upload.array("images"), async (req, res) => {
    try {
        const files = req.files;
        const results = [];
        const options = {
            quality: parseInt(req.body.quality) || 80,
            keepOriginalName: req.body.keepOriginalName === "true",
            maxWidth: parseInt(req.body.maxWidth) || null,
            maxHeight: parseInt(req.body.maxHeight) || null,
        };

        for (const [index, file] of files.entries()) {
            // 한글 파일명 처리
            const decodedFileName = decodeURIComponent(file.originalname);

            const outputFileName = options.keepOriginalName
                ? `${path.parse(decodedFileName).name}.webp`
                : `${String(index + 1).padStart(2, "0")}.webp`;
            const outputPath = path.join("src/public/output", outputFileName);

            // 이미지 처리 파이프라인
            let pipeline = sharp(file.buffer); // buffer 사용

            // 원본 이미지 메타데이터
            const metadata = await pipeline.metadata();

            // 크기 조절이 필요한 경우
            if (options.maxWidth || options.maxHeight) {
                pipeline = pipeline.resize(
                    options.maxWidth,
                    options.maxHeight,
                    {
                        fit: "inside",
                        withoutEnlargement: true,
                    }
                );
            }

            // WebP 변환
            await pipeline
                .webp({
                    quality: options.quality,
                })
                .toFile(outputPath);

            // 변환된 파일 정보
            const outputStats = await fs.stat(outputPath);
            const originalSize = file.size; // 원본 파일 크기는 메모리에서 가져옴

            results.push({
                originalName: decodedFileName,
                webpName: outputFileName,
                originalSize: originalSize,
                convertedSize: outputStats.size,
                compressionRatio: (
                    ((originalSize - outputStats.size) / originalSize) *
                    100
                ).toFixed(2),
                dimensions: {
                    original: `${metadata.width}x${metadata.height}`,
                    converted:
                        (await sharp(outputPath).metadata()).width +
                        "x" +
                        (await sharp(outputPath).metadata()).height,
                },
            });
        }

        res.json({
            success: true,
            message: "변환이 완료되었습니다.",
            results,
        });
    } catch (error) {
        console.error("변환 중 오류:", error);
        res.status(500).json({
            success: false,
            message: "변환 중 오류가 발생했습니다.",
            error: error.message,
        });
    }
});

app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
