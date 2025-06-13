// Assuming PdfPoint does not depend on other external imports in this context,
// and @immutable is a meta-annotation that doesn't have direct TS runtime impact.
// If you use a linter that supports it (e.g., via a custom rule), you might want to add a comment or a custom decorator.

/**
 * Represents a point in 2D space.
 * @immutable This class is designed to be immutable, meaning its instances
 *            cannot be changed after they are created.
 */
export class PdfPoint {
    /** The x-coordinate of the point. */
    public readonly x: number;
    /** The y-coordinate of the point. */
    public readonly y: number;

    /** A static constant representing the point (0.0, 0.0). */
    public static readonly zero = new PdfPoint(0.0, 0.0);

    /**
     * Creates a new PdfPoint instance.
     * @param x The x-coordinate.
     * @param y The y-coordinate.
     */
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /** @override */
    public toString(): string {
        return `PdfPoint(${this.x}, ${this.y})`;
    }

    /**
     * Returns a new PdfPoint object, translated by the given offsets.
     * @param offsetX The amount to translate along the x-axis.
     * @param offsetY The amount to translate along the y-axis.
     * @returns A new PdfPoint instance with the translated coordinates.
     */
    public translate(offsetX: number, offsetY: number): PdfPoint {
        return new PdfPoint(this.x + offsetX, this.y + offsetY);
    }

    /**
     * Compares this PdfPoint to another object for value equality.
     * TypeScript does not support operator overloading, so a method is used instead.
     * @param other The object to compare with.
     * @returns True if the objects are both PdfPoint instances with the same x and y values, false otherwise.
     */
    public equals(other: any): boolean {
        if (!(other instanceof PdfPoint)) {
            return false;
        }
        return other.x === this.x && other.y === this.y;
    }

    /**
     * Computes a hash code for this PdfPoint.
     * Note: In JavaScript/TypeScript, this method alone does not enable
     * value-based equality for built-in `Map` or `Set` collections.
     * These collections use reference equality by default.
     * @returns A numeric hash code.
     */
    public get hashCode(): number {
        let hash = 17;
        hash = (hash * 31 + this.x) | 0; // Bitwise OR 0 to ensure integer
        hash = (hash * 31 + this.y) | 0;
        return hash;
    }
}