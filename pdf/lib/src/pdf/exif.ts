// Assuming these are defined in other TypeScript files:
import { PdfImageOrientation } from './obj/image'; // Maps to 'obj/image.dart'

// For dart:convert, using TextDecoder and TextEncoder.
// For dart:typed_data, using Uint8Array, DataView, and ArrayBuffer.

/**
 * Possible Exif tags
 */
export enum PdfExifTag {
    // version tags
    /** EXIF version */
    ExifVersion,

    /** Flashpix format version */
    FlashpixVersion,

    // colorspace tags
    /** Color space information tag */
    ColorSpace,

    // image configuration
    /** Valid width of meaningful image */
    PixelXDimension,

    /** Valid height of meaningful image */
    PixelYDimension,

    /** Information about channels */
    ComponentsConfiguration,

    /** Compressed bits per pixel */
    CompressedBitsPerPixel,

    // user information
    /** Any desired information written by the manufacturer */
    MakerNote,

    /** Comments by user */
    UserComment,

    // related file
    /** Name of related sound file */
    RelatedSoundFile,

    // date and time
    /** Date and time when the original image was generated */
    DateTimeOriginal,

    /** Date and time when the image was stored digitally */
    DateTimeDigitized,

    /** Fractions of seconds for DateTime */
    SubsecTime,

    /** Fractions of seconds for DateTimeOriginal */
    SubsecTimeOriginal,

    /** Fractions of seconds for DateTimeDigitized */
    SubsecTimeDigitized,

    // picture-taking conditions
    /** Exposure time (in seconds) */
    ExposureTime,

    /** F number */
    FNumber,

    /** Exposure program */
    ExposureProgram,

    /** Spectral sensitivity */
    SpectralSensitivity,

    /** ISO speed rating */
    ISOSpeedRatings,

    /** Optoelectric conversion factor */
    OECF,

    /** Shutter speed */
    ShutterSpeedValue,

    /** Lens aperture */
    ApertureValue,

    /** Value of brightness */
    BrightnessValue,

    /** Exposure bias */
    ExposureBias,

    /** Smallest F number of lens */
    MaxApertureValue,

    /** Distance to subject in meters */
    SubjectDistance,

    /** Metering mode */
    MeteringMode,

    /** Kind of light source */
    LightSource,

    /** Flash status */
    Flash,

    /** Location and area of main subject */
    SubjectArea,

    /** Focal length of the lens in mm */
    FocalLength,

    /** Strobe energy in BCPS */
    FlashEnergy,

    /** Spatial Frequency Response */
    SpatialFrequencyResponse,

    /** Number of pixels in width direction per FocalPlaneResolutionUnit */
    FocalPlaneXResolution,

    /** Number of pixels in height direction per FocalPlaneResolutionUnit */
    FocalPlaneYResolution,

    /** Unit for measuring FocalPlaneXResolution and FocalPlaneYResolution */
    FocalPlaneResolutionUnit,

    /** Location of subject in image */
    SubjectLocation,

    /** Exposure index selected on camera */
    ExposureIndex,

    /** Image sensor type */
    SensingMethod,

    /** Image source (3 == DSC) */
    FileSource,

    /** Scene type (1 == directly photographed) */
    SceneType,

    /** Color filter array geometric pattern */
    CFAPattern,

    /** Special processing */
    CustomRendered,

    /** Exposure mode */
    ExposureMode,

    /** 1 = auto white balance, 2 = manual */
    WhiteBalance,

    /** Digital zoom ratio */
    DigitalZoomRation,

    /** Equivalent foacl length assuming 35mm film camera (in mm) */
    FocalLengthIn35mmFilm,

    /** Type of scene */
    SceneCaptureType,

    /** Degree of overall image gain adjustment */
    GainControl,

    /** Direction of contrast processing applied by camera */
    Contrast,

    /** Direction of saturation processing applied by camera */
    Saturation,

    /** Direction of sharpness processing applied by camera */
    Sharpness,

    /** Device Setting Description */
    DeviceSettingDescription,

    /** Distance to subject */
    SubjectDistanceRange,

    // other tags
    /** Interoperability IFD Pointer */
    InteroperabilityIFDPointer,
    /** Identifier assigned uniquely to each image */
    ImageUniqueID,

