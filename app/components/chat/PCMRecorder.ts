export class PCMRecorder {
    private ac: AudioContext | null = null;
    private stream: MediaStream | null = null;
    private processor: ScriptProcessorNode | null = null;
    private input: MediaStreamAudioSourceNode | null = null;
    private pcmData: Float32Array[] = [];
    private _isRecording = false;
    private targetSampleRate = 16000;

    async start() {
        this.stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                channelCount: 1,
                sampleRate: this.targetSampleRate,
                echoCancellation: true,
                noiseSuppression: true
            } 
        });

        // Use standard or webkit AudioContext
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) throw new Error("AudioContext not supported");
        
        this.ac = new AudioCtx({ sampleRate: this.targetSampleRate });
        
        if (this.ac && this.stream) {
            this.input = this.ac.createMediaStreamSource(this.stream);
            this.processor = this.ac.createScriptProcessor(4096, 1, 1);
            this.pcmData = [];
            this._isRecording = true;

            this.processor.onaudioprocess = (e) => {
                if (!this._isRecording) return;
                // Get the raw float32 PCM array
                const inputData = e.inputBuffer.getChannelData(0);
                this.pcmData.push(new Float32Array(inputData));
            };

            this.input.connect(this.processor);
            this.processor.connect(this.ac.destination); 
        }
    }

    async stop(): Promise<{ base64: string, sampleRate: number }> {
        this._isRecording = false;
        
        const nativeSampleRate = this.ac?.sampleRate || this.targetSampleRate;

        if (this.processor && this.input && this.ac) {
            this.input.disconnect();
            this.processor.disconnect();
            if (this.ac.state !== 'closed') {
                this.ac.close().catch(() => {});
            }
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
        }

        // Flatten the PCMs
        const totalLen = this.pcmData.reduce((acc, val) => acc + val.length, 0);
        const flatBuffer = new Float32Array(totalLen);
        let offset = 0;
        for (const b of this.pcmData) {
            flatBuffer.set(b, offset);
            offset += b.length;
        }

        // Downsample if required (Safari sometimes ignores requested sampleRate)
        let downsampledBuffer: Float32Array;
        let actualSampleRate = nativeSampleRate;
        if (nativeSampleRate !== this.targetSampleRate && nativeSampleRate > this.targetSampleRate) {
            const ratio = nativeSampleRate / this.targetSampleRate;
            const downsampledLength = Math.round(flatBuffer.length / ratio);
            downsampledBuffer = new Float32Array(downsampledLength);
            
            let filterIndex = 0;
            for (let i = 0; i < downsampledLength; i++) {
                const nextFilterIndex = Math.round((i + 1) * ratio);
                let sum = 0;
                let count = 0;
                for (let j = filterIndex; j < nextFilterIndex && j < flatBuffer.length; j++) {
                    sum += flatBuffer[j];
                    count++;
                }
                downsampledBuffer[i] = count > 0 ? sum / count : 0;
                filterIndex = nextFilterIndex;
            }
            actualSampleRate = this.targetSampleRate;
        } else {
            downsampledBuffer = flatBuffer;
            actualSampleRate = nativeSampleRate;
        }

        // Convert Float32 (-1 to 1) to Int16 (-32768 to 32767)
        const result = new Int16Array(downsampledBuffer.length);
        for (let i = 0; i < downsampledBuffer.length; i++) {
            const s = Math.max(-1, Math.min(1, downsampledBuffer[i]));
            result[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert raw bytes to Base64 in safe chunks
        const uint8 = new Uint8Array(result.buffer);
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < uint8.length; i += chunkSize) {
            const chunk = uint8.subarray(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        
        return {
            base64: window.btoa(binary),
            sampleRate: actualSampleRate
        };
    }
}
