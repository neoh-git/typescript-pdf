// Assuming these are defined in their respective .ts files:
// import { PdfDocument } from '../document';
// import { PdfArray } from '../format/array';
// import { PdfDict } from '../format/dict';
// import { PdfName } from '../format/name';
// import { PdfNum } from '../format/num';
// import { PdfString } from '../format/string';
// import { PdfObject } from './object';

import { PdfDocument } from '../document';
import { PdfArray } from '../format/array';
import { PdfDict } from '../format/dict';
import { PdfName } from '../format/name';
import { PdfNum } from '../format/num';
import { PdfString } from '../format/string';
import { PdfObject } from './object';

/**
 * Defines the style for PDF page labels.
 */
export enum PdfPageLabelStyle {
    arabic,
    romanUpper,
    romanLower,
    lettersUpper,
    lettersLower,
}

/**
 * Represents a single page label definition in a PDF document.
 */
export class PdfPageLabel {
    public readonly style?: PdfPageLabelStyle;
    public readonly prefix?: string;
    public readonly subsequent?: number;

    /**
     * Creates a PdfPageLabel with an optional style, prefix, and subsequent numbering.
     * @param prefix The string to prepend to the page number.
     * @param options.style The style of the page numbering.
     * @param options.subsequent The starting page number for this range.
     */
    constructor(
        prefix?: string,
        options?: { style?: PdfPageLabelStyle; subsequent?: number },
    ) {
        this.prefix = prefix;
        this.style = options?.style;
        this.subsequent = options?.subsequent;
    }

    // Dart's named constructors become static factory methods in TypeScript.

    /**
     * Creates an Arabic numeral (1, 2, 3...) page label.
     * @param options.prefix The string to prepend.
     * @param options.subsequent The starting page number.
     */
    static arabic(options?: { prefix?: string; subsequent?: number }): PdfPageLabel {
        return new PdfPageLabel(options?.prefix, {
            style: PdfPageLabelStyle.arabic,
            subsequent: options?.subsequent,
        });
    }

    /**
     * Creates an uppercase Roman numeral (I, II, III...) page label.
     * @param options.prefix The string to prepend.
     * @param options.subsequent The starting page number.
     */
    static romanUpper(options?: { prefix?: string; subsequent?: number }): PdfPageLabel {
        return new PdfPageLabel(options?.prefix, {
            style: PdfPageLabelStyle.romanUpper,
            subsequent: options?.subsequent,
        });
    }

    /**
     * Creates a lowercase Roman numeral (i, ii, iii...) page label.
     * @param options.prefix The string to prepend.
     * @param options.subsequent The starting page number.
     */
    static romanLower(options?: { prefix?: string; subsequent?: number }): PdfPageLabel {
        return new PdfPageLabel(options?.prefix, {
            style: PdfPageLabelStyle.romanLower,
            subsequent: options?.subsequent,
        });
    }

    /**
     * Creates an uppercase letter (A, B, C...) page label.
     * @param options.prefix The string to prepend.
     * @param options.subsequent The starting page number.
     */
    static lettersUpper(options?: { prefix?: string; subsequent?: number }): PdfPageLabel {
        return new PdfPageLabel(options?.prefix, {
            style: PdfPageLabelStyle.lettersUpper,
            subsequent: options?.subsequent,
        });
    }

    /**
     * Creates a lowercase letter (a, b, c...) page label.
     * @param options.prefix The string to prepend.
     * @param options.subsequent The starting page number.
     */
    static lettersLower(options?: { prefix?: string; subsequent?: number }): PdfPageLabel {
        return new PdfPageLabel(options?.prefix, {
            style: PdfPageLabelStyle.lettersLower,
            subsequent: options?.subsequent,
        });
    }

    /**
     * Converts this page label definition to a PDF dictionary object.
     * @returns A PdfDict representing this page label.
     */
    toDict(): PdfDict {
        let s: PdfName | undefined;
        switch (this.style) {
            case PdfPageLabelStyle.arabic:
                s = new PdfName('/D');
                break;
            case PdfPageLabelStyle.romanUpper:
                s = new PdfName('/R');
                break;
            case PdfPageLabelStyle.romanLower:
                s = new PdfName('/r');
                break;
            case PdfPageLabelStyle.lettersUpper:
                s = new PdfName('/A');
                break;
            case PdfPageLabelStyle.lettersLower:
                s = new PdfName('/a');
                break;
            case undefined: // Dart's `case null`
                s = undefined;
        }

        // Prepare an object for PdfDict construction
        const dictContent: { [key: string]: any } = {}; // Using `any` for value type to accommodate different PdfDataType instances

        if (s != null) {
            dictContent['/S'] = s;
        }
        // Dart's `prefix!.isNotEmpty` implies `prefix` is not null and not empty.
        // In TS, `prefix && prefix.length > 0` or simply `prefix` if empty string is falsy enough.
        if (this.prefix != null && this.prefix.length > 0) {
            dictContent['/P'] = PdfString.fromString(this.prefix);
        }
        if (this.subsequent != null) {
            dictContent['/St'] = new PdfNum(this.subsequent);
        }

        // Assuming PdfDict constructor can take an object literal.
        return new PdfDict(dictContent);
    }

