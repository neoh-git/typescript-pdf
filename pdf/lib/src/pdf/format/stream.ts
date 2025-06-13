// Assuming Uint8Array is globally available or polyfilled for older environments.

/**
 * A utility class for building a PDF byte stream.
 * It provides methods to append bytes, strings, and other stream data,
 * with automatic buffer resizing.
 */
export class PdfStream {
    // The growth size for the internal buffer when it needs to expand.
    private static readonly _grow: number = 65536; // 64 KB

    // The internal Uint8Array buffer where bytes are accumulated.
    private _stream: Uint8Array;

    // The current offset (number of bytes written) in the buffer.
    private _offset: number = 0;

    /**
     * Creates a new PdfStream instance.
     */
    constructor() {
        this._stream = new Uint8Array(PdfStream._grow);
    }

    /**
     * Ensures that the internal buffer has enough capacity to accommodate `size` additional bytes.
     * If not, it resizes the buffer.
     * @param size The number of additional bytes needed.
     */
    private _ensureCapacity(size: number): void {
        // If there's enough space in the current buffer, do nothing.
        if (this._stream.length - this._offset >= size) {
            return;
        }

        // Calculate the new buffer size: current offset + needed size + a growth constant.
        const newSize = this._offset + size + PdfStream._grow;
        const newBuffer = new Uint8Array(newSize);

        // Copy the existing content to the new, larger buffer.
        newBuffer.set(this._stream, 0);
        this._stream = newBuffer;
    }

    /**
     * Appends a single byte to the stream.
     * @param b The byte (integer value 0-255) to append.
     */
    public putByte(b: number): void {
        this._ensureCapacity(1);
        this._stream[this._offset++] = b;
    }

    /**
     * Appends an array of bytes to the stream.
     * @param bytes The array of bytes (number[]) or Uint8Array to append.
     */
    public putBytes(bytes: number[] | Uint8Array): void {
        this._ensureCapacity(bytes.length);
        this._stream.set(bytes, this._offset);
        this._offset += bytes.length;
    }

    /**
     * Sets a sequence of bytes in the stream starting at a specific offset.
     * This overwrites existing bytes.
     * @param offset The starting offset in the stream to set bytes.
     * @param iterable An iterable of numbers representing the bytes to set.
     */
    public setBytes(offset: number, iterable: Iterable<number>): void {
        // Ensure that the iterable elements can fit within the current _stream length
        // starting from the given offset.
        // This check is implicitly handled by Uint8Array.set if the source length
        // plus offset exceeds target length.
        if (offset < 0 || offset >= this._stream.length) {
            throw new Error(`Offset ${offset} is out of bounds for current stream length ${this._stream.length}.`);
        }
        this._stream.set(Array.from(iterable), offset); // Convert iterable to Array for .set()
    }

    /**
     * Appends the entire content of another PdfStream to this stream.
     * @param otherStream The PdfStream instance to append.
     */
    public putStream(otherStream: PdfStream): void {
        // Access the private `_stream` property of the other instance.
        // This is generally acceptable in TS for direct internal integration.
        this.putBytes(otherStream._stream.slice(0, otherStream._offset)); // Only copy the used portion
    }

    /**
     * Gets the current write offset (number of bytes written) in the stream.
     */
    public get offset(): number {
        return this._offset;
    }

    /**
     * Returns a new Uint8Array containing all the bytes written to the stream so far.
     * The returned array is a copy, not a view into the internal buffer.
     */
    public output(): Uint8Array {
        // `slice()` creates a new Uint8Array from the specified start and end.
        return this._stream.slice(0, this._offset);
    }

    /**
     * Appends a string to the stream.
     * It asserts that all characters are within the ASCII range (0-127) before encoding.
     * @param s The string to append.
     * @throws {Error} If the string contains non-ASCII characters (code units > 0x7f).
     */
    public putString(s: string): void {
        // Dart's `assert` equivalent: check character codes before processing.
        for (let i = 0; i < s.length; i++) {
            const codeUnit = s.charCodeAt(i);
            if (codeUnit > 0x7f) {
                // Throw an error if a non-ASCII character is found, mimicking Dart's assert failure.
                throw new Error(`PdfStream.putString: String contains non-ASCII character (code 0x${codeUnit.toString(16)}).`);
            }
        }

        // Convert string to an array of character codes (bytes) and append.
        // For ASCII, charCodeAt(i) is the byte value.
        const bytes = new Uint8Array(s.length);
        for (let i = 0; i < s.length; i++) {
            bytes[i] = s.charCodeAt(i);
        }
        this.putBytes(bytes);
    }

    /**
     * Appends a comment to the stream. Each line of the comment is prefixed with '%' and ends with a newline.
     * @param s The comment string. If empty, only a newline is added.
     */
    public putComment(s: string): void {
        if (s.length === 0) {
            this.putByte(0x0a); // Newline byte
        } else {
            // Split the comment by newlines and process each line.
            // Using `\n` works for both `\n` and `\r\n` (due to split behavior)
            // or explicit regex `/\r?\n/`. For simplicity here, `\n`.
            for (const line of s.split('\n')) {
                if (line.length > 0) { // Only process non-empty lines
                    // Prepend "% " and append "\n", then convert to bytes.
                    const commentLine = `% ${line}\n`;
                    const bytes = new Uint8Array(commentLine.length);
                    for (let i = 0; i < commentLine.length; i++) {
                        bytes[i] = commentLine.charCodeAt(i);
                    }
                    this.putBytes(bytes);
                }
            }
        }
    }
}