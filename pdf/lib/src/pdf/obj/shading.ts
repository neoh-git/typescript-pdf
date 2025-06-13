// Assuming these are defined in their respective .ts files:
// import { PdfDocument } from '../document';
// import { PdfArray } from '../format/array';
// import { PdfBool } from '../format/bool';
// import { PdfDict } from '../format/dict';
// import { PdfName } from '../format/name';
// import { PdfNum } from '../format/num';
// import { PdfPoint } from '../point'; // Assuming PdfPoint has `x` and `y` properties
// import { PdfRect } from '../rect';   // Assuming PdfRect has `left`, `bottom`, `right`, `top` properties
// import { PdfBaseFunction } from './function'; // Base class for PDF functions
// import { PdfObject } from './object';

import { PdfDocument } from '../document';
import { PdfArray } from '../format/array';
import { PdfBool } from '../format/bool';
import { PdfDict } from '../format/dict';
import { PdfName } from '../format/name';
import { PdfNum } from '../format/num';
import { PdfPoint } from '../point';
import { PdfRect } from '../rect';
import { PdfBaseFunction } from './function';
import { PdfObject } from './object';

/**
 * Defines the type of shading (gradient).
 */
export enum PdfShadingType {
    axial, // Corresponds to Shading Type 2 in PDF
    radial, // Corresponds to Shading Type 3 in PDF
}

/**
 * Represents a Type 2 (Axial) or Type 3 (Radial) Shading dictionary in PDF.
 */
export class PdfShading extends PdfObject<PdfDict> {
    // Dart's `final` fields become `public readonly` in TypeScript.
    public readonly shadingType: PdfShadingType;
    public readonly function: PdfBaseFunction;
    public readonly start: PdfPoint;
    public readonly end: PdfPoint;
    public readonly boundingBox?: PdfRect; // Nullable
    public readonly extendStart: boolean;
    public readonly extendEnd: boolean;
    public readonly radius0?: number; // Nullable, specifically for radial shading
    public readonly radius1?: number; // Nullable, specifically for radial shading

    /**
     * Constructs a PdfShading object.
     * @param pdfDocument The PDF document.
     * @param options.shadingType The type of shading (axial or radial).
     * @param options.function The color function for the shading.
     * @param options.start The starting coordinate of the axis or center of the start circle.
     * @param options.end The ending coordinate of the axis or center of the end circle.
     * @param options.radius0 The radius of the starting circle (required for radial).
     * @param options.radius1 The radius of the ending circle (required for radial).
     * @param options.boundingBox An optional bounding box for the shading.
     * @param options.extendStart Whether to extend the shading beyond the start point/circle. Defaults to false.
     * @param options.extendEnd Whether to extend the shading beyond the end point/circle. Defaults to false.
     */
    constructor(
        pdfDocument: PdfDocument,
        options: {
            shadingType: PdfShadingType;
            function: PdfBaseFunction;
            start: PdfPoint;
            end: PdfPoint;
            radius0?: number;
            radius1?: number;
            boundingBox?: PdfRect;
            extendStart?: boolean;
            extendEnd?: boolean;
        },
    ) {
        // Call the super constructor. Dart's `params: PdfDict()` becomes an object literal.
        super(pdfDocument, { params: new PdfDict() });

        // Assign properties from the options object.
        this.shadingType = options.shadingType;
        this.function = options.function;
        this.start = options.start;
        this.end = options.end;
        this.radius0 = options.radius0;
        this.radius1 = options.radius1;
        this.boundingBox = options.boundingBox;
        this.extendStart = options.extendStart ?? false; // Dart's default values
        this.extendEnd = options.extendEnd ?? false;
    }

    /**
     * Name of the Shading object (e.g., '/S1', '/S2').
     * @returns The name string.
     */
    get name(): string {
        return `/S${this.objser}`;
    }

    /**
     * Prepares the shading object for PDF output by setting its parameters.
     */
    override prepare(): void {
        super.prepare(); // Call the base class's prepare method.

        // ShadingType in PDF is 2 for axial, 3 for radial. Dart enum's index is 0 for axial, 1 for radial.
        this.params.set('/ShadingType', new PdfNum(this.shadingType + 2));

        if (this.boundingBox != null) {
            // Assuming PdfArray.fromNumbers instead of PdfArray.fromNum.
            this.params.set(
                '/BBox',
                PdfArray.fromNumbers([
                    this.boundingBox.left,
                    this.boundingBox.bottom,
                    this.boundingBox.right,
                    this.boundingBox.top,
                ]),
            );
        }

        // `const PdfBool(true)` becomes `new PdfBool(true)`.
        this.params.set('/AntiAlias', new PdfBool(true));
        this.params.set('/ColorSpace', new PdfName('/DeviceRGB'));

        if (this.shadingType === PdfShadingType.axial) {
            this.params.set(
                '/Coords',
                PdfArray.fromNumbers([this.start.x, this.start.y, this.end.x, this.end.y]),
            );
        } else if (this.shadingType === PdfShadingType.radial) {
            // Dart's `assert(radius0 != null);` etc., should be handled at runtime in TS.
            // Or in the constructor for critical validation.
            if (this.radius0 == null || this.radius1 == null) {
                if (this.pdfDocument.isDebug) {
                    console.assert(false, 'radius0 and radius1 must be provided for radial shading.');
                }
                throw new Error('radius0 and radius1 must be provided for radial shading.');
            }
            this.params.set(
                '/Coords',
                PdfArray.fromNumbers([
                    this.start.x,
                    this.start.y,
                    this.radius0, // Dart's `radius0!` non-null assertion
                    this.end.x,
                    this.end.y,
                    this.radius1, // Dart's `radius1!` non-null assertion
                ]),
            );
        }

        if (this.extendStart || this.extendEnd) {
            this.params.set(
                '/Extend',
                new PdfArray([new PdfBool(this.extendStart), new PdfBool(this.extendEnd)]),
            );
        }

        this.params.set('/Function', this.function.ref()); // Reference to the PdfBaseFunction.
    }
}