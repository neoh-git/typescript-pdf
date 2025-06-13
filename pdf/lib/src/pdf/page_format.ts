// Assuming these are defined in other TypeScript files:
import { PdfPoint } from './point';

/**
 * Represents a page format with dimensions and margins.
 */
export class PdfPageFormat {
    public readonly width: number;
    public readonly height: number;
    public readonly marginTop: number;
    public readonly marginBottom: number;
    public readonly marginLeft: number;
    public readonly marginRight: number;

    /**
     * Defines standard units for page dimensions and margins.
     */
    public static readonly point = 1.0;
    public static readonly inch = 72.0;
    public static readonly cm = PdfPageFormat.inch / 2.54;
    public static readonly mm = PdfPageFormat.inch / 25.4;

    /// Flutter's Logical Pixel (note: original Dart code comments as "72.0 / 150.0" which is not a standard DP calculation)
    // Standard DP in Flutter is 1/96th of an inch, so 72.0 / (96.0/150.0) is not typical.
    // Replicating the Dart value. If this is meant to be 1/96th of an inch, it should be 72.0/96.0 or 0.75.
    public static readonly dp = 72.0 / 150.0;

    // Static constant page formats
    public static readonly a3 = new PdfPageFormat(29.7 * PdfPageFormat.cm, 42 * PdfPageFormat.cm, { marginAll: 2.0 * PdfPageFormat.cm });
    public static readonly a4 = new PdfPageFormat(21.0 * PdfPageFormat.cm, 29.7 * PdfPageFormat.cm, { marginAll: 2.0 * PdfPageFormat.cm });
    public static readonly a5 = new PdfPageFormat(14.8 * PdfPageFormat.cm, 21.0 * PdfPageFormat.cm, { marginAll: 2.0 * PdfPageFormat.cm });
    public static readonly a6 = new PdfPageFormat(105 * PdfPageFormat.mm, 148 * PdfPageFormat.mm, { marginAll: 1.0 * PdfPageFormat.cm });
    public static readonly letter = new PdfPageFormat(8.5 * PdfPageFormat.inch, 11.0 * PdfPageFormat.inch, { marginAll: PdfPageFormat.inch });
    public static readonly legal = new PdfPageFormat(8.5 * PdfPageFormat.inch, 14.0 * PdfPageFormat.inch, { marginAll: PdfPageFormat.inch });

    public static readonly roll57 = new PdfPageFormat(57 * PdfPageFormat.mm, Number.POSITIVE_INFINITY, { marginAll: 5 * PdfPageFormat.mm });
    public static readonly roll80 = new PdfPageFormat(80 * PdfPageFormat.mm, Number.POSITIVE_INFINITY, { marginAll: 5 * PdfPageFormat.mm });

    public static readonly undefined = new PdfPageFormat(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);

    public static readonly standard = PdfPageFormat.a4;

    /**
     * Creates a new PdfPageFormat instance.
     * @param width The width of the page.
     * @param height The height of the page.
     * @param options.marginTop Top margin.
     * @param options.marginBottom Bottom margin.
     * @param options.marginLeft Left margin.
     * @param options.marginRight Right margin.
     * @param options.marginAll Sets all margins equally if provided, overriding individual margin settings.
     */
    constructor(
        width: number,
        height: number,
        options?: {
            marginTop?: number;
            marginBottom?: number;
            marginLeft?: number;
            marginRight?: number;
            marginAll?: number;
        },
    ) {
        // Dart's `assert` statements are for development-time checks.
        // In TypeScript, these are typically removed for production code,
        // or replaced with runtime errors if critical.
        // assert(width > 0);
        // assert(height > 0);
        if (width <= 0) throw new Error('Page width must be greater than 0.');
        if (height <= 0) throw new Error('Page height must be greater than 0.');

        this.width = width;
        this.height = height;

        const marginAll = options?.marginAll;
        this.marginTop = marginAll ?? options?.marginTop ?? 0.0;
        this.marginBottom = marginAll ?? options?.marginBottom ?? 0.0;
        this.marginLeft = marginAll ?? options?.marginLeft ?? 0.0;
        this.marginRight = marginAll ?? options?.marginRight ?? 0.0;
    }

