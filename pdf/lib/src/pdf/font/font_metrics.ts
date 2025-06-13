// Assuming these types are defined and exported from their respective files:
import { PdfPoint } from '../point';
import { PdfRect } from '../rect';

/**
 * Describes dimensions and metrics for glyphs within a font.
 * This class is immutable.
 */
// @immutable is a Dart annotation for static analysis; not directly translated to TS runtime.
export class PdfFontMetrics {
    /**
     * Leftmost boundary of the glyph's bounding box.
     */
    public readonly left: number;

    /**
     * Topmost boundary of the glyph's bounding box.
     */
    public readonly top: number;

    /**
     * Bottommost boundary of the glyph's bounding box.
     */
    public readonly bottom: number;

    /**
     * Rightmost boundary of the glyph's bounding box.
     */
    public readonly right: number;

    /**
     * Distance between the baseline and the top of the glyph that
     * reaches farthest from the baseline. Defaults to `bottom` if not provided.
     */
    public readonly ascent: number;

    /**
     * Distance between the baseline and the lowest descending glyph.
     * Defaults to `top` if not provided.
     */
    public readonly descent: number;

    /**
     * Distance to move right to draw the next glyph (includes glyph width and side bearings).
     * Defaults to `right - left` if not provided.
     */
    public readonly advanceWidth: number;

    /**
     * The starting point (left bearing) of the glyph.
     * Defaults to `left` if not provided.
     */
    public readonly leftBearing: number;

    /**
     * Creates a PdfFontMetrics object.
     * @param params.left Leftmost of the bounding box.
     * @param params.top Topmost of the bounding box.
     * @param params.right Rightmost of the bounding box.
     * @param params.bottom Bottommost of the bounding box.
     * @param params.ascent Optional ascent value. Defaults to `bottom`.
     * @param params.descent Optional descent value. Defaults to `top`.
     * @param params.advanceWidth Optional advance width. Defaults to `right - left`.
     * @param params.leftBearing Optional left bearing. Defaults to `left`.
     */
    constructor(params: {
        left: number;
        top: number;
        right: number;
        bottom: number;
        ascent?: number;
        descent?: number;
        advanceWidth?: number;
        leftBearing?: number;
    }) {
        this.left = params.left;
        this.top = params.top;
        this.right = params.right;
        this.bottom = params.bottom;
        // Apply Dart's null-aware defaults
        this.ascent = params.ascent ?? params.bottom;
        this.descent = params.descent ?? params.top;
        this.advanceWidth = params.advanceWidth ?? (params.right - params.left);
        this.leftBearing = params.leftBearing ?? params.left;
    }

    /**
     * Creates a new PdfFontMetrics by appending a collection of existing metrics.
     * This calculates the overall dimensions for a sequence of glyphs.
     * @param metrics An iterable (e.g., array) of PdfFontMetrics objects.
     * @param letterSpacing Additional spacing to add between letters. Defaults to 0.
     * @returns A new PdfFontMetrics object representing the combined dimensions.
     */
    public static append(
        metrics: Iterable<PdfFontMetrics>,
        params: {
            letterSpacing?: number;
        } = {}
    ): PdfFontMetrics {
        const letterSpacing = params.letterSpacing ?? 0;

        const metricsArray = Array.from(metrics); // Convert to array for easy iteration and isEmpty check

        if (metricsArray.length === 0) {
            return PdfFontMetrics.zero;
        }

        let left: number | undefined;
        let top: number | undefined;
        let right = 0.0; // Accumulated advanceWidth
        let bottom: number | undefined;
        let ascent: number | undefined;
        let descent: number | undefined;
        let lastBearing: number = 0; // Guaranteed to be initialized in loop
        let firstBearing: number | undefined;
        let spacing: number = 0; // Temporary for current glyph's spacing

        for (const metric of metricsArray) {
            firstBearing = firstBearing ?? metric.leftBearing; // Set only on first iteration
            left = left ?? metric.left; // Set only on first iteration

            // Apply letter spacing only if advanceWidth is positive (i.e., not a zero-width char like a diacritic)
            spacing = metric.advanceWidth > 0 ? letterSpacing : 0.0;

            right += metric.advanceWidth + spacing; // Accumulate advanceWidth
            lastBearing = metric.rightBearing; // Keep track of the last glyph's right bearing

            // Calculate min/max for overall bounding box and ascent/descent
            top = Math.min(top ?? metric.top, metric.top);
            bottom = Math.max(bottom ?? metric.bottom, metric.bottom);
            descent = Math.min(descent ?? metric.descent, metric.descent);
            ascent = Math.max(ascent ?? metric.ascent, metric.ascent);
        }

        // The final `right` needs adjustment because `right` accumulated `advanceWidth` which includes the next glyph's starting point.
        // We subtract the last glyph's `rightBearing` and the last `spacing` to get the actual rightmost point relative to the origin.
        return new PdfFontMetrics({
            left: left!, // Guaranteed to be set if metricsArray is not empty
            top: top!,
            right: right - lastBearing - spacing, // Corrected right boundary
            bottom: bottom!,
            ascent: ascent,
            descent: descent,
            advanceWidth: right - spacing, // Total advanceWidth without the very last letterSpacing
            leftBearing: firstBearing,
        });
    }

