

export enum PdfAnnotFlags {
    invisible,  // 1
    hidden,     // 2
    print,      // 3
    noZoom,     // 4
    noRotate,   // 5
    noView,     // 6
    readOnly,   // 7
    locked,     // 8
    toggleNoView, // 9
    lockedContent, // 10
}

export enum PdfAnnotAppearance {
    normal,
    rollover,
    down,
}

export enum PdfAnnotHighlighting {
    none,
    invert,
    outline,
    push,
    toggle,
}

export enum PdfFieldFlags {
    readOnly,           // 1
    mandatory,          // 2
    noExport,           // 3
    reserved4,
    reserved5,
    reserved6,
    reserved7,
    reserved8,
    reserved9,
    reserved10,
    reserved11,
    reserved12,
    multiline,          // 13
    password,           // 14
    noToggleToOff,      // 15
    radio,              // 16
    pushButton,         // 17
    combo,              // 18
    edit,               // 19
    sort,               // 20
    fileSelect,         // 21
    multiSelect,        // 22
    doNotSpellCheck,    // 23
    doNotScroll,        // 24
    comb,               // 25
    radiosInUnison,     // 26
    commitOnSelChange,  // 27
}

export enum PdfTextFieldAlign {
    left,
    center,
    right,
}

export abstract class PdfAnnotBase {
    public readonly subtype: string;
    public readonly rect: PdfRect;
    public readonly border?: PdfBorder;
    public readonly content?: string;
    public readonly name?: string;
    public readonly author?: string;
    public readonly subject?: string;
    public readonly flags: Set<PdfAnnotFlags>;
    public readonly date?: Date;
    public readonly color?: PdfColor;

    private readonly _appearances: { [key: string]: PdfDataType | PdfObjectRef } = {};
    private _as: PdfName | null = null;

    constructor(params: {
        subtype: string;
        rect: PdfRect;
        border?: PdfBorder;
        content?: string;
        name?: string;
        flags?: Set<PdfAnnotFlags>;
        date?: Date;
        color?: PdfColor;
        subject?: string;
        author?: string;
    }) {
        this.subtype = params.subtype;
        this.rect = params.rect;
        this.border = params.border;
        this.content = params.content;
        this.name = params.name;
        this.date = params.date;
        this.color = params.color;
        this.subject = params.subject;
        this.author = params.author;
        this.flags = params.flags ?? new Set([PdfAnnotFlags.print]);
    }

    get flagValue(): number {
        if (this.flags.size === 0) {
            return 0;
        }
        return Array.from(this.flags)
            .map(e => 1 << e)
            .reduce((a, b) => a | b, 0);
    }

    public appearance(
        pdfDocument: PdfDocument,
        type: PdfAnnotAppearance,
        options: {
            name?: string;
            matrix?: Matrix4;
            boundingBox?: PdfRect;
            selected?: boolean;
        } = {}
    ): PdfGraphics {
        const { name, matrix, boundingBox, selected = false } = options;
        const s = new PdfGraphicXObject(pdfDocument, '/Form');

        let n: string;
        switch (type) {
            case PdfAnnotAppearance.normal: n = '/N'; break;
            case PdfAnnotAppearance.rollover: n = '/R'; break;
            case PdfAnnotAppearance.down: n = '/D'; break;
        }

        if (name == null) {
            this._appearances[n] = s.ref();
        } else {
            if (!(this._appearances[n] instanceof PdfDict)) {
                this._appearances[n] = new PdfDict();
            }
            const d = this._appearances[n] as PdfDict;
            d.set(name, s.ref());
        }

        if (matrix) {
            s.params.set('/Matrix', PdfArray.fromNum(
                [matrix[0], matrix[1], matrix[4], matrix[5], matrix[12], matrix[13]]
            ));
        }

        const bBox = boundingBox ?? PdfRect.fromPoints(PdfPoint.zero, this.rect.size);
        s.params.set('/BBox', PdfArray.fromNum([bBox.x, bBox.y, bBox.width, bBox.height]));

        const g = new PdfGraphics(s, s.buf);

        if (selected && name != null) {
            this._as = new PdfName(name);
        }
        return g;
    }

