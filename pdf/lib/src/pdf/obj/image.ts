// Assuming these are defined in their respective .ts files:
import { PdfDocument } from '../document';
import { PdfJpegInfo } from '../exif'; // Assuming this provides JPEG metadata
import { PdfIndirect } from '../format/indirect';
import { PdfName } from '../format/name';
import { PdfNum } from '../format/num';
import { PdfRasterBase } from '../raster'; // Assuming this handles image rasterization
import { PdfXObject } from './xobject';

// For 'package:image/image.dart', we'll define minimal interfaces
// assuming a library like 'image-js' or similar is being used
// and aliased as 'im' for consistency with Dart code's usage.
// You would replace 'image-library-name' with your actual library.
import * as im from 'image-library-name'; // e.g., 'image-js', 'jimp', 'sharp', etc.
// If your image library is not directly providing `Image` and `JpegDecoder`
// with these exact methods, you'll need to adapt this part.
// For example, if `im.decodeImage` is `im.decode` and `im.JpegDecoder` is `im.jpeg.decode`.

/**
 * Represents the position of the first pixel in the data stream.
 * This corresponds to the exif orientations.
 */
export enum PdfImageOrientation {
    /** Rotated 0° */
    topLeft = 0,
    /** Rotated 90° */
    topRight = 1,
    /** Rotated 180° */
    bottomRight = 2,
    /** Rotated 270° */
    bottomLeft = 3,
    /** Rotated 0° mirror */
    leftTop = 4,
    /** Rotated 90° mirror */
    rightTop = 5,
    /** Rotated 180° mirror */
    rightBottom = 6,
    /** Rotated 270° mirror */
    leftBottom = 7,
}

/**
 * Image object stored in the Pdf document
 */
export class PdfImage extends PdfXObject {
    /**
     * Creates a new [PdfImage] instance from raw pixel data.
     * @param pdfDocument The PDF document to which this image belongs.
     * @param options.image The raw pixel data (e.g., RGBA or RGB).
     * @param options.width The width of the image in pixels.
     * @param options.height The height of the image in pixels.
     * @param options.alpha Whether the image includes an alpha channel. Defaults to true.
     * @param options.orientation The orientation of the image. Defaults to PdfImageOrientation.topLeft.
     * @returns A new PdfImage object.
     */
    static createFromRgb( // Renamed from default factory for clarity
        pdfDocument: PdfDocument,
        options: {
            image: Uint8Array; // Dart's Uint8List is Uint8Array in TS
            width: number;
            height: number;
            alpha?: boolean;
            orientation?: PdfImageOrientation;
        },
    ): PdfImage {
        const { image, width, height, alpha = true, orientation = PdfImageOrientation.topLeft } = options;

        const pdfImageInstance = new PdfImage._(
            pdfDocument,
            width,
            height,
            orientation,
        );

        // Dart's `assert(() { ... }())` is for debug builds.
        // In TS, we can use console.debug or console.log.
        // For more robust logging in a library, consider a dedicated logging solution.
        if (pdfImageInstance.isDebug) {
            pdfImageInstance.startStopwatch();
            pdfImageInstance.debugFill(`RAW RGB${alpha ? 'A' : ''} Image ${width}x${height}`);
        }

        pdfImageInstance.params.set('/BitsPerComponent', new PdfNum(8));
        pdfImageInstance.params.set('/Name', new PdfName(pdfImageInstance.name));
        pdfImageInstance.params.set('/ColorSpace', new PdfName('/DeviceRGB'));

        if (alpha) {
            const sMask = PdfImage._alpha(
                pdfDocument,
                image,
                width,
                height,
                orientation,
            );
            // Assuming PdfIndirect constructor takes object serial number and generation
            pdfImageInstance.params.set('/SMask', new PdfIndirect(sMask.objser, 0));
        }

        const s = width * height;
        // Uint8Array is dynamically sized. In Dart, Uint8List is fixed-size during creation.
        const out = new Uint8Array(s * 3);

        // Manually copy RGB data, skipping alpha if present
        if (alpha) {
            for (let i = 0; i < s; i++) {
                out[i * 3] = image[i * 4];
                out[i * 3 + 1] = image[i * 4 + 1];
                out[i * 3 + 2] = image[i * 4 + 2];
            }
        } else {
            // If no alpha, assume image is already RGB
            for (let i = 0; i < s; i++) {
                out[i * 3] = image[i * 3];
                out[i * 3 + 1] = image[i * 3 + 1];
                out[i * 3 + 2] = image[i * 3 + 2];
            }
        }

        pdfImageInstance.buf.putBytes(out); // Assuming `buf` from `PdfXObject` handles byte streams
        if (pdfImageInstance.isDebug) {
            pdfImageInstance.stopStopwatch();
        }
        return pdfImageInstance;
    }

    /**
     * Create an image from a jpeg file
     * @param pdfDocument The PDF document to which this image belongs.
     * @param options.image The JPEG image data as Uint8Array.
     * @param options.orientation Optional orientation; if not provided, EXIF orientation is used.
     * @returns A new PdfImage object.
     */
    static jpeg(
        pdfDocument: PdfDocument,
        options: {
            image: Uint8Array;
            orientation?: PdfImageOrientation;
        },
    ): PdfImage {
        const { image, orientation } = options;
        const info = new PdfJpegInfo(image); // Assuming PdfJpegInfo extracts width, height, orientation, etc.

        const pdfImageInstance = new PdfImage._(
            pdfDocument,
            info.width!, // Dart's `!` non-null assertion
            info.height,
            orientation ?? info.orientation, // Dart's `??` null-aware operator
        );

        if (pdfImageInstance.isDebug) {
            pdfImageInstance.startStopwatch();
            pdfImageInstance.debugFill(`Jpeg Image ${info.width}x${info.height}`);
        }

        pdfImageInstance.params.set('/BitsPerComponent', new PdfNum(8));
        pdfImageInstance.params.set('/Name', new PdfName(pdfImageInstance.name));
        pdfImageInstance.params.set('/Intent', new PdfName('/RelativeColorimetric'));
        pdfImageInstance.params.set('/Filter', new PdfName('/DCTDecode'));

        if (info.isRGB) {
            pdfImageInstance.params.set('/ColorSpace', new PdfName('/DeviceRGB'));
        } else {
            pdfImageInstance.params.set('/ColorSpace', new PdfName('/DeviceGray'));
        }

        pdfImageInstance.buf.putBytes(image);
        if (pdfImageInstance.isDebug) {
            pdfImageInstance.stopStopwatch();
        }
        return pdfImageInstance;
    }