    /**
     * A PdfFontMetrics instance representing zero dimensions.
     */
    public static readonly zero: PdfFontMetrics = new PdfFontMetrics({
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
    });

    /**
     * The width of the glyph's bounding box.
     */
    public get width(): number {
        return this.right - this.left;
    }

    /**
     * The height of the glyph's bounding box.
     */
    public get height(): number {
        return this.bottom - this.top;
    }

    /**
     * Maximum width any glyph from this font can have.
     */
    public get maxWidth(): number {
        return Math.max(this.advanceWidth, this.right) + Math.max(-this.leftBearing, 0.0);
    }

    /**
     * Maximum height any glyph from this font can have (distance from ascent to descent).
     */
    public get maxHeight(): number {
        return this.ascent - this.descent;
    }

    /**
     * Real left position. The glyph may overflow on the left (negative left bearing).
     */
    public get effectiveLeft(): number {
        return Math.min(this.leftBearing, 0);
    }

    /**
     * The ending point of the glyph relative to its advance width.
     */
    public get rightBearing(): number {
        return this.advanceWidth - this.right;
    }

    /**
     * Get the unit size (width, height) of this string's bounding box.
     * @returns A PdfPoint representing the width and height.
     */
    public get size(): PdfPoint {
        return new PdfPoint(this.width, this.height);
    }

    /**
     * Returns a string representation of the PdfFontMetrics object for debugging.
     */
    public toString(): string {
        return `PdfFontMetrics(left:${this.left}, top:${this.top}, right:${this.right}, bottom:${this.bottom}, ascent:${this.ascent}, descent:${this.descent}, advanceWidth:${this.advanceWidth}, leftBearing:${this.leftBearing}, rightBearing:${this.rightBearing})`;
    }

    /**
     * Creates a copy of this object with optional new values for its properties.
     * This is a common pattern for immutable objects.
     * @param overrides Optional object with properties to override.
     * @returns A new PdfFontMetrics instance with updated properties.
     */
    public copyWith(overrides: {
        left?: number;
        top?: number;
        right?: number;
        bottom?: number;
        ascent?: number;
        descent?: number;
        advanceWidth?: number;
        leftBearing?: number;
    }): PdfFontMetrics {
        return new PdfFontMetrics({
            left: overrides.left ?? this.left,
            top: overrides.top ?? this.top,
            right: overrides.right ?? this.right,
            bottom: overrides.bottom ?? this.bottom,
            ascent: overrides.ascent ?? this.ascent,
            descent: overrides.descent ?? this.descent,
            advanceWidth: overrides.advanceWidth ?? this.advanceWidth,
            leftBearing: overrides.leftBearing ?? this.leftBearing,
        });
    }

    /**
     * Multiplies all dimensions and metrics of this object by a given factor.
     * This method directly translates Dart's `operator *`.
     * @param factor The scalar factor to multiply by.
     * @returns A new PdfFontMetrics instance with all dimensions scaled.
     */
    public scale(factor: number): PdfFontMetrics {
        return this.copyWith({
            left: this.left * factor,
            top: this.top * factor,
            right: this.right * factor,
            bottom: this.bottom * factor,
            ascent: this.ascent * factor,
            descent: this.descent * factor,
            advanceWidth: this.advanceWidth * factor,
            leftBearing: this.leftBearing * factor,
        });
    }

    /**
     * Gets the bounding box of the metrics as a PdfRect.
     * @returns A PdfRect representing the bounding box (left, top, right, bottom).
     */
    public toPdfRect(): PdfRect {
        // Assuming PdfRect has a static factory method fromLTRB
        return PdfRect.fromLTRB(this.left, this.top, this.right, this.bottom);
    }
}