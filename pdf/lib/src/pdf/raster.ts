// Assume the imported classes and functions are defined in other TypeScript files.
// For 'package:image/image.dart' as 'im':
// These are placeholder interfaces to demonstrate the structure.
// In a real project, you would use actual type definitions from your image processing library.
namespace im {
    export enum Format {
        uint8,
        // Add other formats as needed based on the actual library
    }

    export class Image {
        public width: number;
        public height: number;
        public format: Format;
        public numChannels: number;
        // Assuming constructor can take dimensions and format
        constructor(options: { width: number; height: number; format: Format; numChannels: number });
        // Assuming a static factory method for creating from raw bytes
        static fromBytes(options: {
            width: number;
            height: number;
            bytes: ArrayBuffer;
            bytesOffset?: number;
            format: Format;
            numChannels: number;
        }): Image;
        // Assuming a method to convert image format/channels
        convert(options: { format: Format; numChannels: number; noAnimation: boolean }): Image;
        // Assuming a method to get raw pixel data as Uint8Array
        toUint8List(): Uint8Array;
    }

    export class PngDecoder {
        decode(data: Uint8Array): Image | null;
    }

    export class PngEncoder {
        encode(image: Image): Uint8Array;
    }

    export class ColorUint8 {
        r: number;
        g: number;
        b: number;
        a: number;
        constructor(channels: number); // Assuming 'channels' might be used for initialization
    }

    // Assuming global functions or methods on the Image class for graphics operations
    export function fillRect(
        image: Image,
        options: { x1: number; y1: number; x2: number; y2: number; color: ColorUint8 },
    ): void;
    export function fillCircle(
        image: Image,
        options: { x: number; y: number; radius: number; color: ColorUint8 },
    ): void;
    export function gaussianBlur(image: Image, options: { radius: number }): Image;
}

import { PdfColor } from './color'; // Assuming this exists and is imported correctly

/**
 * Represents a bitmap image
 */
export class PdfRasterBase {
    /** The width of the image */
    public readonly width: number;

    /** The height of the image */
    public readonly height: number;

    /** The alpha channel is used */
    public readonly alpha: boolean;

    /** The raw RGBA pixels of the image */
    public readonly pixels: Uint8Array;

    /**
     * Create a bitmap image
     * @param width The width of the image.
     * @param height The height of the image.
     * @param alpha True if the image has an alpha channel.
     * @param pixels The raw RGBA pixels of the image.
     */
    // Dart's `const` constructor maps to a regular constructor with `readonly` properties in TS.
    constructor(width: number, height: number, alpha: boolean, pixels: Uint8Array) {
        this.width = width;
        this.height = height;
        this.alpha = alpha;
        this.pixels = pixels;
    }

    /**
     * Creates a PdfRasterBase from an `image` library Image object.
     * @param image An Image object from the `image` library.
     * @returns A new PdfRasterBase instance.
     */
    public static fromImage(image: im.Image): PdfRasterBase {
        // Dart's `image.convert(format: im.Format.uint8, numChannels: 4, noAnimation: true).toUint8List()`
        // Assuming `convert` returns an `Image` instance that has a `toUint8List` method.
        const convertedImage = image.convert({
            format: im.Format.uint8,
            numChannels: 4,
            noAnimation: true,
        });
        const data = convertedImage.toUint8List(); // This method name might vary in a JS/TS library (e.g., .data, .pixels, .toArrayBuffer())
        return new PdfRasterBase(image.width, image.height, true, data);
    }

    /**
     * Creates a PdfRasterBase from PNG raw bytes.
     * @param png The PNG image data as a Uint8Array.
     * @returns A new PdfRasterBase instance.
     * @throws If the PNG data cannot be decoded.
     */
    public static fromPng(png: Uint8Array): PdfRasterBase {
        // Dart's `im.PngDecoder().decode(png)!;`
        const img = new im.PngDecoder().decode(png);
        if (!img) {
            throw new Error('Failed to decode PNG image.'); // Handle null result from decode
        }
        return PdfRasterBase.fromImage(img);
    }