    build(page: PdfPage, object: PdfObject<PdfDict>, params: PdfDict): void {
        params.set('/Subtype', new PdfName(this.subtype));
        params.set('/Rect', PdfArray.fromNum([this.rect.left, this.rect.bottom, this.rect.right, this.rect.top]));
        params.set('/P', page.ref());

        if (this.border == null) {
            params.set('/Border', PdfArray.fromNum([0, 0, 0]));
        } else {
            params.set('/BS', this.border.ref());
        }

        if (this.content != null) {
            params.set('/Contents', PdfString.fromString(this.content));
        }
        if (this.name != null) {
            params.set('/NM', PdfString.fromString(this.name));
        }
        if (this.flags.size > 0) {
            params.set('/F', new PdfNum(this.flagValue));
        }
        if (this.date != null) {
            params.set('/M', PdfString.fromDate(this.date));
        }
        if (this.color != null) {
            params.set('/C', PdfArray.fromColor(this.color));
        }
        if (this.subject != null) {
            params.set('/Subj', PdfString.fromString(this.subject));
        }
        if (this.author != null) {
            params.set('/T', PdfString.fromString(this.author));
        }
        if (Object.keys(this._appearances).length > 0) {
            params.set('/AP', PdfDict.values(this._appearances));
            if (this._as != null) {
                params.set('/AS', this._as);
            }
        }
    }
}

export abstract class PdfAnnotWidget extends PdfAnnotBase {
    public readonly fieldType: string;
    public readonly fieldName?: string;
    public readonly highlighting?: PdfAnnotHighlighting;
    public readonly backgroundColor?: PdfColor;

    constructor(params: {
        rect: PdfRect;
        fieldType: string;
        fieldName?: string;
        border?: PdfBorder;
        flags?: Set<PdfAnnotFlags>;
        date?: Date;
        color?: PdfColor;
        backgroundColor?: PdfColor;
        highlighting?: PdfAnnotHighlighting;
        subject?: string;
        author?: string;
    }) {
        super({
            subtype: '/Widget',
            ...params,
        });
        this.fieldType = params.fieldType;
        this.fieldName = params.fieldName;
        this.highlighting = params.highlighting;
        this.backgroundColor = params.backgroundColor;
    }

    public build(page: PdfPage, object: PdfObject<PdfDict>, params: PdfDict): void {
        super.build(page, object, params);

        params.set('/FT', new PdfName(this.fieldType));
        if (this.fieldName != null) {
            params.set('/T', PdfString.fromString(this.fieldName));
        }

        const mk = PdfDict.values({});
        if (this.color != null) {
            mk.values['/BC'] = PdfArray.fromColor(this.color);
        }
        if (this.backgroundColor != null) {
            mk.values['/BG'] = PdfArray.fromColor(this.backgroundColor);
        }
        if (Object.keys(mk.values).length > 0) {
            params.set('/MK', mk);
        }

        if (this.highlighting != null) {
            switch (this.highlighting) {
                case PdfAnnotHighlighting.none: params.set('/H', new PdfName('/N')); break;
                case PdfAnnotHighlighting.invert: params.set('/H', new PdfName('/I')); break;
                case PdfAnnotHighlighting.outline: params.set('/H', new PdfName('/O')); break;
                case PdfAnnotHighlighting.push: params.set('/H', new PdfName('/P')); break;
                case PdfAnnotHighlighting.toggle: params.set('/H', new PdfName('/T')); break;
            }
        }
    }
}

export class PdfChoiceField extends PdfAnnotWidget {
    public readonly items: string[];
    public readonly textColor: PdfColor;
    public readonly value?: string;
    public readonly defaultValue?: string;
    public readonly fieldFlags: Set<PdfFieldFlags>;
    public readonly font: PdfFont;
    public readonly fontSize: number;

    constructor(params: {
        rect: PdfRect;
        textColor: PdfColor;
        font: PdfFont;
        fontSize: number;
        items: string[];
        fieldName?: string;
        value?: string;
        defaultValue?: string;
    }) {
        super({
            rect: params.rect,
            fieldType: '/Ch',
            fieldName: params.fieldName,
        });
        this.items = params.items;
        this.textColor = params.textColor;
        this.value = params.value;
        this.defaultValue = params.defaultValue;
        this.font = params.font;
        this.fontSize = params.fontSize;
        this.fieldFlags = new Set([PdfFieldFlags.combo]);
    }

