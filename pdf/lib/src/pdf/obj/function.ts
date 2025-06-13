// Assume these imports are correctly set up in your project:
// For example:
// import { PdfColor } from '../color';
// import { PdfDocument } from '../document';
// import { PdfArray } from '../format/array';
// import { PdfDict } from '../format/dict';
// import { PdfNum } from '../format/num';
// import { PdfObject } from './object';
// import { PdfObjectStream } from './object_stream';

import { PdfColor } from '../color';
import { PdfDocument } from '../document';
import { PdfArray } from '../format/array';
import { PdfDict } from '../format/dict';
import { PdfNum } from '../format/num';
import { PdfObject } from './object';
import { PdfObjectStream } from './object_stream';

/**
 * Base abstract class for PDF functions.
 */
export abstract class PdfBaseFunction extends PdfObject<PdfDict> {
    /**
     * Constructs a PdfBaseFunction.
     * @param pdfDocument The PDF document.
     */
    constructor(pdfDocument: PdfDocument) {
        // In Dart, `params: PdfDict()` is a named parameter. In TypeScript,
        // this translates to an object literal for options in the super constructor.
        super(pdfDocument, { params: new PdfDict() });
    }

    /**
     * Factory method to create a PdfBaseFunction (either PdfFunction or PdfStitchingFunction)
     * based on a list of colors and optional stops for gradient.
     * @param pdfDocument The PDF document.
     * @param colors A list of colors. If `stops` is not provided or empty, creates a simple function from these colors.
     * @param stops Optional list of stop positions for a gradient (0.0 to 1.0).
     * @returns A PdfFunction or PdfStitchingFunction.
     * @throws Error if the number of colors does not match the number of stops when stops are provided.
     */
    static colorsAndStops(
        pdfDocument: PdfDocument,
        colors: (PdfColor | null)[], // Dart's List<PdfColor?> translates to (PdfColor | null)[]
        stops?: number[], // Dart's List<double>? translates to number[] | undefined
    ): PdfFunction | PdfStitchingFunction {
        if (!stops || stops.length === 0) {
            // If stops are not provided or empty, create a simple PdfFunction from colors
            return PdfFunction.fromColors(pdfDocument, colors);
        }

        // Create mutable copies of the lists. Dart's `List<Type>.from(iterable)`
        // is equivalent to `[...iterable]` or `Array.from(iterable)` in TS.
        // We assume non-null colors for list operations, as per Dart's logic with `_colors.first` etc.
        const _colors: PdfColor[] = colors.filter((c): c is PdfColor => c !== null);
        const _stops: number[] = [...stops];

        const fn: PdfFunction[] = [];
        let lc = _colors[0]; // Dart's `_colors.first`

        // Ensure the gradient starts at 0 if the first stop is greater than 0
        if (_stops[0] > 0) {
            _colors.unshift(lc); // Dart's `insert(0, ...)`
            _stops.unshift(0);
        }

        // Ensure the gradient ends at 1 if the last stop is less than 1
        if (_stops[_stops.length - 1] < 1) { // Dart's `_stops.last`
            _colors.push(_colors[_colors.length - 1]); // Dart's `_colors.last`
            _stops.push(1);
        }

        // Check for matching lengths
        if (_stops.length !== _colors.length) {
            throw new Error(
                'The number of colors in a gradient must match the number of stops',
            );
        }

        // Generate individual PdfFunctions for each color segment
        for (const c of _colors.slice(1)) { // Dart's `_colors.sublist(1)`
            fn.push(PdfFunction.fromColors(pdfDocument, [lc, c]));
            lc = c;
        }

        // Create a stitching function
        return new PdfStitchingFunction(
            pdfDocument,
            {
                functions: fn,
                // Dart's `_stops.sublist(1, _stops.length - 1)`
                // corresponds to TS `slice(1, _stops.length - 1)`.
                bounds: _stops.slice(1, _stops.length - 1),
                domainStart: 0,
                domainEnd: 1,
            }
        );
    }
}

/**
 * Represents a Type 0 (sampled) function in PDF.
 */
export class PdfFunction extends PdfObjectStream implements PdfBaseFunction {
    // Dart's `final` fields are `public readonly` in TypeScript.
    public readonly data?: number[]; // Dart's `List<int>?`
    public readonly bitsPerSample: number;
    public readonly order: number;
    public readonly domain: number[]; // Dart's `List<num>`
    public readonly range: number[]; // Dart's `List<num>`

    /**
     * Constructs a PdfFunction.
     * @param pdfDocument The PDF document.
     * @param options.data Optional data for the function.
     * @param options.bitsPerSample Bits per sample for the data. Defaults to 8.
     * @param options.order The order of the function. Defaults to 1.
     * @param options.domain An array of numbers specifying the domain of the function. Defaults to `[0, 1]`.
     * @param options.range An array of numbers specifying the range of the function. Defaults to `[0, 1]`.
     */
    constructor(
        pdfDocument: PdfDocument,
        options?: {
            data?: number[];
            bitsPerSample?: number;
            order?: number;
            domain?: number[];
            range?: number[];
        },
    ) {
        super(pdfDocument); // Call PdfObjectStream constructor

        // Initialize readonly properties from options or default values
        this.data = options?.data;
        this.bitsPerSample = options?.bitsPerSample ?? 8;
        this.order = options?.order ?? 1;
        // Dart's `const <num>[0, 1]` just becomes `[0, 1]` in TS.
        this.domain = options?.domain ?? [0, 1];
        this.range = options?.range ?? [0, 1];
    }