    // tiff Tags
    /** ImageWidth */
    ImageWidth,

    /** ImageHeight */
    ImageHeight,

    /** ExifIFDPointer */
    ExifIFDPointer,

    /** GPSInfoIFDPointer */
    GPSInfoIFDPointer,

    /** BitsPerSample */
    BitsPerSample,

    /** Compression */
    Compression,

    /** PhotometricInterpretation */
    PhotometricInterpretation,

    /** Orientation */
    Orientation,

    /** SamplesPerPixel */
    SamplesPerPixel,

    /** PlanarConfiguration */
    PlanarConfiguration,

    /** YCbCrSubSampling */
    YCbCrSubSampling,

    /** YCbCrPositioning */
    YCbCrPositioning,

    /** XResolution */
    XResolution,

    /** YResolution */
    YResolution,

    /** ResolutionUnit */
    ResolutionUnit,

    /** StripOffsets */
    StripOffsets,

    /** RowsPerStrip */
    RowsPerStrip,

    /** StripByteCounts */
    StripByteCounts,

    /** JPEGInterchangeFormat */
    JPEGInterchangeFormat,

    /** JPEGInterchangeFormatLength */
    JPEGInterchangeFormatLength,

    /** TransferFunction */
    TransferFunction,

    /** WhitePoint */
    WhitePoint,

    /** PrimaryChromaticities */
    PrimaryChromaticities,

    /** YCbCrCoefficients */
    YCbCrCoefficients,

    /** ReferenceBlackWhite */
    ReferenceBlackWhite,

    /** DateTime */
    DateTime,

    /** ImageDescription */
    ImageDescription,

    /** Make */
    Make,

    /** Model */
    Model,

    /** Software */
    Software,

    /** Artist */
    Artist,

    /** Copyright */
    Copyright,
}

/**
 * Jpeg metadata extraction
 */
export class PdfJpegInfo {
    /** Width of the image */
    public readonly width: number | null;

    /** Height of the image */
    public readonly height: number;

    private readonly _color: number | null;

    /** Is the image color or greyscale */
    public get isRGB(): boolean {
        return this._color === 3;
    }

    /** Exif tags discovered */
    public readonly tags: Map<PdfExifTag, any> | null; // Using 'any' to represent Dart's 'dynamic'

    // Private constructor, similar to Dart's `_` constructor
    private constructor(
        width: number | null,
        height: number,
        color: number | null,
        tags: Map<PdfExifTag, any> | null,
    ) {
        this.width = width;
        this.height = height;
        this._color = color;
        this.tags = tags;
    }

    /**
     * Load a Jpeg image's metadata
     * This acts as a static factory method, similar to Dart's `factory` constructor.
     */
    public static fromBytes(image: Uint8Array): PdfJpegInfo {
        // Dart's `Uint8List.buffer.asByteData` maps to `new DataView`
        const buffer = new DataView(image.buffer, image.byteOffset, image.byteLength);

        let width: number | null = null;
        let height: number = 0; // Initialize height, as it must be non-null after successful parse
        let color: number | null = null;
        let offset = 0;

        while (offset < buffer.byteLength) {
            // Skip fill bytes (0xFF) that might precede a marker
            while (buffer.getUint8(offset) === 0xff) {
                offset++;
            }

            const mrkr = buffer.getUint8(offset);
            offset++;

            if (mrkr === 0xd8) {
                continue; // SOI (Start Of Image) marker
            }

            if (mrkr === 0xd9) {
                break; // EOI (End Of Image) marker
            }

            // Restart markers (RST0-RST7)
            if (0xd0 <= mrkr && mrkr <= 0xd7) {
                continue;
            }

            // TEM (Temporary) marker
            if (mrkr === 0x01) {
                continue;
            }

            // All other markers are followed by a 2-byte length field
            // JPEG marker lengths are always big-endian, so `false` is used for `isLittleEndian`
            const len = buffer.getUint16(offset, false);
            offset += 2;

            // SOF (Start Of Frame) markers (0xC0, 0xC1, 0xC2 for baseline, extended sequential, progressive JPEG)
            if (mrkr >= 0xc0 && mrkr <= 0xc2) {
                // The structure after SOF marker and length:
                // 1 byte: Data precision (usually 8)
                // 2 bytes: Image height
                // 2 bytes: Image width
                // 1 byte: Number of components (e.g., 1 for grayscale, 3 for YCbCr/RGB)
                height = buffer.getUint16(offset + 1, false); // height is at offset + 1
                width = buffer.getUint16(offset + 3, false); // width is at offset + 3
                color = buffer.getUint8(offset + 5); // color (components) is at offset + 5
                break; // Found dimensions, exit loop
            }

            // If not a SOF marker, skip the rest of this segment
            // `len` includes the 2 bytes for length itself, so we subtract 2 to get data bytes
            offset += len - 2;
        }

        if (width === null || height === 0) {
            throw new Error('Unable to find Jpeg image dimensions in the file');
        }

        const tags = PdfJpegInfo._findExifInJpeg(buffer);

        return new PdfJpegInfo(width, height, color, tags);
    }

