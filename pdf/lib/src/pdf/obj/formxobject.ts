// Assuming these are defined in their respective .ts files:
// For example, for Matrix4, you might have:
// declare interface Matrix4 {
//   storage: number[]; // Represents the underlying 16-element Float64Array or similar
// }
// import { Matrix4 } from 'your-vector-math-library';

// And for other imports:
// import { PdfDocument } from '../document';
// import { PdfArray } from '../format/array';
// import { PdfDict } from '../format/dict';
// import { PdfNum } from '../format/num';
// import { PdfFont } from './font';
// import { PdfXObject } from './xobject';

// Placeholder for Matrix4 type, assuming it has a `storage` property which is an array of numbers.
// In Dart's `vector_math_64`, `Matrix4.storage` is a `Float64List`.
interface Matrix4 {
    /** The 16 elements of the 4x4 matrix, typically in column-major order. */
    storage: number[];
}

import { PdfDocument } from '../document';
import { PdfArray } from '../format/array';
import { PdfDict } from '../format/dict';
import { PdfNum } from '../format/num';
import { PdfFont } from './font';
import { PdfXObject } from './xobject';

/**
 * Form XObject
 */
export class PdfFormXObject extends PdfXObject {
    /**
     * The fonts associated with this page
     * In Dart, `Map<String, PdfFont>` is a standard Map. In TypeScript, `Map<string, PdfFont>` is the equivalent.
     * `final` in Dart translates to `public readonly` in TypeScript.
     */
    public readonly fonts: Map<string, PdfFont> = new Map<string, PdfFont>();

    /**
     * The xobjects or other images in the pdf
     */
    public readonly xobjects: Map<string, PdfXObject> = new Map<string, PdfXObject>();

    /**
     * Create a Form XObject
     * @param pdfDocument The PDF document associated with this Form XObject.
     */
    constructor(pdfDocument: PdfDocument) {
        // Dart's colon syntax after the constructor signature is for initializer lists
        // and calls to super/this constructors. In TypeScript, `super()` is called
        // directly as the first statement in the constructor body.
        super(pdfDocument, '/Form');

        // Dart's map access `params['key'] = value` translates to `this.params.set('key', value)`
        // assuming `params` is an instance of `PdfDict` which behaves like a Map.
        // `const PdfNum(1)` just becomes `new PdfNum(1)` in TypeScript, as `const` in Dart
        // implies compile-time constant creation, which is implicit for object literals in TS.
        this.params.set('/FormType', new PdfNum(1));

        // `PdfArray.fromNum` (Dart) is assumed to be `PdfArray.fromNumbers` (TypeScript)
        // and takes a `number[]` instead of Dart's `<int>[]`.
        this.params.set('/BBox', PdfArray.fromNumbers([0, 0, 1000, 1000]));
    }

    /**
     * Transformation matrix
     * @param t The 4x4 transformation matrix.
     */
    setMatrix(t: Matrix4): void {
        const s = t.storage; // Access the underlying array of the matrix.

        // The PDF /Matrix array represents an affine transformation in the form [a b c d e f].
        // Given a column-major 4x4 matrix `s` (like from `vector_math_64`),
        // the mapping to the PDF matrix elements is:
        // a = s[0] (m11)
        // b = s[1] (m21)
        // c = s[4] (m12)
        // d = s[5] (m22)
        // e = s[12] (m14, translation X)
        // f = s[13] (m24, translation Y)
        this.params.set(
            '/Matrix',
            PdfArray.fromNumbers([s[0], s[1], s[4], s[5], s[12], s[13]])
        );
    }

    /**
     * Overrides the prepare method from PdfXObject to add specific parameters for a Form XObject.
     */
    override prepare(): void {
        super.prepare();

        // This holds any resources for this FormXObject
        const resources = new PdfDict();

        // Dart's `map.isNotEmpty` becomes `map.size > 0` for `Map` instances in TypeScript.
        // Assuming `PdfDict.fromObjectMap` can accept a `Map<string, PdfFont>` or `Map<string, PdfXObject>`.
        if (this.fonts.size > 0) {
            resources.set('/Font', PdfDict.fromObjectMap(this.fonts));
        }

        if (this.xobjects.size > 0) {
            resources.set('/XObject', PdfDict.fromObjectMap(this.xobjects));
        }

        if (resources.size > 0) { // Check if any resources were added
            this.params.set('/Resources', resources);
        }
    }
}