    /**
     * Create an image from an [im.Image] object (from `image-library-name` package).
     * @param pdfDocument The PDF document.
     * @param options.image The image object.
     * @param options.orientation The orientation. Defaults to PdfImageOrientation.topLeft.
     * @returns A new PdfImage object.
     */
    static fromImage(
        pdfDocument: PdfDocument,
        options: {
            image: im.Image; // Assuming `im.Image` is the type from the imported image library
            orientation?: PdfImageOrientation;
        },
    ): PdfImage {
        const { image, orientation = PdfImageOrientation.topLeft } = options;
        const raster = PdfRasterBase.fromImage(image); // Assumed utility to get pixel data

        return PdfImage.createFromRgb( // Calling the `createFromRgb` static factory method
            pdfDocument,
            {
                image: raster.pixels,
                width: raster.width,
                height: raster.height,
                alpha: raster.alpha,
                orientation: orientation,
            }
        );
    }

    /**
     * Create an image from an image file bytes. Auto-detects format (JPEG or other).
     * @param pdfDocument The PDF document.
     * @param options.bytes The image file data as Uint8Array.
     * @param options.orientation The orientation. Defaults to PdfImageOrientation.topLeft.
     * @returns A new PdfImage object.
     * @throws Error if the image cannot be decoded.
     */
    static file(
        pdfDocument: PdfDocument,
        options: {
            bytes: Uint8Array;
            orientation?: PdfImageOrientation;
        },
    ): PdfImage {
        const { bytes, orientation = PdfImageOrientation.topLeft } = options;

        // Assuming `im.JpegDecoder` and `im.decode` exist on the imported `im` object.
        const jpegDecoder = new im.JpegDecoder(); // Create an instance if needed by the library

        if (jpegDecoder.isValidFile(bytes)) { // Check if it's a JPEG file
            return PdfImage.jpeg(pdfDocument, { image: bytes, orientation: orientation });
        }

        const image = im.decode(bytes); // Try to decode as a general image
        if (image === null) {
            throw new Error('Unable to decode image'); // Dart's `throw '...'` should be `throw new Error(...)`
        }
        return PdfImage.fromImage(
            pdfDocument,
            {
                image: image,
                orientation: orientation,
            }
        );
    }

    /**
     * Private factory method for creating an alpha mask image.
     */
    private static _alpha( // Private static method, equivalent to Dart's private factory
        pdfDocument: PdfDocument,
        image: Uint8Array,
        width: number,
        height: number,
        orientation: PdfImageOrientation,
    ): PdfImage {
        const pdfImageInstance = new PdfImage._(
            pdfDocument,
            width,
            height,
            orientation,
        );

        if (pdfImageInstance.isDebug) {
            pdfImageInstance.startStopwatch();
            pdfImageInstance.debugFill(`Image alpha channel ${width}x${height}`);
        }

        pdfImageInstance.params.set('/BitsPerComponent', new PdfNum(8));
        pdfImageInstance.params.set('/Name', new PdfName(pdfImageInstance.name));
        pdfImageInstance.params.set('/ColorSpace', new PdfName('/DeviceGray'));

        const s = width * height;
        const out = new Uint8Array(s);

        // Extract alpha channel
        for (let i = 0; i < s; i++) {
            out[i] = image[i * 4 + 3];
        }

        pdfImageInstance.buf.putBytes(out);
        if (pdfImageInstance.isDebug) {
            pdfImageInstance.stopStopwatch();
        }
        return pdfImageInstance;
    }

    // Private constructor, equivalent to Dart's named constructor `PdfImage._`
    private constructor(
        pdfDocument: PdfDocument,
        private readonly _width: number, // Dart's `this._width` in constructor param
        private readonly _height: number, // Dart's `this._height` in constructor param
        public readonly orientation: PdfImageOrientation, // Dart's `this.orientation` in constructor param
    ) {
        // Dart's `super(pdfDocument, '/Image', isBinary: true)`
        super(pdfDocument, '/Image', { isBinary: true });

        // Dart's initializer list sets params directly, done in constructor body in TS
        this.params.set('/Width', new PdfNum(this._width));
        this.params.set('/Height', new PdfNum(this._height));

        if (this.isDebug) {
            this.debugFill(`Orientation: ${orientation}`);
        }
    }

    // Dart's `get width` property (computed property)
    /**
     * Image width, adjusted for orientation.
     */
    get width(): number {
        return this.orientation.valueOf() >= 4 ? this._height : this._width;
    }

    // Dart's `get height` property (computed property)
    /**
     * Image height, adjusted for orientation.
     */
    get height(): number {
        return this.orientation.valueOf() < 4 ? this._height : this._width;
    }

    /**
     * Name of the image (overrides base PdfXObject name getter)
     */
    override get name(): string {
        return `/I${this.objser}`;
    }
}