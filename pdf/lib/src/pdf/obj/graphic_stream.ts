// Assuming these are defined in their respective .ts files:
// import { PdfDocument } from '../document';
// import { PdfArray } from '../format/array';
// import { PdfBool } from '../format/bool';
// import { PdfDict } from '../format/dict';
// import { PdfName } from '../format/name';
// import { PdfGraphicState } from '../graphic_state'; // Or wherever PdfGraphicState is defined
// import { PdfFont } from './font';
// import { PdfObject } from './object';
// import { PdfPattern } from './pattern';
// import { PdfShading } from './shading';
// import { PdfXObject } from './xobject';

import { PdfDocument } from '../document';
import { PdfArray } from '../format/array';
import { PdfBool } from '../format/bool';
import { PdfDict } from '../format/dict';
import { PdfName } from '../format/name';
import { PdfGraphicState } from '../graphic_state';
import { PdfFont } from './font';
import { PdfObject } from './object';
import { PdfPattern } from './pattern';
import { PdfShading } from './shading';
import { PdfXObject } from './xobject';

// Define a type for a class constructor
type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Mixin for graphic objects that manage resources like fonts, shaders, patterns, and XObjects.
 * It must be applied to a class that extends PdfObject<PdfDict>.
 */
export function PdfGraphicStreamMixin<TBase extends Constructor<PdfObject<PdfDict<any>>>>(Base: TBase) {
    // Dart's mixin properties and methods are defined here
    return class PdfGraphicStream extends Base {
        // Dart's `bool isolatedTransparency = false;`
        public isolatedTransparency: boolean = false;

        // Dart's `bool knockoutTransparency = false;`
        public knockoutTransparency: boolean = false;

        // Dart's `final fonts = <String, PdfFont>{};` becomes `public readonly fonts: Map<string, PdfFont> = new Map();`
        public readonly fonts: Map<string, PdfFont> = new Map<string, PdfFont>();

        public readonly shading: Map<string, PdfShading> = new Map<string, PdfShading>();

        public readonly patterns: Map<string, PdfPattern> = new Map<string, PdfPattern>();

        public readonly xObjects: Map<string, PdfXObject> = new Map<string, PdfXObject>();

        // Dart's private field `_altered` and custom getter/setter
        private _altered: boolean = false;
        public get altered(): boolean {
            return this._altered;
        }
        // The setter in Dart explicitly set _altered to true regardless of input
        public set altered(_: boolean) {
            this._altered = true;
        }

        /**
         * Add a font to this graphic object
         * @param font The font to add.
         */
        addFont(font: PdfFont): void {
            if (!this.fonts.has(font.name)) { // Dart's `containsKey` is `has` for Map
                this.fonts.set(font.name, font); // Dart's `map[key] = value` is `map.set(key, value)`
            }
        }

        /**
         * Add a shader to this graphic object
         * @param shader The shader to add.
         */
        addShader(shader: PdfShading): void {
            if (!this.shading.has(shader.name)) {
                this.shading.set(shader.name, shader);
            }
        }

        /**
         * Add a pattern to this graphic object
         * @param pattern The pattern to add.
         */
        addPattern(pattern: PdfPattern): void {
            if (!this.patterns.has(pattern.name)) {
                this.patterns.set(pattern.name, pattern);
            }
        }

        /**
         * Add an XObject to this graphic object
         * @param object The XObject to add.
         */
        addXObject(object: PdfXObject): void {
            if (!this.xObjects.has(object.name)) {
                this.xObjects.set(object.name, object);
            }
        }

        /**
         * Get the default font of this graphic object.
         * If no fonts are added to the document, Helvetica is added and returned.
         * @returns The default font, or undefined if no fonts could be obtained.
         */
        getDefaultFont(): PdfFont | undefined { // Dart's `PdfFont?` is `PdfFont | undefined`
            if (this.pdfDocument.fonts.size === 0) { // Dart's `isEmpty` is `size === 0` for Map/Set
                // Dart's `PdfFont.helvetica(pdfDocument)` is a static factory method call
                PdfFont.helvetica(this.pdfDocument);
            }

            // Dart's `elementAt(0)` on a Set/Iterable means getting the first element.
            // In TypeScript, convert Set to Array and get first element.
            return Array.from(this.pdfDocument.fonts.values())[0];
        }

        /**
         * Generate a name for the graphic state object
         * @param state The graphic state.
         * @returns The name of the graphic state.
         */
        stateName(state: PdfGraphicState): string {
            return this.pdfDocument.graphicStates.stateName(state);
        }

        /**
         * Prepares the graphic object by adding resources (fonts, shaders, etc.) to its parameters.
         */
        override prepare(): void {
            super.prepare(); // Call the prepare method of the base class

            // This holds any resources for this page
            const resources = new PdfDict();

            if (this.altered) {
                // Dart's `const <PdfName>[...]` becomes `[new PdfName(...), ...]`
                resources.set('/ProcSet', new PdfArray([
                    new PdfName('/PDF'),
                    new PdfName('/Text'),
                    new PdfName('/ImageB'),
                    new PdfName('/ImageC'),
                ]));
            }

            // fonts
            if (this.fonts.size > 0) {
                resources.set('/Font', PdfDict.fromObjectMap(this.fonts));
            }

            // shaders
            if (this.shading.size > 0) {
                resources.set('/Shading', PdfDict.fromObjectMap(this.shading));
            }

            // patterns
            if (this.patterns.size > 0) {
                resources.set('/Pattern', PdfDict.fromObjectMap(this.patterns));
            }

            // Now the XObjects
            if (this.xObjects.size > 0) {
                resources.set('/XObject', PdfDict.fromObjectMap(this.xObjects));
            }

            // Transparency Group settings
            if (this.pdfDocument.hasGraphicStates && !this.params.has('/Group')) { // Dart's `containsKey` is `has`
                // Dart's `PdfDict.values({...})` is `new PdfDict({...})`
                this.params.set('/Group', new PdfDict({
                    '/Type': new PdfName('/Group'),
                    '/S': new PdfName('/Transparency'),
                    '/CS': new PdfName('/DeviceRGB'),
                    '/I': new PdfBool(this.isolatedTransparency), // Dart's `PdfBool(bool)`
                    '/K': new PdfBool(this.knockoutTransparency),
                }));

                this.params.set('/ExtGState', this.pdfDocument.graphicStates.ref());
            }

            if (resources.size > 0) {
                if (this.params.has('/Resources')) {
                    const res = this.params.get('/Resources'); // Get the existing resource dictionary
                    if (res instanceof PdfDict) { // Dart's `is PdfDict`
                        res.merge(resources); // Assuming PdfDict has a merge method
                        return;
                    }
                }
                // If no existing resources or if it's not a PdfDict, set it
                this.params.set('/Resources', resources);
            }
        }
    };
}

/**
 * Graphic XObject
 */
export class PdfGraphicXObject extends PdfGraphicStreamMixin(PdfXObject) {
    /**
     * Creates a Graphic XObject
     * @param pdfDocument The PDF document.
     * @param subtype Optional subtype for the XObject.
     */
    constructor(
        pdfDocument: PdfDocument,
        subtype?: string, // Dart's `[String? subtype]` for optional positional parameter
    ) {
        // Call the constructor of the mixed-in base class (PdfXObject in this case)
        super(pdfDocument, subtype);
    }
}