    /**
     * Generates a rectangular shadow image using `image` library.
     * @param width The width of the shadowed rectangle.
     * @param height The height of the shadowed rectangle.
     * @param spreadRadius How much the shadow should spread.
     * @param blurRadius The blur radius for the shadow.
     * @param color The color of the shadow.
     * @returns An `image` library Image object representing the shadow.
     */
    public static shadowRect(
        width: number,
        height: number,
        spreadRadius: number,
        blurRadius: number,
        color: PdfColor,
    ): im.Image {
        const shadowWidth = Math.round(width + spreadRadius * 2);
        const shadowHeight = Math.round(height + spreadRadius * 2);

        // Dart's `im.Image(width: ..., height: ..., format: ..., numChannels: ...)`
        // Assuming 'im.Image' constructor takes an options object.
        const shadow = new im.Image({
            width: shadowWidth,
            height: shadowHeight,
            format: im.Format.uint8,
            numChannels: 4,
        });

        // Dart's `im.ColorUint8(4)..r = ... ..g = ... ..b = ... ..a = ...`
        // Translates to creating a ColorUint8 instance and setting properties.
        const fillColor = new im.ColorUint8(4); // Assuming `4` for numChannels
        fillColor.r = Math.round(color.red * 255);
        fillColor.g = Math.round(color.green * 255);
        fillColor.b = Math.round(color.blue * 255);
        fillColor.a = Math.round(color.alpha * 255);

        im.fillRect(
            shadow, {
            x1: Math.round(spreadRadius),
            y1: Math.round(spreadRadius),
            x2: Math.round(spreadRadius + width),
            y2: Math.round(spreadRadius + height),
            color: fillColor,
        });

        // Dart's `im.gaussianBlur(shadow, radius: blurRadius.round())`
        return im.gaussianBlur(shadow, { radius: Math.round(blurRadius) });
    }

    /**
     * Generates an elliptical shadow image using `image` library.
     * @param width The width of the shadowed ellipse.
     * @param height The height of the shadowed ellipse.
     * @param spreadRadius How much the shadow should spread.
     * @param blurRadius The blur radius for the shadow.
     * @param color The color of the shadow.
     * @returns An `image` library Image object representing the shadow.
     */
    public static shadowEllipse(
        width: number,
        height: number,
        spreadRadius: number,
        blurRadius: number,
        color: PdfColor,
    ): im.Image {
        const shadowWidth = Math.round(width + spreadRadius * 2);
        const shadowHeight = Math.round(height + spreadRadius * 2);

        const shadow = new im.Image({
            width: shadowWidth,
            height: shadowHeight,
            format: im.Format.uint8,
            numChannels: 4,
        });

        const fillColor = new im.ColorUint8(4);
        fillColor.r = Math.round(color.red * 255);
        fillColor.g = Math.round(color.green * 255);
        fillColor.b = Math.round(color.blue * 255);
        fillColor.a = Math.round(color.alpha * 255);

        im.fillCircle(
            shadow, {
            x: Math.round(spreadRadius + width / 2),
            y: Math.round(spreadRadius + height / 2),
            radius: Math.round(width / 2), // Assumes radius is based on width
            color: fillColor,
        });

        return im.gaussianBlur(shadow, { radius: Math.round(blurRadius) });
    }

    /** @override */
    public toString(): string {
        return `Image ${this.width}x${this.height} ${this.width * this.height * 4} bytes`;
    }

    /**
     * Converts the bitmap to a PNG image.
     * @returns A Promise that resolves with the PNG image data as a Uint8Array.
     */
    public async toPng(): Promise<Uint8Array> {
        const img = this.asImage();
        // Dart's `im.PngEncoder().encode(img)`
        return new im.PngEncoder().encode(img);
    }

    /**
     * Returns the image as an [Image] object from the pub:image library.
     * @returns An `image` library Image object.
     */
    public asImage(): im.Image {
        // Dart's `pixels.buffer`, `pixels.offsetInBytes`
        // In JavaScript, Uint8Array has `buffer` (ArrayBuffer) and `byteOffset` properties.
        return im.Image.fromBytes({
            width: this.width,
            height: this.height,
            bytes: this.pixels.buffer,
            bytesOffset: this.pixels.byteOffset,
            format: im.Format.uint8,
            numChannels: 4,
        });
    }
}