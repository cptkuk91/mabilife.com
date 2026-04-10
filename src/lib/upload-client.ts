export async function uploadFileWithPresignedUrl(url: string, file: Blob) {
  const uploadResponse = await fetch(url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  });

  if (!uploadResponse.ok) {
    throw new Error("이미지 업로드에 실패했습니다.");
  }

  return uploadResponse;
}
