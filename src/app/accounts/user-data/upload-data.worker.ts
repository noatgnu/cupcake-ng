/// <reference lib="webworker" />
import jsSHA from "jssha";


addEventListener('message', async ({ data }) => {
  const messageData = data as { file: File, chunkSize: number, baseURL: string, authToken: string}
  const hashObj = new jsSHA("SHA-256", "ARRAYBUFFER");
  const fileSize = messageData.file.size;
  const chunkSize = messageData.chunkSize;
  const file = messageData.file;
  let chunkUploadProgress = 0;
  if (chunkSize > fileSize) {
    console.log("Uploading single chunk")
    const chunk = await file.arrayBuffer();
    hashObj.update(chunk)
    const hashDigest = hashObj.getHash("HEX");
    const result = await uploadDataChunkComplete("", hashDigest, messageData.authToken, file, file.name, messageData.baseURL)
    chunkUploadProgress = fileSize;
    if (result?.completed_at) {
      postMessage({completed: true, progress: chunkUploadProgress})
    }
  } else {
    console.log("Uploading multiple chunks")
    let currentURL = "";
    let currentOffset = 0;
    while (fileSize > currentOffset) {
      let end = currentOffset + chunkSize;
      if (end >= fileSize) {
        end = fileSize;
      }
      const chunk = await file.slice(currentOffset, end).arrayBuffer();
      hashObj.update(chunk)
      const filePart = new File([chunk], file.name, {type: file.type})
      const contentRange = `bytes ${currentOffset}-${end-1}/${fileSize}`;
      const result = await uploadDataChunk(currentURL, filePart,file.name, contentRange, messageData.authToken, messageData.baseURL)
      if (result) {
        currentURL = result.url;
        currentOffset = result.offset;
        chunkUploadProgress = currentOffset;
        postMessage({completed: false, progress: chunkUploadProgress})
      }
    }
    if (currentURL !== "") {
      const hashDigest = hashObj.getHash("HEX");
      const result = await uploadDataChunkComplete(currentURL, hashDigest, messageData.authToken, file, file.name, messageData.baseURL)
      if (result?.completed_at) {
        chunkUploadProgress = fileSize;
        postMessage({completed: true, progress: chunkUploadProgress})
      }
    }


  }

});

async function uploadDataChunkComplete(url: string, hashDigest: string, authToken: string, file: File, filename: string, baseURL: string) {
  const formData = new FormData();
  formData.append("sha256", hashDigest);
  if (file && filename) {
    formData.append("file", file);
    formData.append("filename", filename);
    const response = await fetch(`${baseURL}/api/chunked_upload/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`
      },
      body: formData
    })
    return response.json()
  } else {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`
      },
      body: formData
    })
    return response.json()
  }
}

async function uploadDataChunk(url: string, file: File, filename: string, contentRange: string, authToken: string, baseURL: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("filename", filename);
  formData.append("Content-Range", contentRange);
  if (url !== "") {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${authToken}`
      },
      body: formData
    })
    return response.json()
  } else {
    const response = await fetch(`${baseURL}/api/chunked_upload/`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${authToken}`
      },
      body: formData
    })
    return response.json()
  }
}