    /** EXIF version */
    public get exifVersion(): string | null {
        if (!this.tags || !this.tags.has(PdfExifTag.ExifVersion)) {
            return null;
        }
        const versionBytes = this.tags.get(PdfExifTag.ExifVersion);
        if (versionBytes instanceof Uint8Array) {
            // Dart's `utf8.decode` defaults to `allowMalformed: true`.
            // TextDecoder's `fatal: false` provides similar behavior.
            return new TextDecoder('utf-8', { fatal: false }).decode(versionBytes);
        }
        return null;
    }

    /** Flashpix format version */
    public get flashpixVersion(): string | null {
        if (!this.tags || !this.tags.has(PdfExifTag.FlashpixVersion)) {
            return null;
        }
        const versionBytes = this.tags.get(PdfExifTag.FlashpixVersion);
        if (versionBytes instanceof Uint8Array) {
            return new TextDecoder('utf-8', { fatal: false }).decode(versionBytes);
        }
        return null;
    }

    /** Rotation angle of this image */
    public get orientation(): PdfImageOrientation {
        if (!this.tags || !this.tags.has(PdfExifTag.Orientation)) {
            return PdfImageOrientation.topLeft; // Default orientation
        }

        try {
            // Exif orientation values are 1-based (1 to 8).
            // If PdfImageOrientation is a 0-based enum (like 0 to 7),
            // we need to adjust: value - 1.
            const orientationValue: number = this.tags.get(PdfExifTag.Orientation);
            const index = orientationValue - 1;

            // To check if the index is valid for a numeric enum in TypeScript:
            // Object.keys(PdfImageOrientation).length / 2 gives the count of enum members for numeric enums.
            if (index >= 0 && index < Object.keys(PdfImageOrientation).length / 2) {
                return index as PdfImageOrientation;
            }
            return PdfImageOrientation.topLeft; // Fallback for invalid index
        } catch (e) {
            // Dart's `on RangeError` maps to a generic `catch` in TypeScript
            return PdfImageOrientation.topLeft;
        }
    }

    /** Exif horizontal resolution */
    public get xResolution(): number | null {
        if (!this.tags || !this.tags.has(PdfExifTag.XResolution)) {
            return null;
        }
        const resolution = this.tags.get(PdfExifTag.XResolution);
        // Assumes resolution is an array/tuple of [numerator, denominator]
        if (Array.isArray(resolution) && resolution.length === 2 && typeof resolution[0] === 'number' && typeof resolution[1] === 'number' && resolution[1] !== 0) {
            return resolution[0] / resolution[1];
        }
        return null;
    }

    /** Exif vertical resolution */
    public get yResolution(): number | null {
        if (!this.tags || !this.tags.has(PdfExifTag.YResolution)) {
            return null;
        }
        const resolution = this.tags.get(PdfExifTag.YResolution);
        if (Array.isArray(resolution) && resolution.length === 2 && typeof resolution[0] === 'number' && typeof resolution[1] === 'number' && resolution[1] !== 0) {
            return resolution[0] / resolution[1];
        }
        return null;
    }

    /** Exif horizontal pixel dimension */
    public get pixelXDimension(): number | null {
        if (!this.tags || !this.tags.has(PdfExifTag.PixelXDimension)) {
            return this.width;
        }
        const dimension = this.tags.get(PdfExifTag.PixelXDimension);
        return typeof dimension === 'number' ? dimension : this.width;
    }

