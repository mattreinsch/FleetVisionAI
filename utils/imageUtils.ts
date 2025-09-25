
async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
        } else {
            resolve('');
        }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

async function extractFrameFromVideo(videoFile: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
        URL.revokeObjectURL(video.src);
    };

    video.onloadeddata = () => {
      // Seek to a representative frame, e.g., 1 second in or middle
      video.currentTime = Math.min(1, video.duration / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        cleanup();
        return reject(new Error('Could not get canvas context'));
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) {
          cleanup();
          return reject(new Error('Canvas to Blob conversion failed'));
        }
        const frameFile = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
        cleanup();
        resolve(frameFile);
      }, 'image/jpeg', 0.9); // quality 90%
    };

    video.onerror = (e) => {
      cleanup();
      // FIX: The `onerror` event parameter `e` can be a string or an Event. Added a type guard
      // to handle the string case and ensure `e.target` is accessed only when `e` is an Event.
      if (typeof e === 'string') {
        reject(new Error(`Error loading video file: ${e}`));
        return;
      }
      const error = (e.target as HTMLVideoElement)?.error;
      reject(new Error(`Error loading video file: ${error?.message || 'Unknown error'}`));
    };
    
    // Start loading the video
    video.load();
  });
}

export { fileToGenerativePart, extractFrameFromVideo };
