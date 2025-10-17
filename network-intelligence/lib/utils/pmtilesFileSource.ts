/**
 * FileSource adapter for PMTiles in Node.js
 * Enables server-side access to PMTiles files via file system
 */

import fs from 'fs'
import { Source, RangeResponse } from 'pmtiles'

export class FileSource implements Source {
  private filename: string
  private fileDescriptor: number

  constructor(filename: string) {
    this.filename = filename
    this.fileDescriptor = fs.openSync(filename, 'r')
  }

  getKey(): string {
    return this.filename
  }

  /**
   * Helper async function to read bytes from file into buffer
   */
  private readBytesIntoBuffer = async (
    buffer: Buffer,
    offset: number
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      fs.read(
        this.fileDescriptor,
        buffer,
        0,
        buffer.length,
        offset,
        (err) => {
          if (err) return reject(err)
          resolve()
        }
      )
    })
  }

  /**
   * Get bytes from file at specified offset and length
   * Required by PMTiles Source interface
   */
  getBytes = async (offset: number, length: number): Promise<RangeResponse> => {
    const buffer = Buffer.alloc(length)
    await this.readBytesIntoBuffer(buffer, offset)

    // Convert Buffer to ArrayBuffer for PMTiles
    const data = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    )

    return { data } as RangeResponse
  }

  /**
   * Cleanup file descriptor
   */
  close(): void {
    if (this.fileDescriptor) {
      fs.closeSync(this.fileDescriptor)
    }
  }
}