    /** Exif vertical pixel dimension */
    public get pixelYDimension(): number | null {
        if (!this.tags || !this.tags.has(PdfExifTag.PixelYDimension)) {
            return this.height;
        }
        const dimension = this.tags.get(PdfExifTag.PixelYDimension);
        return typeof dimension === 'number' ? dimension : this.height;
    }

    public toString(): string {
        return `width: ${this.width} height: ${this.height}\n` +
            `exifVersion: ${this.exifVersion} flashpixVersion: ${this.flashpixVersion}\n` +
            `xResolution: ${this.xResolution} yResolution: ${this.yResolution}\n` +
            `pixelXDimension: ${this.pixelXDimension} pixelYDimension: ${this.pixelYDimension}\n` +
            `orientation: ${this.orientation}`;
    }

    private static _findExifInJpeg(buffer: DataView): Map<PdfExifTag, any> | null {
        if (buffer.getUint8(0) !== 0xFF || buffer.getUint8(1) !== 0xD8) {
            // Dart's `return <PdfExifTag, dynamic>{};`
            // Returning an empty Map means no EXIF data found, which is different from null.
            return new Map<PdfExifTag, any>();
        }

        let offset = 2;
        const length = buffer.byteLength;
        let marker: number;

        while (offset < length) {
            const lastValue = buffer.getUint8(offset);
            if (lastValue !== 0xFF) {
                // Not a valid marker, as per Dart code returning empty map
                return new Map<PdfExifTag, any>();
            }

            marker = buffer.getUint8(offset + 1);

            // We are only looking for 0xFFE1 (APP1 marker) which contains EXIF data
            if (marker === 0xE1) {
                return PdfJpegInfo._readEXIFData(buffer, offset + 4);
            } else {
                // Skip this segment: 2 bytes for the marker + 2 bytes for length + length-2 bytes for data
                offset += 2 + buffer.getUint16(offset + 2, false); // false for big-endian (JPEG standard)
            }
        }

        return new Map<PdfExifTag, any>(); // No EXIF data found
    }

    private static _readTags(
        file: DataView,
        tiffStart: number,
        dirStart: number,
        isLittleEndian: boolean, // `bigEnd` in Dart is `isLittleEndian` in TS `DataView` methods
    ): Map<PdfExifTag, any> {
        const entries = file.getUint16(dirStart, isLittleEndian);
        const tags = new Map<PdfExifTag, any>();
        let entryOffset: number;

        for (let i = 0; i < entries; i++) {
            entryOffset = dirStart + i * 12 + 2; // Each IFD entry is 12 bytes long
            const tagId = file.getUint16(entryOffset, isLittleEndian);
            const tag = PdfJpegInfo._exifTags.get(tagId); // Use `.get()` for Map
            if (tag != null) {
                tags.set(
                    tag,
                    PdfJpegInfo._readTagValue(
                        file,
                        entryOffset,
                        tiffStart,
                        isLittleEndian,
                    ),
                );
            }
        }
        return tags;
    }

