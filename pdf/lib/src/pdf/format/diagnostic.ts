// Assuming these types are defined and exported from their respective files:
import { PdfStream } from './stream';
// Math functions (min, etc.) are globally available in TS/JS via `Math`.

// --- Simple Stopwatch Implementation (Mocking Dart's Stopwatch) ---
// This class mimics the basic functionality of Dart's Stopwatch for diagnostic purposes.
class Stopwatch {
    private _startTime: number | null = null;
    private _elapsedTime: number = 0; // Total elapsed time in milliseconds

    /**
     * Starts the stopwatch. If already running, does nothing.
     */
    public start(): void {
        if (this._startTime === null) {
            this._startTime = performance.now(); // High-resolution time in milliseconds
        }
    }

    /**
     * Stops the stopwatch. If not running, does nothing.
     */
    public stop(): void {
        if (this._startTime !== null) {
            this._elapsedTime += performance.now() - this._startTime;
            this._startTime = null;
        }
    }

    /**
     * Resets the stopwatch to zero and stops it.
     */
    public reset(): void {
        this._elapsedTime = 0;
        this._startTime = null;
    }

    /**
     * Gets the current elapsed time in microseconds.
     * @returns The elapsed time in microseconds.
     */
    public get elapsedMicroseconds(): number {
        let currentElapsed = this._elapsedTime;
        if (this._startTime !== null) {
            currentElapsed += performance.now() - this._startTime;
        }
        return Math.floor(currentElapsed * 1000); // Convert milliseconds to microseconds
    }
}

// --- PdfDiagnostic Class (translating the mixin) ---
/**
 * Provides diagnostic and debugging utilities for PDF object generation.
 * This class is designed to be "mixed in" or extended by other classes
 * (like PdfObjectBase or PdfXrefTable) to provide logging, timing, and debugging features.
 */
export class PdfDiagnostic {
    // Maximum size for debug comments insertion.
    private static readonly _maxSize: number = 300;

    // Internal list to store debug properties/messages.
    private readonly _properties: string[] = [];

    // The byte offset in the PdfStream where debug comments are inserted.
    private _offset: number | null = null;

    // The stopwatch instance for timing operations.
    private _stopwatch: Stopwatch | null = null;

    /**
     * The total elapsed time on the stopwatch in microseconds.
     */
    public get elapsedStopwatch(): number {
        return this._stopwatch?.elapsedMicroseconds ?? 0;
    }

    /**
     * The allocated size for debug comment insertion (defaults to _maxSize).
     */
    public size: number = 0;

    /**
     * Fills the internal diagnostic properties with a new debug message.
     * This method is intended to be called by subclasses and should call its super implementation.
     * @param value The debug message to add.
     */
    // @protected and @mustCallSuper are Dart-specific annotations.
    // In TypeScript, we indicate intention via JSDoc or common practice.
    protected debugFill(value: string): void {
        // This block corresponds to Dart's `assert(() { ... }())` for debug-only execution.
        // In TS, we run it conditionally or always depending on desired debug behavior.
        // Running it always, or based on a verbose setting if available from context.
        if (true /* or a debug flag, e.g., process.env.NODE_ENV === 'development' */) {
            if (this._properties.length === 0) {
                this._properties.push(''); // Empty line
                this._properties.push('-'.repeat(78)); // Horizontal line
                this._properties.push(this.constructor.name); // Class name (e.g., "PdfObjectBase")
            }
            this._properties.push(value);
        }
    }

    /**
     * Sets up a placeholder in the PdfStream for future debug comments.
     * This allocates space for comments at the current stream offset.
     * @param os The PdfStream to insert comments into.
     * @param size The amount of space (characters) to reserve for comments. Defaults to _maxSize.
     */
    public setInsertion(os: PdfStream, size: number = PdfDiagnostic._maxSize): void {
        // This block corresponds to Dart's `assert(() { ... }())` for debug-only execution.
        if (true /* or a debug flag */) {
            this.size = size;
            this._offset = os.offset; // Store the offset where the placeholder begins
            os.putComment(' '.repeat(size)); // Insert a comment with `size` spaces as a placeholder
        }
    }

    /**
     * Writes the accumulated debug information to the PdfStream at the previously set insertion point.
     * This overwrites the placeholder comment.
     * @param os The PdfStream to write debug info to.
     */
    public writeDebug(os: PdfStream): void {
        // This block corresponds to Dart's `assert(() { ... }())` for debug-only execution.
        if (true /* or a debug flag */) {
            if (this._offset !== null) {
                const tempStream = new PdfStream();
                // Add all collected debug properties as comments to the temporary stream
                this._properties.forEach(line => tempStream.putComment(line));
                const debugBytes = tempStream.output(); // Get the bytes from the temporary stream

                // Overwrite the placeholder in the main stream with the actual debug comments.
                // It ensures it doesn't write beyond the reserved `size` + a few bytes for `%\n`.
                os.setBytes(
                    this._offset!, // Use non-null assertion as _offset must be set if in this block
                    debugBytes.slice(0, Math.min(this.size + 2, debugBytes.length)) // Dart's `lengthInBytes - 1` removed for direct Uint8Array.
                    // Note: `size + 2` is to account for '% ' prefix and '\n' suffix, adjusting for actual comment length.
                    // The Dart version's `b.lengthInBytes - 1` might be specific to its comment generation.
                    // This `Math.min` ensures we don't write past the allocated buffer.
                );
            }
        }
    }

    /**
     * Starts the internal stopwatch. If it's the first time, a new Stopwatch is created.
     */
    public startStopwatch(): void {
        this._stopwatch = this._stopwatch ?? new Stopwatch(); // Create if null
        this._stopwatch.start();
    }

    /**
     * Stops the internal stopwatch.
     */
    public stopStopwatch(): void {
        this._stopwatch?.stop(); // Stop if not null
    }
}