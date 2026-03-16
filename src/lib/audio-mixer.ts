'use client';

export class AudioMixer {

  private context = new AudioContext()
  private destination = this.context.createMediaStreamDestination()

  async addAudio(url: string): Promise<MediaStream> {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    try {
        const buffer = await this.context.decodeAudioData(arrayBuffer)

        const source = this.context.createBufferSource()
        source.buffer = buffer
        source.connect(this.destination)
        source.start()
    } catch (e) {
        console.error(`Error decoding audio data from ${url}:`, e);
    }

    return this.destination.stream
  }

  getStream(): MediaStream {
    return this.destination.stream
  }
}