    get fieldFlagsValue(): number {
        if (!this.fieldFlags || this.fieldFlags.size === 0) {
            return 0;
        }
        return Array.from(this.fieldFlags)
            .map(e => 1 << e)
            .reduce((a, b) => a | b, 0);
    }

    public build(page: PdfPage, object: PdfObject<PdfDict>, params: PdfDict): void {
        super.build(page, object, params);

        params.set('/Ff', new PdfNum(this.fieldFlagsValue));
        params.set('/Opt', new PdfArray(this.items.map(e => PdfString.fromString(e))));

        if (this.defaultValue != null) {
            params.set('/DV', PdfString.fromString(this.defaultValue));
        }

        if (this.value != null) {
            params.set('/V', PdfString.fromString(this.value));
        } else {
            params.set('/V', PdfNull.instance);
        }

        const buf = new PdfStream();
        const g = new PdfGraphics(page, buf);
        g.setFillColor(this.textColor);
        g.setFont(this.font, this.fontSize);
        params.set('/DA', PdfString.fromStream(buf));
    }
}

export class PdfAnnot extends PdfObject<PdfDict> {
    public readonly annot: PdfAnnotBase;
    public readonly pdfPage: PdfPage;

    constructor(pdfPage: PdfPage, annot: PdfAnnotBase, options: { objser?: number; objgen?: number } = {}) {
        super(pdfPage.pdfDocument, {
            ...options,
            params: PdfDict.values({
                '/Type': new PdfName('/Annot'),
            }),
        });
        this.annot = annot;
        this.pdfPage = pdfPage;
        pdfPage.annotations.push(this);
    }

    public prepare(): void {
        super.prepare();
        this.annot.build(this.pdfPage, this, this.params);
    }
}

export class PdfAnnotText extends PdfAnnotBase {
    constructor(params: {
        rect: PdfRect;
        content: string;
        border?: PdfBorder;
        name?: string;
        flags?: Set<PdfAnnotFlags>;
        date?: Date;
        color?: PdfColor;
        subject?: string;
        author?: string;
    }) {
        super({
            subtype: '/Text',
            ...params,
        });
    }
}

export class PdfAnnotNamedLink extends PdfAnnotBase {
    public readonly dest: string;

    constructor(params: {
        rect: PdfRect;
        dest: string;
        border?: PdfBorder;
        flags?: Set<PdfAnnotFlags>;
        date?: Date;
        color?: PdfColor;
        subject?: string;
        author?: string;
    }) {
        super({
            subtype: '/Link',
            ...params,
        });
        this.dest = params.dest;
    }

    public build(page: PdfPage, object: PdfObject<PdfDict>, params: PdfDict): void {
        super.build(page, object, params);
        params.set('/A', PdfDict.values({
            '/S': new PdfName('/GoTo'),
            '/D': PdfString.fromString(this.dest),
        }));
    }
}

export class PdfAnnotUrlLink extends PdfAnnotBase {
    public readonly url: string;
    constructor(params: {
        rect: PdfRect;
        url: string;
        border?: PdfBorder;
        flags?: Set<PdfAnnotFlags>;
        date?: Date;
        color?: PdfColor;
        subject?: string;
        author?: string;
    }) {
        super({
            subtype: '/Link',
            ...params,
        });
        this.url = params.url;
    }

    public build(page: PdfPage, object: PdfObject<PdfDict>, params: PdfDict): void {
        super.build(page, object, params);
        params.set('/A', PdfDict.values({
            '/S': new PdfName('/URI'),
            '/URI': PdfString.fromString(this.url),
        }));
    }
}

export class PdfAnnotSquare extends PdfAnnotBase {
    public readonly interiorColor?: PdfColor;

    constructor(params: {
        rect: PdfRect;
        border?: PdfBorder;
        flags?: Set<PdfAnnotFlags>;
        date?: Date;
        color?: PdfColor;
        interiorColor?: PdfColor;
        subject?: string;
        author?: string;
    }) {
        super({
            subtype: '/Square',
            ...params,
        });
        this.interiorColor = params.interiorColor;
    }

    public build(page: PdfPage, object: PdfObject<PdfDict>, params: PdfDict): void {
        super.build(page, object, params);
        if (this.interiorColor != null) {
            params.set('/IC', PdfArray.fromColor(this.interiorColor));
        }
    }
}