    private static _readTagValue(
        file: DataView,
        entryOffset: number,
        tiffStart: number,
        isLittleEndian: boolean,
    ): any {
        const type = file.getUint16(entryOffset + 2, isLittleEndian);
        const numValues = file.getUint32(entryOffset + 4, isLittleEndian);
        // The value offset is relative to the start of the TIFF header (tiffStart)
        const valueOffset = file.getUint32(entryOffset + 8, isLittleEndian) + tiffStart;

        switch (type) {
            case 1: // Byte (8-bit unsigned integer)
            case 7: // Undefined (8-bit byte, value depends on field)
                if (numValues === 1) {
                    return file.getUint8(entryOffset + 8); // Value fits directly in 4 bytes
                }
                // If more than 4 bytes, value is at valueOffset, otherwise it's at entryOffset + 8
                const offset8 = numValues > 4 ? valueOffset : (entryOffset + 8);
                const result8 = new Uint8Array(numValues);
                for (let i = 0; i < result8.length; ++i) {
                    result8[i] = file.getUint8(offset8 + i);
                }
                return result8;
            case 2: // ASCII string (8-bit byte)
                const offset2 = numValues > 4 ? valueOffset : (entryOffset + 8);
                return PdfJpegInfo._getStringFromDB(file, offset2, numValues - 1); // -1 for null terminator
            case 3: // Short (16-bit unsigned integer)
                if (numValues === 1) {
                    return file.getUint16(entryOffset + 8, isLittleEndian);
                }
                const offset16 = numValues > 2 ? valueOffset : (entryOffset + 8); // 2 bytes per value * numValues. If total bytes <= 4, it fits.
                const result16 = new Uint16Array(numValues);
                for (let i = 0; i < result16.length; ++i) {
                    result16[i] = file.getUint16(offset16 + i * 2, isLittleEndian);
                }
                return result16;
            case 4: // Long (32-bit unsigned integer)
                if (numValues === 1) {
                    return file.getUint32(entryOffset + 8, isLittleEndian);
                }
                const offset32 = valueOffset; // Always points to the actual data location
                const result32 = new Uint32Array(numValues);
                for (let i = 0; i < result32.length; ++i) {
                    result32[i] = file.getUint32(offset32 + i * 4, isLittleEndian);
                }
                return result32;
            case 5: // Rational (two Long values: numerator, denominator)
                if (numValues === 1) {
                    const numerator = file.getUint32(valueOffset, isLittleEndian);
                    const denominator = file.getUint32(valueOffset + 4, isLittleEndian);
                    return [numerator, denominator];
                }
                const offsetRational = valueOffset;
                const resultRational: number[][] = [];
                for (let i = 0; i < numValues; ++i) {
                    const numerator = file.getUint32(offsetRational + i * 8, isLittleEndian);
                    const denominator = file.getUint32(offsetRational + i * 8 + 4, isLittleEndian);
                    resultRational.push([numerator, denominator]);
                }
                return resultRational;
            case 9: // SLong (32-bit signed integer)
                if (numValues === 1) {
                    return file.getInt32(entryOffset + 8, isLittleEndian);
                }
                const offsetSlong = valueOffset;
                const resultSlong = new Int32Array(numValues);
                for (let i = 0; i < resultSlong.length; ++i) {
                    resultSlong[i] = file.getInt32(offsetSlong + i * 4, isLittleEndian);
                }
                return resultSlong;
            case 10: // SRational (two SLong values: numerator, denominator)
                if (numValues === 1) {
                    const numerator = file.getInt32(valueOffset, isLittleEndian);
                    const denominator = file.getInt32(valueOffset + 4, isLittleEndian);
                    return [numerator, denominator];
                }
                const offsetSRational = valueOffset;
                const resultSRational: number[][] = [];
                for (let i = 0; i < numValues; ++i) {
                    const numerator = file.getInt32(offsetSRational + i * 8, isLittleEndian);
                    const denominator = file.getInt32(offsetSRational + i * 8 + 4, isLittleEndian);
                    resultSRational.push([numerator, denominator]);
                }
                return resultSRational;
            case 11: // Float (32-bit floating point)
                if (numValues === 1) {
                    return file.getFloat32(entryOffset + 8, isLittleEndian);
                }
                const offsetF32 = valueOffset;
                const resultF32 = new Float32Array(numValues);
                for (let i = 0; i < resultF32.length; ++i) {
                    resultF32[i] = file.getFloat32(offsetF32 + i * 4, isLittleEndian);
                }
                return resultF32;
            case 12: // Double (64-bit floating point)
                if (numValues === 1) {
                    return file.getFloat64(entryOffset + 8, isLittleEndian);
                }
                const offsetF64 = valueOffset;
                const resultF64 = new Float64Array(numValues);
                for (let i = 0; i < resultF64.length; ++i) {
                    resultF64[i] = file.getFloat64(offsetF64 + i * 8, isLittleEndian);
                }
                return resultF64;
            default:
                // If type is unknown or unsupported, return undefined (similar to Dart's implicit null)
                return undefined;
        }
    }

