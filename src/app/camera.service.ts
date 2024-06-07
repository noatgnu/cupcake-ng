import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  // a service to use device camera to take pictures
  availableDevices: MediaDeviceInfo[] = []
  selectedDevice: MediaDeviceInfo|undefined = undefined
  mediaRecorder: MediaRecorder|undefined = undefined
  width = 480
  height = 480

  constructor() { }

  initateCameraForPhoto(previewElement: HTMLVideoElement) {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      this.availableDevices = devices.filter((device) => device.kind === 'videoinput')
      if (this.availableDevices.length > 0) {
        if (!this.selectedDevice) {
          this.selectedDevice = this.availableDevices[0]
        }
      }
      // initiate camera and set desired constraints to 1080p
      navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: this.selectedDevice?.deviceId,
          width: { ideal: this.width },
          height: { ideal: this.height }
        }
      }).then((stream) => {
        if (previewElement) {
          previewElement.srcObject = stream
          previewElement.oncanplaythrough = () => {
            previewElement.muted = true
          }
          previewElement.play()
        }
        this.mediaRecorder = new MediaRecorder(stream)

      })
    })
  }

  stopCamera(previewElement: HTMLVideoElement) {
    if (previewElement.srcObject) {
      const stream = previewElement.srcObject as MediaStream
      const tracks = stream.getTracks()
      tracks.forEach((track) => {
        track.stop()
      })
    }
  }

  takePhoto(previewElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) {
    if (previewElement.srcObject) {
      canvasElement.width = previewElement.videoWidth;
      canvasElement.height = previewElement.videoHeight;
      const context = canvasElement.getContext('2d')
      context?.drawImage(previewElement, 0, 0, canvasElement.width, canvasElement.height)
      return canvasElement.toDataURL('image/png')
    }
    return undefined
  }

  changeDevice(previewElement: HTMLVideoElement) {
    this.stopCamera(previewElement)
    this.initateCameraForPhoto(previewElement)
  }
}