    /**
     * Creates a new PdfPageFormat instance with some properties replaced.
     * @param options.width Optional new width.
     * @param options.height Optional new height.
     * @param options.marginTop Optional new top margin.
     * @param options.marginBottom Optional new bottom margin.
     * @param options.marginLeft Optional new left margin.
     * @param options.marginRight Optional new right margin.
     * @returns A new PdfPageFormat instance.
     */
    public copyWith(options: {
        width?: number;
        height?: number;
        marginTop?: number;
        marginBottom?: number;
        marginLeft?: number;
        marginRight?: number;
    }): PdfPageFormat {
        return new PdfPageFormat(
            options.width ?? this.width,
            options.height ?? this.height,
            {
                marginTop: options.marginTop ?? this.marginTop,
                marginBottom: options.marginBottom ?? this.marginBottom,
                marginLeft: options.marginLeft ?? this.marginLeft,
                marginRight: options.marginRight ?? this.marginRight,
            },
        );
    }

    /** Total page dimensions. */
    public get dimension(): PdfPoint {
        return new PdfPoint(this.width, this.height);
    }

    /** Total page width excluding margins. */
    public get availableWidth(): number {
        return this.width - this.marginLeft - this.marginRight;
    }

    /** Total page height excluding margins. */
    public get availableHeight(): number {
        return this.height - this.marginTop - this.marginBottom;
    }

    /** Total page dimensions excluding margins. */
    public get availableDimension(): PdfPoint {
        return new PdfPoint(this.availableWidth, this.availableHeight);
    }

    /** Returns a new PdfPageFormat in landscape orientation. */
    public get landscape(): PdfPageFormat {
        return this.width >= this.height
            ? this
            : this.copyWith({ width: this.height, height: this.width });
    }

    /** Returns a new PdfPageFormat in portrait orientation. */
    public get portrait(): PdfPageFormat {
        return this.height >= this.width
            ? this
            : this.copyWith({ width: this.height, height: this.width });
    }

    /**
     * Applies additional margins, taking the maximum of existing and new margins.
     * @param options.left The minimum left margin to apply.
     * @param options.top The minimum top margin to apply.
     * @param options.right The minimum right margin to apply.
     * @param options.bottom The minimum bottom margin to apply.
     * @returns A new PdfPageFormat instance with updated margins.
     */
    public applyMargin(options: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    }): PdfPageFormat {
        return this.copyWith({
            marginLeft: Math.max(this.marginLeft, options.left),
            marginTop: Math.max(this.marginTop, options.top),
            marginRight: Math.max(this.marginRight, options.right),
            marginBottom: Math.max(this.marginBottom, options.bottom),
        });
    }

    /** @override */
    public toString(): string {
        // Using this.constructor.name to get the class name dynamically
        return `${this.constructor.name} ${this.width}x${this.height} margins:${this.marginLeft}, ${this.marginTop}, ${this.marginRight}, ${this.marginBottom}`;
    }

    /**
     * Compares this PdfPageFormat object to another for value equality.
     * @param other The object to compare with.
     * @returns True if the objects have the same values for all properties, false otherwise.
     */
    public equals(other: any): boolean {
        if (!(other instanceof PdfPageFormat)) {
            return false;
        }

        return (
            other.width === this.width &&
            other.height === this.height &&
            other.marginLeft === this.marginLeft &&
            other.marginTop === this.marginTop &&
            other.marginRight === this.marginRight &&
            other.marginBottom === this.marginBottom
        );
    }

    /**
     * Generates a hash code for this object.
     * Note: In JavaScript/TypeScript, this method alone does not enable
     * value-based equality for built-in `Map` or `Set` collections.
     * These collections use reference equality by default.
     */
    public get hashCode(): number {
        // A simple string-based hash, similar to Dart's default `toString().hashCode`
        let hash = 0;
        const str = this.toString(); // Use the string representation for hashing
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char; // Simple hashing algorithm
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }
}