// Assuming PdfPoint is defined in './point.ts'
import { PdfPoint } from './point';

/**
 * Represents a rectangle in 2D space.
 * @immutable This class is designed to be immutable, meaning its instances
 *            cannot be changed after they are created.
 */
export class PdfRect {
    /** The x-coordinate of the rectangle's origin (bottom-left corner). */
    public readonly x: number;
    /** The y-coordinate of the rectangle's origin (bottom-left corner). */
    public readonly y: number;
    /** The width of the rectangle. */
    public readonly width: number;
    /** The height of the rectangle. */
    public readonly height: number;

    /** A static constant representing a rectangle at (0,0) with zero width and height. */
    public static readonly zero = new PdfRect(0, 0, 0, 0);

    /**
     * Creates a new PdfRect instance.
     * @param x The x-coordinate of the rectangle's origin.
     * @param y The y-coordinate of the rectangle's origin.
     * @param width The width of the rectangle.
     * @param height The height of the rectangle.
     */
    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    /**
     * Creates a PdfRect from left, top, right, and bottom coordinates.
     * Assuming `x` and `y` in the PdfRect constructor represent the bottom-left corner.
     * @param left The x-coordinate of the left edge.
     * @param top The y-coordinate of the top edge.
     * @param right The x-coordinate of the right edge.
     * @param bottom The y-coordinate of the bottom edge.
     * @returns A new PdfRect instance.
     */
    public static fromLTRB(
        left: number,
        top: number,
        right: number,
        bottom: number,
    ): PdfRect {
        return new PdfRect(left, bottom, right - left, top - bottom);
    }

    /**
     * Creates a PdfRect from an offset point (bottom-left) and a size point (width, height).
     * @param offset The PdfPoint representing the bottom-left corner (x, y).
     * @param size The PdfPoint representing the width and height (width, height).
     * @returns A new PdfRect instance.
     */
    public static fromPoints(offset: PdfPoint, size: PdfPoint): PdfRect {
        return new PdfRect(offset.x, offset.y, size.x, size.y);
    }

    /** The x-coordinate of the left edge of the rectangle. */
    public get left(): number {
        return this.x;
    }

    /** The y-coordinate of the bottom edge of the rectangle. */
    public get bottom(): number {
        return this.y;
    }

    /** The x-coordinate of the right edge of the rectangle. */
    public get right(): number {
        return this.x + this.width;
    }

    /** The y-coordinate of the top edge of the rectangle. */
    public get top(): number {
        return this.y + this.height;
    }

    /**
     * @deprecated Use `horizontalCenter` instead.
     * The x-coordinate of the horizontal center of the rectangle.
     */
    public get horizondalCenter(): number {
        return this.horizontalCenter;
    }

    /** The x-coordinate of the horizontal center of the rectangle. */
    public get horizontalCenter(): number {
        return this.x + this.width / 2;
    }

    /** The y-coordinate of the vertical center of the rectangle. */
    public get verticalCenter(): number {
        return this.y + this.height / 2;
    }

    /** @override */
    public toString(): string {
        return `PdfRect(${this.x}, ${this.y}, ${this.width}, ${this.height})`;
    }

    /**
     * Scales the rectangle's coordinates and dimensions by a factor.
     * Corresponds to Dart's `operator *`.
     * @param factor The scaling factor.
     * @returns A new PdfRect instance scaled by the factor.
     */
    public multiply(factor: number): PdfRect {
        return new PdfRect(
            this.x * factor,
            this.y * factor,
            this.width * factor,
            this.height * factor,
        );
    }

    /** The bottom-left corner of the rectangle as a PdfPoint. */
    public get offset(): PdfPoint {
        return new PdfPoint(this.x, this.y);
    }

    /** The width and height of the rectangle as a PdfPoint. */
    public get size(): PdfPoint {
        return new PdfPoint(this.width, this.height);
    }

    /** The top-left corner of the rectangle as a PdfPoint. */
    public get topLeft(): PdfPoint {
        return new PdfPoint(this.x, this.y + this.height);
    }

    /** The top-right corner of the rectangle as a PdfPoint. */
    public get topRight(): PdfPoint {
        return new PdfPoint(this.x + this.width, this.y + this.height);
    }

    /** The bottom-left corner of the rectangle as a PdfPoint. */
    public get bottomLeft(): PdfPoint {
        return new PdfPoint(this.x, this.y);
    }

    /** The bottom-right corner of the rectangle as a PdfPoint. */
    public get bottomRight(): PdfPoint {
        return new PdfPoint(this.x + this.width, this.y);
    }

    /**
     * Returns a new rectangle with edges moved outwards by the given delta.
     * @param delta The amount to expand the rectangle.
     * @returns A new PdfRect instance.
     */
    public inflate(delta: number): PdfRect {
        // If (x,y) is bottom-left, expanding outwards means:
        // new left = x - delta
        // new bottom = y - delta
        // new right = (x + width) + delta
        // new top = (y + height) + delta
        return PdfRect.fromLTRB(
            this.left - delta,
            this.top + delta, // new top
            this.right + delta,
            this.bottom - delta, // new bottom
        );
    }

    /**
     * Returns a new rectangle with edges moved inwards by the given delta.
     * @param delta The amount to shrink the rectangle.
     * @returns A new PdfRect instance.
     */
    public deflate(delta: number): PdfRect {
        return this.inflate(-delta);
    }

    /**
     * Creates a new PdfRect instance with some properties replaced.
     * @param options.x Optional new x-coordinate.
     * @param options.y Optional new y-coordinate.
     * @param options.width Optional new width.
     * @param options.height Optional new height.
     * @returns A new PdfRect instance.
     */
    public copyWith(options: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    }): PdfRect {
        return new PdfRect(
            options.x ?? this.x,
            options.y ?? this.y,
            options.width ?? this.width,
            options.height ?? this.height,
        );
    }

    /**
     * Compares this PdfRect to another object for value equality.
     * TypeScript does not support operator overloading, so a method is used instead.
     * @param other The object to compare with.
     * @returns True if the objects are both PdfRect instances with the same x, y, width, and height values, false otherwise.
     */
    public equals(other: any): boolean {
        if (!(other instanceof PdfRect)) {
            return false;
        }
        return (
            other.x === this.x &&
            other.y === this.y &&
            other.width === this.width &&
            other.height === this.height
        );
    }

    /**
     * Computes a hash code for this PdfRect.
     * Note: In JavaScript/TypeScript, this method alone does not enable
     * value-based equality for built-in `Map` or `Set` collections.
     * These collections use reference equality by default.
     * @returns A numeric hash code.
     */
    public get hashCode(): number {
        let hash = 17;
        hash = (hash * 31 + this.x) | 0;
        hash = (hash * 31 + this.y) | 0;
        hash = (hash * 31 + this.width) | 0;
        hash = (hash * 31 + this.height) | 0;
        return hash;
    }
}