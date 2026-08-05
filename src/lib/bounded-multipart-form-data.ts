export async function readBoundedMultipartFormData(
  request: Request,
  maxBytes: number,
  tooLargeError: () => Error,
): Promise<FormData> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw tooLargeError();
  }

  if (!request.body) {
    return request.formData();
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const result = await reader.read();
    if (result.done) break;
    totalBytes += result.value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw tooLargeError();
    }
    chunks.push(result.value);
  }

  const boundedRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: new Blob(chunks),
  });
  return boundedRequest.formData();
}