    private static _getStringFromDB(buffer: DataView, start: number, length: number): string {
        // Create a subarray (view) of the buffer's underlying ArrayBuffer
        const subarray = new Uint8Array(buffer.buffer, buffer.byteOffset + start, length);
        // Use TextDecoder to decode bytes to string. `fatal: false` allows malformed bytes.
        return new TextDecoder('utf-8', { fatal: false }).decode(subarray);
    }

    private static _readEXIFData(buffer: DataView, start: number): Map<PdfExifTag, any> | null {
        const startingString = PdfJpegInfo._getStringFromDB(buffer, start, 4);
        if (startingString !== 'Exif') {
            return null; // Not valid EXIF data
        }

        let isLittleEndian: boolean;
        const tiffOffset = start + 6; // TIFF header starts 6 bytes after 'Exif\0\0'

        // Read byte order marker (0x4949 for Little-Endian, 0x4D4D for Big-Endian)
        // Read this as big-endian (false) first to correctly determine endianness
        const byteOrderMarker = buffer.getUint16(tiffOffset, false);
        if (byteOrderMarker === 0x4949) { // 'II'
            isLittleEndian = true;
        } else if (byteOrderMarker === 0x4D4D) { // 'MM'
            isLittleEndian = false;
        } else {
            return null; // Not valid TIFF data (invalid byte order)
        }

        // Check TIFF magic number (0x002A)
        if (buffer.getUint16(tiffOffset + 2, isLittleEndian) !== 0x002A) {
            return null; // Not valid TIFF data (invalid magic number)
        }

        // Get offset to the First Image File Directory (IFD)
        const firstIFDOffset = buffer.getUint32(tiffOffset + 4, isLittleEndian);

        if (firstIFDOffset < 0x00000008) {
            return null; // Not valid TIFF data (First IFD offset too small)
        }

        // Read tags from the main IFD
        const tags = PdfJpegInfo._readTags(buffer, tiffOffset, tiffOffset + firstIFDOffset, isLittleEndian);

        // If there's an Exif IFD Pointer, read tags from there and merge
        if (tags.has(PdfExifTag.ExifIFDPointer)) {
            const exifIFDPointer = tags.get(PdfExifTag.ExifIFDPointer);
            if (typeof exifIFDPointer === 'number') {
                const exifData = PdfJpegInfo._readTags(buffer, tiffOffset, tiffOffset + exifIFDPointer, isLittleEndian);
                // Merge `exifData` into the main `tags` map
                exifData.forEach((value, key) => tags.set(key, value));
            }
        }

        return tags;
    }

