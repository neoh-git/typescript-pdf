// Assuming these are defined in their respective .ts files:
// For Matrix4, assume a type definition that includes a `storage` property.
// declare interface Matrix4 { storage: number[]; }
// import { Matrix4 } from 'your-vector-math-library';

// import { PdfDocument } from '../document';
// import { PdfArray } from '../format/array';
// import { PdfDict } from '../format/dict';
// import { PdfNum } from '../format/num';
// import { PdfGraphicState } from '../graphic_state';
// import { PdfObject } from './object';
// import { PdfShading } from './shading';

// Placeholder for Matrix4 type, assuming it has a `storage` property which is an array of numbers.
interface Matrix4 {
    /** The 16 elements of the 4x4 matrix, typically in column-major order. */
    storage: number[];
}

import { PdfDocument } from '../document';
import { PdfArray } from '../format/array';
import { PdfDict } from '../format/dict';
import { PdfNum } from '../format/num';
import { PdfGraphicState } from '../graphic_state';
import { PdfObject } from './object';
import { PdfShading } from './shading';

/**
 * Abstract base class for PDF Pattern objects.
 */
export abstract class PdfPattern extends PdfObject<PdfDict> {
    // Dart's `final int patternType;` -> `public readonly patternType: number;`
    public readonly patternType: number;
    // Dart's `final Matrix4? matrix;` -> `public readonly matrix?: Matrix4;`
    public readonly matrix?: Matrix4;

    /**
     * Constructs a PdfPattern object.
     * @param pdfDocument The PDF document.
     * @param patternType The type of pattern (e.g., 1 for Tiling, 2 for Shading).
     * @param matrix Optional transformation matrix.
     */
    constructor(pdfDocument: PdfDocument, patternType: number, matrix?: Matrix4) {
        // Dart's `super(pdfDocument, params: PdfDict())`
        super(pdfDocument, { params: new PdfDict() });
        this.patternType = patternType;
        this.matrix = matrix;
    }

    /**
     * Name of the Pattern object (e.g., '/P1', '/P2').
     * @returns The name string.
     */
    get name(): string {
        return `/P${this.objser}`;
    }

    /**
     * Prepares the pattern object for PDF output by setting its parameters.
     */
    override prepare(): void {
        super.prepare(); // Call the base class's prepare method.

        this.params.set('/PatternType', new PdfNum(this.patternType));

        if (this.matrix != null) {
            const s = this.matrix.storage; // Access the matrix elements.
            // PDF Matrix elements [a b c d e f] correspond to [s[0], s[1], s[4], s[5], s[12], s[13]]
            // from a column-major 4x4 matrix (like `vector_math_64`).
            // Assuming `PdfArray.fromNumbers` instead of `PdfArray.fromNum`.
            this.params.set(
                '/Matrix',
                PdfArray.fromNumbers([s[0], s[1], s[4], s[5], s[12], s[13]]),
            );
        }
    }
}

/**
 * Represents a Type 2 (Shading) Pattern in PDF.
 */
export class PdfShadingPattern extends PdfPattern {
    // Dart's `final PdfShading shading;` -> `public readonly shading: PdfShading;`
    public readonly shading: PdfShading;
    // Dart's `final PdfGraphicState? graphicState;` -> `public readonly graphicState?: PdfGraphicState;`
    public readonly graphicState?: PdfGraphicState;

    /**
     * Constructs a PdfShadingPattern.
     * @param pdfDocument The PDF document.
     * @param options.shading The PdfShading object to be used for this pattern.
     * @param options.matrix Optional transformation matrix.
     * @param options.graphicState Optional graphic state to apply.
     */
    constructor(
        pdfDocument: PdfDocument,
        options: {
            shading: PdfShading; // Dart's `required this.shading`
            matrix?: Matrix4;
            graphicState?: PdfGraphicState;
        },
    ) {
        // Call the super constructor (PdfPattern). Type 2 is for Shading Patterns.
        super(pdfDocument, 2, options.matrix);
        this.shading = options.shading;
        this.graphicState = options.graphicState;
    }

    /**
     * Prepares the shading pattern object for PDF output.
     */
    override prepare(): void {
        super.prepare(); // Call PdfPattern's prepare method first.

        this.params.set('/Shading', this.shading.ref()); // Reference to the shading object.

        if (this.graphicState != null) {
            // Assuming `graphicState.output()` returns a PdfIndirect or similar representation.
            this.params.set('/ExtGState', this.graphicState.output());
        }
    }
}