    /**
     * Factory method to create a PdfFunction from a list of PdfColors.
     * @param pdfDocument The PDF document.
     * @param colors A list of colors (can contain nulls, but non-null colors will be processed).
     * @returns A new PdfFunction instance.
     */
    static fromColors(
        pdfDocument: PdfDocument,
        colors: (PdfColor | null)[],
    ): PdfFunction {
        const data: number[] = [];
        for (const color of colors) {
            if (color) { // Ensure color is not null
                // Dart's `.round() & 0xff` ensures integer and byte range (0-255)
                data.push(Math.round(color.red * 255.0) & 0xFF);
                data.push(Math.round(color.green * 255.0) & 0xFF);
                data.push(Math.round(color.blue * 255.0) & 0xFF);
            }
        }
        return new PdfFunction(
            pdfDocument,
            {
                order: 3,
                data: data,
                // Dart's `const <num>[0, 1, 0, 1, 0, 1]` becomes a simple array literal.
                range: [0, 1, 0, 1, 0, 1],
            }
        );
    }

    /**
     * Prepares the PDF function object by writing its data to the stream
     * and setting its parameters.
     */
    override prepare(): void {
        // Dart's `data!` (non-null assertion) becomes `this.data!` in TS.
        // Assuming `buf` is a property inherited from `PdfObjectStream`.
        if (this.data) {
            this.buf.putBytes(this.data);
        }
        super.prepare();

        // Set PDF parameters. `const PdfNum(0)` in Dart is `new PdfNum(0)` in TS.
        this.params.set('/FunctionType', new PdfNum(0));
        this.params.set('/BitsPerSample', new PdfNum(this.bitsPerSample));
        this.params.set('/Order', new PdfNum(this.order));
        // Assuming `PdfArray.fromNum` is `PdfArray.fromNumbers` in TS.
        this.params.set('/Domain', PdfArray.fromNumbers(this.domain));
        this.params.set('/Range', PdfArray.fromNumbers(this.range));
        // Dart's integer division `~/` becomes `Math.trunc(a / b)`.
        this.params.set('/Size', PdfArray.fromNumbers([Math.trunc(this.data!.length / this.order)]));
    }

    /**
     * Returns a string representation of the PdfFunction.
     * @returns A string representing the function.
     */
    override toString(): string {
        // Dart's string interpolation `'$runtimeType $bitsPerSample...'`
        // becomes `this.constructor.name` for runtime type and template literals.
        return `${this.constructor.name} ${this.bitsPerSample} ${this.order} ${this.data}`;
    }
}

/**
 * Represents a Type 3 (stitching) function in PDF.
 */
export class PdfStitchingFunction extends PdfBaseFunction {
    public readonly functions: PdfFunction[];
    public readonly bounds: number[];
    public readonly domainStart: number;
    public readonly domainEnd: number;

    /**
     * Constructs a PdfStitchingFunction.
     * @param pdfDocument The PDF document.
     * @param options.functions An array of PdfFunction objects to be stitched.
     * @param options.bounds An array of numbers that define the boundary for each function in the `functions` array.
     * @param options.domainStart The start of the function's domain. Defaults to 0.
     * @param options.domainEnd The end of the function's domain. Defaults to 1.
     */
    constructor(
        pdfDocument: PdfDocument,
        options: {
            functions: PdfFunction[];
            bounds: number[];
            domainStart?: number;
            domainEnd?: number;
        },
    ) {
        super(pdfDocument);

        // Initialize readonly properties from options or default values
        this.functions = options.functions;
        this.bounds = options.bounds;
        this.domainStart = options.domainStart ?? 0;
        this.domainEnd = options.domainEnd ?? 1;
    }

    /**
     * Prepares the PDF stitching function object by setting its parameters.
     */
    override prepare(): void {
        super.prepare();

        this.params.set('/FunctionType', new PdfNum(3));
        // Assuming `PdfArray.fromObjects` is a static method on `PdfArray` that converts
        // a list of PdfObject instances to an array of their references.
        this.params.set('/Functions', PdfArray.fromObjects(this.functions));
        this.params.set('/Order', new PdfNum(3));
        this.params.set('/Domain', PdfArray.fromNumbers([this.domainStart, this.domainEnd]));
        this.params.set('/Bounds', PdfArray.fromNumbers(this.bounds));
        // Dart's `List<int>.generate(length, (int i) => expression)`
        // translates to `Array.from({ length: N }, (_, i) => expression)` in TS.
        this.params.set(
            '/Encode',
            PdfArray.fromNumbers(
                Array.from({ length: this.functions.length * 2 }, (_, i) => i % 2),
            ),
        );
    }

    /**
     * Returns a string representation of the PdfStitchingFunction.
     * @returns A string representing the stitching function.
     */
    override toString(): string {
        return `${this.constructor.name} ${this.domainStart} ${this.bounds} ${this.domainEnd} ${this.functions}`;
    }
}