export class PdfAnnotCircle extends PdfAnnotBase {
    public readonly interiorColor?: PdfColor;
    constructor(params: {
        rect: PdfRect;
        border?: PdfBorder;
        flags?: Set<PdfAnnotFlags>;
        date?: Date;
        color?: PdfColor;
        interiorColor?: PdfColor;
        subject?: string;
        author?: string;
    }) {
        super({
            subtype: '/Circle',
            ...params,
        });
        this.interiorColor = params.interiorColor;
    }
    public build(page: PdfPage, object: PdfObject<PdfDict>, params: PdfDict): void {
        super.build(page, object, params);
        if (this.interiorColor != null) {
            params.set('/IC', PdfArray.fromColor(this.interiorColor));
        }
    }
}

export class PdfAnnotPolygon extends PdfAnnotBase {
    public readonly document: PdfDocument;
    public readonly points: PdfPoint[];
    public readonly interiorColor?: PdfColor;

    constructor(
        document: PdfDocument,
        points: PdfPoint[],
        params: {
            rect: PdfRect;
            border?: PdfBorder;
            flags?: Set<PdfAnnotFlags>;
            date?: Date;
            color?: PdfColor;
            interiorColor?: PdfColor;
            subject?: string;
            author?: string;
            closed?: boolean;
        }
    ) {
        super({
            subtype: (params.closed ?? true) ? '/Polygon' : '/PolyLine',
            ...params,
        });
        this.document = document;
        this.points = points;
        this.interiorColor = params.interiorColor;
    }

    public build(page: PdfPage, object: PdfObject<PdfDict>, params: PdfDict): void {
        super.build(page, object, params);

        // Flip the points on the Y axis.
        const flippedPoints = this.points.map(p => new PdfPoint(p.x, this.rect.height - p.y));
        const vertices: number[] = [];
        for (const point of flippedPoints) {
            vertices.push(point.x, point.y);
        }
        params.set('/Vertices', PdfArray.fromNum(vertices));

        if (this.interiorColor != null) {
            params.set('/IC', PdfArray.fromColor(this.interiorColor));
        }
    }
}

export class PdfAnnotInk extends PdfAnnotBase {
    public readonly document: PdfDocument;
    public readonly points: PdfPoint[][];

    constructor(
        document: PdfDocument,
        points: PdfPoint[][],
        params: {
            rect: PdfRect;
            border?: PdfBorder;
            flags?: Set<PdfAnnotFlags>;
            date?: Date;
            color?: PdfColor;
            subject?: string;
            author?: string;
            content?: string;
        }
    ) {
        super({
            subtype: '/Ink',
            ...params,
        });
        this.document = document;
        this.points = points;
    }

    public build(page: PdfPage, object: PdfObject<PdfDict>, params: PdfDict): void {
        super.build(page, object, params);

        const vertices: PdfArray<PdfNum>[] = [];
        for (const pointList of this.points) {
            const flippedPoints = pointList.map(p => new PdfPoint(p.x, this.rect.height - p.y));
            const path: number[] = [];
            for (const point of flippedPoints) {
                path.push(point.x, point.y);
            }
            vertices.push(PdfArray.fromNum(path));
        }
        params.set('/InkList', new PdfArray(vertices));
    }
}

export class PdfAnnotSign extends PdfAnnotWidget {
    constructor(params: {
        rect: PdfRect;
        fieldName?: string;
        border?: PdfBorder;
        flags?: Set<PdfAnnotFlags>;
        date?: Date;
        color?: PdfColor;
        highlighting?: PdfAnnotHighlighting;
    }) {
        super({
            fieldType: '/Sig',
            ...params,
        });
    }

    public build(page: PdfPage, object: PdfObject<PdfDict>, params: PdfDict): void {
        super.build(page, object, params);
        if (page.pdfDocument.sign != null) {
            params.set('/V', page.pdfDocument.sign.ref());
        }
    }
}

export abstract class PdfFormField extends PdfAnnotWidget {
    public readonly alternateName?: string;
    public readonly mappingName?: string;
    public readonly fieldFlags?: Set<PdfFieldFlags>;

