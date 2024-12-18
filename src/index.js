const express = require("express");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;
const multer = require("multer");

const app = express();
const port = process.env.PORT || 3000;

// Multer 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "src/public/input/");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

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
            maxWidth: parseInt(req.body.maxWidth) || null,
            maxHeight: parseInt(req.body.maxHeight) || null,
        };

        for (const file of files) {
            const inputPath = file.path;
            const outputFileName = `${path.parse(file.originalname).name}.webp`;
            const outputPath = path.join("src/public/output", outputFileName);

            // 이미지 처리 파이프라인
            let pipeline = sharp(inputPath);

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
            const originalStats = await fs.stat(inputPath);

            results.push({
                originalName: file.originalname,
                webpName: outputFileName,
                originalSize: originalStats.size,
                convertedSize: outputStats.size,
                compressionRatio: (
                    ((originalStats.size - outputStats.size) /
                        originalStats.size) *
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

            // 입력 파일 삭제 (선택사항)
            await fs.unlink(inputPath);
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
