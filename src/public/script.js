// 현재 선택된 input 추적
let activeInput = null;

document.getElementById("singleImage").addEventListener("change", function (e) {
    activeInput = "single";
    updateSelectedFiles(e.target.files);
});

document
    .getElementById("folderImages")
    .addEventListener("change", function (e) {
        activeInput = "folder";
        updateSelectedFiles(e.target.files);
    });

document.getElementById("convertForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!activeInput) {
        alert("이미지를 선택해주세요.");
        return;
    }

    const formData = new FormData();
    const files =
        activeInput === "single"
            ? document.getElementById("singleImage").files
            : document.getElementById("folderImages").files;

    // 파일 이름 옵션 가져오기
    const fileNameOption = document.querySelector(
        'input[name="fileNameOption"]:checked'
    ).value;
    const customFileName =
        fileNameOption === "custom"
            ? document.getElementById("customFileName").value
            : "";

    const quality = document.getElementById("quality").value;
    const maxWidth = document.getElementById("maxWidth").value;
    const maxHeight = document.getElementById("maxHeight").value;

    // 파일 추가
    for (let file of files) {
        const encodedFileName = encodeURIComponent(file.name);
        const newFile = new File([file], encodedFileName, {
            type: file.type,
        });
        formData.append("images", newFile);
    }

    // 옵션 추가
    formData.append("quality", quality);
    formData.append("fileNameOption", fileNameOption);
    formData.append("customFileName", customFileName);
    if (maxWidth) formData.append("maxWidth", maxWidth);
    if (maxHeight) formData.append("maxHeight", maxHeight);

    // 진행 상태 표시
    document.getElementById("progress").style.display = "block";
    document.getElementById("results").innerHTML = "";

    try {
        const response = await fetch("/convert", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (data.success) {
            // 전체 용량 계산
            const totalOriginalSize = data.results.reduce(
                (sum, result) => sum + result.originalSize,
                0
            );
            const totalConvertedSize = data.results.reduce(
                (sum, result) => sum + result.convertedSize,
                0
            );
            const totalCompressionRatio = (
                ((totalOriginalSize - totalConvertedSize) / totalOriginalSize) *
                100
            ).toFixed(2);

            const totalSummary = `
      <div class="total-summary">
          <div class="summary-text">
              전체: ${formatBytes(totalOriginalSize)} → ${formatBytes(
                totalConvertedSize
            )} (${totalCompressionRatio}% 압축)
          </div>
          <button class="download-all-btn">전체 다운로드</button>
      </div>
  `;
            const resultsHtml = `
                ${totalSummary}
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>원본 파일명</th>
                            <th>변환 파일명</th>
                            <th>원본 용량</th>
                            <th>변환 후 용량</th>
                            <th>압축률</th>
                            <th>원본 크기(픽셀)</th>
                            <th>변환 후 크기(픽셀)</th>
                            <th>다운로드</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.results
                            .map(
                                (result) => `
                            <tr>
                                <td>${decodeURIComponent(
                                    result.originalName
                                )}</td>
                                <td>${decodeURIComponent(result.webpName)}</td>
                                <td>${formatBytes(result.originalSize)}</td>
                                <td id=${
                                    result.originalSize > result.convertedSize
                                        ? "backBlue"
                                        : "backRed"
                                }>${formatBytes(result.convertedSize)}</td>
                                <td id=${
                                    result.compressionRatio < 30
                                        ? "backRed"
                                        : ""
                                }>${result.compressionRatio}%</td>
                                <td>${result.dimensions.original}</td>
                                <td>${result.dimensions.converted}</td>
                                <td><a href="/output/${encodeURIComponent(
                                    result.webpName
                                )}" download>다운로드</a></td>
                            </tr>
                        `
                            )
                            .join("")}
                    </tbody>
                </table>
            `;

            document.getElementById("results").innerHTML = resultsHtml;

            // 전체 다운로드 버튼에 이벤트 리스너 추가
            document
                .querySelector(".download-all-btn")
                .addEventListener("click", () => {
                    downloadAllFiles(data.results);
                });
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        document.getElementById("results").innerHTML = `
            <div class="error">
                오류가 발생했습니다: ${error.message}
            </div>
        `;
    }

    document.getElementById("progress").style.display = "none";
});

function updateSelectedFiles(files) {
    const fileCount = files.length;
    let jpgCount = 0;
    let pngCount = 0;
    let etcCount = 0;

    for (const file of files) {
        const fileType = file.type;

        if (fileType === "image/jpeg" || fileType === "image/jpg") {
            jpgCount += 1;
        } else if (fileType === "image/png") {
            pngCount += 1;
        } else {
            etcCount += 1;
        }
    }

    const fileList = document.getElementById("selectedFiles");
    if (fileCount > 0) {
        fileList.textContent = `선택된 파일: ${fileCount}개${
            jpgCount !== 0 ? `, jpg ${jpgCount}개` : ""
        }  ${pngCount !== 0 ? `, png ${pngCount}개` : ""}
        ${etcCount !== 0 ? `, 지원하지 않는 형식 ${etcCount}개` : ""}`;
    } else {
        fileList.textContent = "선택된 파일: 없음";
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// 전체 다운로드 함수
async function downloadAllFiles(results) {
    const zip = new JSZip();

    try {
        // 진행 상태 표시
        document.getElementById("progress").style.display = "block";
        document.getElementById("progress").textContent =
            "압축 파일 생성 중...";

        // 모든 파일을 가져와서 zip에 추가
        for (const result of results) {
            const response = await fetch(`/output/${result.webpName}`);
            const blob = await response.blob();
            zip.file(result.webpName, blob);
        }

        // zip 생성 및 다운로드
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = "converted_images.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        document.getElementById("progress").style.display = "none";
    } catch (error) {
        console.error("다운로드 중 오류:", error);
        document.getElementById("progress").textContent =
            "다운로드 중 오류가 발생했습니다.";
    }
}