    constructor(params: {
        fieldType: string;
        rect: PdfRect;
        fieldName?: string;
        alternateName?: string;
        mappingName?: string;
        border?: PdfBorder;
        flags?: Set<PdfAnnotFlags>;
        date?: Date;
        subject?: string;
        author?: string;
        color?: PdfColor;
        backgroundColor?: PdfColor;
        highlighting?: PdfAnnotHighlighting;
        fieldFlags?: Set<PdfFieldFlags>;
    }) {
        super(params);
        this.alternateName = params.alternateName;
        this.mappingName = params.mappingName;
        this.fieldFlags = params.fieldFlags;
    }

    get fieldFlagsValue(): number {
        if (!this.fieldFlags || this.fieldFlags.size === 0) {
            return 0;
        }
        return Array.from(this.fieldFlags)
            .map(e => 1 << e)
            .reduce((a, b) => a | b, 0);
    }

    public build(page: PdfPage, object: PdfObject<PdfDict>, params: PdfDict): void {
        super.build(page, object, params);
        if (this.alternateName != null) {
            params.set('/TU', PdfString.fromString(this.alternateName));
        }
        if (this.mappingName != null) {
            params.set('/TM', PdfString.fromString(this.mappingName));
        }
        params.set('/Ff', new PdfNum(this.fieldFlagsValue));
    }
}

export class PdfTextField extends PdfFormField {
    public readonly maxLength?: number;
    public readonly value?: string;
    public readonly defaultValue?: string;
    public readonly font: PdfFont;
    public readonly fontSize: number;
    public readonly textColor: PdfColor;
    public readonly textAlign?: PdfTextFieldAlign;

    constructor(params: {
        rect: PdfRect;
        fieldName?: string;
        alternateName?: string;
        mappingName?: string;
        border?: PdfBorder;
        flags?: Set<PdfAnnotFlags>;
        date?: Date;
        subject?: string;
        author?: string;
        color?: PdfColor;
        backgroundColor?: PdfColor;
        highlighting?: PdfAnnotHighlighting;
        fieldFlags?: Set<PdfFieldFlags>;
        value?: string;
        defaultValue?: string;
        maxLength?: number;
        font: PdfFont;
        fontSize: number;
        textColor: PdfColor;
        textAlign?: PdfTextFieldAlign;
    }) {
        super({
            fieldType: '/Tx',
            ...params
        });
        this.maxLength = params.maxLength;
        this.value = params.value;
        this.defaultValue = params.defaultValue;
        this.font = params.font;
        this.fontSize = params.fontSize;
        this.textColor = params.textColor;
        this.textAlign = params.textAlign;
    }

    public build(page: PdfPage, object: PdfObject<PdfDict>, params: PdfDict): void {
        super.build(page, object, params);
        if (this.maxLength != null) {
            params.set('/MaxLen', new PdfNum(this.maxLength));
        }

        const buf = new PdfStream();
        const g = new PdfGraphics(page, buf);
        g.setFillColor(this.textColor);
        g.setFont(this.font, this.fontSize);
        params.set('/DA', PdfString.fromStream(buf));

        if (this.value != null) {
            params.set('/V', PdfString.fromString(this.value));
        }
        if (this.defaultValue != null) {
            params.set('/DV', PdfString.fromString(this.defaultValue));
        }
        if (this.textAlign != null) {
            params.set('/Q', new PdfNum(this.textAlign));
        }
    }
}

export class PdfButtonField extends PdfFormField {
    public readonly value?: string;
    public readonly defaultValue?: string;

    constructor(params: {
        rect: PdfRect;
        fieldName: string;
        alternateName?: string;
        mappingName?: string;
        border?: PdfBorder;
        flags?: Set<PdfAnnotFlags>;
        date?: Date;
        color?: PdfColor;
        backgroundColor?: PdfColor;
        highlighting?: PdfAnnotHighlighting;
        fieldFlags?: Set<PdfFieldFlags>;
        value?: string;
        defaultValue?: string;
    }) {
        super({
            fieldType: '/Btn',
            ...params,
        });
        this.value = params.value;
        this.defaultValue = params.defaultValue;
    }

    public build(page: PdfPage, object: PdfObject<PdfDict>, params: PdfDict): void {
        super.build(page, object, params);

        if (this.value != null) {
            params.set('/V', new PdfName(this.value));
        }
        if (this.defaultValue != null) {
            params.set('/DV', new PdfName(this.defaultValue));
        }
    }
}