    // Static readonly Map for EXIF tag IDs to PdfExifTag enum members
    // Using a `Map` is more idiomatic for Dart `Map`s than a plain JS object if keys are not always strings.
    private static readonly _exifTags: ReadonlyMap<number, PdfExifTag> = new Map<number, PdfExifTag>([
        [0x9000, PdfExifTag.ExifVersion],
        [0xA000, PdfExifTag.FlashpixVersion],
        [0xA001, PdfExifTag.ColorSpace],
        [0xA002, PdfExifTag.PixelXDimension],
        [0xA003, PdfExifTag.PixelYDimension],
        [0x9101, PdfExifTag.ComponentsConfiguration],
        [0x9102, PdfExifTag.CompressedBitsPerPixel],
        [0x927C, PdfExifTag.MakerNote],
        [0x9286, PdfExifTag.UserComment],
        [0xA004, PdfExifTag.RelatedSoundFile],
        [0x9003, PdfExifTag.DateTimeOriginal],
        [0x9004, PdfExifTag.DateTimeDigitized],
        [0x9290, PdfExifTag.SubsecTime],
        [0x9291, PdfExifTag.SubsecTimeOriginal],
        [0x9292, PdfExifTag.SubsecTimeDigitized],
        [0x829A, PdfExifTag.ExposureTime],
        [0x829D, PdfExifTag.FNumber],
        [0x8822, PdfExifTag.ExposureProgram],
        [0x8824, PdfExifTag.SpectralSensitivity],
        [0x8827, PdfExifTag.ISOSpeedRatings],
        [0x8828, PdfExifTag.OECF],
        [0x9201, PdfExifTag.ShutterSpeedValue],
        [0x9202, PdfExifTag.ApertureValue],
        [0x9203, PdfExifTag.BrightnessValue],
        [0x9204, PdfExifTag.ExposureBias],
        [0x9205, PdfExifTag.MaxApertureValue],
        [0x9206, PdfExifTag.SubjectDistance],
        [0x9207, PdfExifTag.MeteringMode],
        [0x9208, PdfExifTag.LightSource],
        [0x9209, PdfExifTag.Flash],
        [0x9214, PdfExifTag.SubjectArea],
        [0x920A, PdfExifTag.FocalLength],
        [0xA20B, PdfExifTag.FlashEnergy],
        [0xA20C, PdfExifTag.SpatialFrequencyResponse],
        [0xA20E, PdfExifTag.FocalPlaneXResolution],
        [0xA20F, PdfExifTag.FocalPlaneYResolution],
        [0xA210, PdfExifTag.FocalPlaneResolutionUnit],
        [0xA214, PdfExifTag.SubjectLocation],
        [0xA215, PdfExifTag.ExposureIndex],
        [0xA217, PdfExifTag.SensingMethod],
        [0xA300, PdfExifTag.FileSource],
        [0xA301, PdfExifTag.SceneType],
        [0xA302, PdfExifTag.CFAPattern],
        [0xA401, PdfExifTag.CustomRendered],
        [0xA402, PdfExifTag.ExposureMode],
        [0xA403, PdfExifTag.WhiteBalance],
        [0xA404, PdfExifTag.DigitalZoomRation],
        [0xA405, PdfExifTag.FocalLengthIn35mmFilm],
        [0xA406, PdfExifTag.SceneCaptureType],
        [0xA407, PdfExifTag.GainControl],
        [0xA408, PdfExifTag.Contrast],
        [0xA409, PdfExifTag.Saturation],
        [0xA40A, PdfExifTag.Sharpness],
        [0xA40B, PdfExifTag.DeviceSettingDescription],
        [0xA40C, PdfExifTag.SubjectDistanceRange],
        [0xA005, PdfExifTag.InteroperabilityIFDPointer],
        [0xA420, PdfExifTag.ImageUniqueID],
        [0x0100, PdfExifTag.ImageWidth],
        [0x0101, PdfExifTag.ImageHeight],
        [0x8769, PdfExifTag.ExifIFDPointer],
        [0x8825, PdfExifTag.GPSInfoIFDPointer],
        [0x0102, PdfExifTag.BitsPerSample],
        [0x0103, PdfExifTag.Compression],
        [0x0106, PdfExifTag.PhotometricInterpretation],
        [0x0112, PdfExifTag.Orientation],
        [0x0115, PdfExifTag.SamplesPerPixel],
        [0x011C, PdfExifTag.PlanarConfiguration],
        [0x0212, PdfExifTag.YCbCrSubSampling],
        [0x0213, PdfExifTag.YCbCrPositioning],
        [0x011A, PdfExifTag.XResolution],
        [0x011B, PdfExifTag.YResolution],
        [0x0128, PdfExifTag.ResolutionUnit],
        [0x0111, PdfExifTag.StripOffsets],
        [0x0116, PdfExifTag.RowsPerStrip],
        [0x0117, PdfExifTag.StripByteCounts],
        [0x0201, PdfExifTag.JPEGInterchangeFormat],
        [0x0202, PdfExifTag.JPEGInterchangeFormatLength],
        [0x012D, PdfExifTag.TransferFunction],
        [0x013E, PdfExifTag.WhitePoint],
        [0x013F, PdfExifTag.PrimaryChromaticities],
        [0x0211, PdfExifTag.YCbCrCoefficients],
        [0x0214, PdfExifTag.ReferenceBlackWhite],
        [0x0132, PdfExifTag.DateTime],
        [0x010E, PdfExifTag.ImageDescription],
        [0x010F, PdfExifTag.Make],
        [0x0110, PdfExifTag.Model],
        [0x0131, PdfExifTag.Software],
        [0x013B, PdfExifTag.Artist],
        [0x8298, PdfExifTag.Copyright],
    ]);
}

// Dummy @Override decorator for demonstration if a linting tool expects it.
// In standard TypeScript, this is not needed as `override` is a keyword since TS 4.3.
function Override() {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        // No runtime logic needed for simple override checking.
        // The TypeScript compiler will handle type checking.
    };
}