    /**
     * Converts a decimal number to an uppercase Roman numeral.
     * @param decimal The number to convert (1 to 3999).
     * @returns The Roman numeral string.
     * @throws Error if the decimal is out of the valid range.
     */
    private _toRoman(decimal: number): string {
        const dictionary = new Map<number, string>([
            [1000, 'M'],
            [900, 'CM'],
            [500, 'D'],
            [400, 'CD'], // Corrected from 'CD,'
            [100, 'C'],
            [90, 'XC'],
            [50, 'L'],
            [40, 'XL'],
            [10, 'X'],
            [9, 'IX'],
            [5, 'V'],
            [4, 'IV'],
            [1, 'I'],
        ]);

        // Dart's `assert` is for debug builds. In TS, use `console.assert` or `throw new Error`.
        // For production builds, a `throw` is necessary for critical validation.
        if (!(decimal > 0 && decimal < 4000)) {
            throw new Error(
                'Roman numerals are limited to the inclusive range of 1 to 3999.',
            );
        }

        let result = '';
        // Iterate over the Map entries in descending order of keys.
        for (const [key, value] of dictionary.entries()) {
            while (decimal >= key) {
                decimal -= key;
                result += value;
            }
        }
        return result;
    }

    /**
     * Converts a decimal number to an alphabetical string (A, B, C, ..., AA, AB...).
     * @param decimal The 0-based number to convert.
     * @returns The alphabetical string.
     */
    private _toLetters(decimal: number): string {
        // Dart's `String.fromCharCode(0x41 + decimal % 26)` is `String.fromCharCode('A'.charCodeAt(0) + decimal % 26)` or just `String.fromCharCode(65 + decimal % 26)`.
        const char = String.fromCharCode(0x41 + (decimal % 26));
        // Dart's `decimal ~/ 26 + 1` is integer division. In TS, `Math.floor(decimal / 26) + 1`.
        const repeatCount = Math.floor(decimal / 26) + 1;
        // Dart's `n * r` for string repetition becomes `char.repeat(repeatCount)`.
        return char.repeat(repeatCount);
    }

    /**
     * Formats the page label as a string for display.
     * @param index The 0-based page index.
     * @returns The formatted page label string.
     */
    asString(index: number = 0): string {
        // Dart's `subsequent == null ? index : index + subsequent!`
        const effectiveIndex = this.subsequent == null ? index : index + this.subsequent;

        let suffix: string;
        switch (this.style) {
            case PdfPageLabelStyle.arabic:
                suffix = (effectiveIndex + 1).toString();
                break;
            case PdfPageLabelStyle.romanUpper:
                suffix = this._toRoman(effectiveIndex + 1);
                break;
            case PdfPageLabelStyle.romanLower:
                suffix = this._toRoman(effectiveIndex + 1).toLowerCase();
                break;
            case PdfPageLabelStyle.lettersUpper:
                suffix = this._toLetters(effectiveIndex);
                break;
            case PdfPageLabelStyle.lettersLower:
                suffix = this._toLetters(effectiveIndex).toLowerCase();
                break;
            case undefined: // Dart's `case null`
                suffix = '';
        }
        // Dart's `prefix ?? ''` is `this.prefix ?? ''` in TS.
        return `${this.prefix ?? ''}${suffix}`;
    }
}

/**
 * Pdf PageLabels object, managing multiple page label ranges.
 */
export class PdfPageLabels extends PdfObject<PdfDict> {
    // Dart's `final labels = <int, PdfPageLabel>{};`
    public readonly labels: Map<number, PdfPageLabel> = new Map<number, PdfPageLabel>();

    /**
     * Constructs a Pdf PageLabels object.
     * @param pdfDocument The PDF document.
     */
    constructor(pdfDocument: PdfDocument) {
        super(pdfDocument, { params: new PdfDict() });
    }

    /**
     * Gets the formatted page label for a given 0-based page index.
     * @param index The 0-based page index.
     * @returns The formatted page label string.
     */
    pageLabel(index: number): string {
        // Dart's `labels.keys.toList()..sort()`
        const sortedKeys = Array.from(this.labels.keys()).sort((a, b) => a - b); // Numeric sort

        let currentLabel = PdfPageLabel.arabic(); // Default if no matching label is found
        let startPageIndex = 0; // The starting index of the current label range

        for (const labelStartIdx of sortedKeys) {
            if (index >= labelStartIdx) {
                currentLabel = this.labels.get(labelStartIdx)!; // Non-null assertion
                startPageIndex = labelStartIdx;
            } else {
                // Since keys are sorted, if current index is less than a label's start,
                // we've found the correct range (or it's the default before the first label).
                break;
            }
        }

        return currentLabel.asString(index - startPageIndex);
    }

    /**
     * A generator that yields formatted page labels for all pages in the document.
     * @returns An Iterable of page label strings.
     */
    *names(): Iterable<string> {
        const sortedKeys = Array.from(this.labels.keys()).sort((a, b) => a - b);
        let currentLabel = PdfPageLabel.arabic();
        const totalPages = this.pdfDocument.pdfPageList.pages.length;
        let labelKeyIndex = 0; // Index into `sortedKeys` array
        // `nextBoundary` is the start index of the *next* label range, or `totalPages` if no more ranges.
        let nextBoundary = labelKeyIndex < sortedKeys.length ? sortedKeys[labelKeyIndex] : totalPages;
        let currentRangeStart = 0; // The start index of the currently active label range

        for (let i = 0; i < totalPages; i++) {
            if (i >= nextBoundary) {
                currentLabel = this.labels.get(nextBoundary)!; // Update current label
                labelKeyIndex++;
                nextBoundary = labelKeyIndex < sortedKeys.length ? sortedKeys[labelKeyIndex] : totalPages;
                currentRangeStart = i; // The new range starts at the current page index
            }
            yield currentLabel.asString(i - currentRangeStart);
        }
    }

    /**
     * Prepares the PdfPageLabels object by populating its '/Nums' dictionary entry.
     */
    override prepare(): void {
        super.prepare();

        const nums = new PdfArray();
        // Dart's `labels.entries` is `this.labels.entries()` in TS for a Map.
        for (const [key, value] of this.labels.entries()) {
            nums.add(new PdfNum(key));
            nums.add(value.toDict());
        }

        this.params.set('/Nums', nums);
    }
}