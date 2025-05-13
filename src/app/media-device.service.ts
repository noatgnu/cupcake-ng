import { Injectable, ElementRef } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class MediaDeviceService {
  // Device lists
  private _cameraDevices: MediaDeviceInfo[] = [];
  private _audioDevices: MediaDeviceInfo[] = [];

  // Current selected devices
  private _currentCameraDevice: MediaDeviceInfo|null = null;
  private _currentAudioDevice: MediaDeviceInfo|null = null;

  // Recording state
  private _recording = false;
  private _screenRecording = false;
  private mediaRecorder?: MediaRecorder;
  recordingChunks: any[] = [];
  recordedBlob?: Blob;
  private _audioURL: string|null = null;

  // Audio visualization
  audioContext: AudioContext = new AudioContext();
  analyser: AnalyserNode;
  dataArray: Uint8Array;
  private animationFrame?: number;

  constructor(private toastService: ToastService) {
    this.analyser = this.audioContext.createAnalyser();
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.enumerateDevices();
  }

  // Device getters and setters
  get cameraDevices(): MediaDeviceInfo[] { return this._cameraDevices; }
  get audioDevices(): MediaDeviceInfo[] { return this._audioDevices; }

  get currentCameraDevice(): MediaDeviceInfo|null { return this._currentCameraDevice; }
  set currentCameraDevice(device: MediaDeviceInfo|null) { this._currentCameraDevice = device; }

  get currentAudioDevice(): MediaDeviceInfo|null { return this._currentAudioDevice; }
  set currentAudioDevice(device: MediaDeviceInfo|null) { this._currentAudioDevice = device; }

  get recording(): boolean { return this._recording; }
  get screenRecording(): boolean { return this._screenRecording; }
  get audioURL(): string|null { return this._audioURL; }

  // Device enumeration
  enumerateDevices(): Promise<void> {
    return navigator.mediaDevices.enumerateDevices().then((devices) => {
      this._cameraDevices = devices.filter(device => device.kind === 'videoinput');
      this._audioDevices = devices.filter(device => device.kind === 'audioinput');
    });
  }

  // Start screen recording
  startScreenRecording(audio: boolean): void {
    this._recording = true;
    this.recordingChunks = [];

    const constraints: any = {
      audio: audio,
      video: {cursor: "always"}
    };

    if (this._currentAudioDevice && audio) {
      constraints.audio = { deviceId: {exact: this._currentAudioDevice.deviceId} };
    }

    navigator.mediaDevices.getDisplayMedia(constraints).then((stream) => {
      this.setupMediaRecorder(stream, 'video/webm', true);
    });
  }

  // Start audio/video recording
  startRecording(audio: boolean, video: boolean, previewVideo?: ElementRef): void {
    this._recording = true;
    this.recordingChunks = [];

    let constraints: MediaStreamConstraints = { audio, video };

    if (video) {
      const isMobile = navigator.userAgent.match(/Android|iPhone|iPad/i);

      if (isMobile) {
        constraints.video = {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: {exact: 'environment'}
        };
      } else {
        constraints.video = { width: { ideal: 1920 }, height: { ideal: 1080 } };
      }

      if (this._currentCameraDevice) {
        constraints.video = {
          deviceId: {exact: this._currentCameraDevice.deviceId},
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        };
      }
    }

    if (this._currentAudioDevice && audio) {
      constraints.audio = { deviceId: {exact: this._currentAudioDevice.deviceId} };
    }

    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      if (previewVideo) {
        previewVideo.nativeElement.srcObject = stream;
        previewVideo.nativeElement.muted = true;
        previewVideo.nativeElement.play();
      }

      if (audio) {
        const source = this.audioContext.createMediaStreamSource(stream);
        source.connect(this.analyser);
        this.drawVisualizer();
      }

      const mimeType = audio && !video ? 'audio/webm' : 'video/webm';
      this.setupMediaRecorder(stream, mimeType, false, previewVideo);
    });
  }

  private setupMediaRecorder(stream: MediaStream, mimeType: string, isScreenRecording: boolean, previewVideo?: ElementRef): void {
    this.mediaRecorder = new MediaRecorder(stream);

    this.mediaRecorder.onstart = () => {
      this.toastService.show('Recording', 'Recording Started');
      this._recording = true;
      this._screenRecording = isScreenRecording;
    };

    this.mediaRecorder.ondataavailable = (event) => {
      this.recordingChunks.push(event.data);
    };

    this.mediaRecorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      this.toastService.show('Recording', 'Recording Stopped');

      this.recordedBlob = new Blob(this.recordingChunks, {type: mimeType});
      this._audioURL = window.URL.createObjectURL(this.recordedBlob);

      if (previewVideo) {
        previewVideo.nativeElement.srcObject = null;
      }

      this._recording = false;
      this._screenRecording = false;
    };

    this.mediaRecorder.start();
  }

  stopRecording(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
  }

  deletePreviewRecording(): void {
    this.recordedBlob = undefined;
    this._audioURL = null;
  }

  getRecordedBlob(): Blob | undefined {
    return this.recordedBlob;
  }

  // Audio visualization
  drawVisualizer(): void {
    this.animationFrame = requestAnimationFrame(() => this.drawVisualizer());
    this.analyser.getByteFrequencyData(this.dataArray);

    const canvas = document.getElementById('visualizer') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = (canvas.width / this.analyser.frequencyBinCount) * 2.5;
    let x = 0;

    for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
      const barHeight = this.dataArray[i];
      ctx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
      ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
      x += barWidth + 1;
    }
  }
}
