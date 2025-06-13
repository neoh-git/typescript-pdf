// Assuming these types are defined and exported from their respective files:
import { PdfDocument } from '../document';
import { PdfArray } from '../format/array';
import { PdfDict } from '../format/dict';
import { PdfName } from '../format/name';
import { PdfNum } from '../format/num';
import { PdfAnnot } from './annotation'; // Assumed from 'annotation.dart'
import { PdfMetadata } from './metadata';
import { PdfNames } from './names';
import { PdfObject } from './object';
import { PdfOutline } from './outline';
import { PdfPageLabels } from './page_label';
import { PdfPageList } from './page_list';
import { PdfaAttachedFiles } from './pdfa/pdfa_attached_files';
import { PdfaColorProfile } from './pdfa/pdfa_color_profile';

// Assuming these specific types are also defined in their respective files.
// For example, from the previous translations:
// import { PdfAnnotSign } from './annotation'; // If PdfAnnotSign is exported from annotation.ts
// import { PdfTextField } from './textfield'; // If PdfTextField is exported from textfield.ts


/**
 * Defines possible initial page modes for a PDF document.
 */
export enum PdfPageMode {
    /** Document opens with neither bookmarks nor thumbnails visible. */
    useNone,
    /** Document opens with bookmarks (outlines) visible. */
    useOutlines,
    /** Document opens with page thumbnails visible. */
    useThumbs,
    /** Document opens in full-screen mode. */
    fullScreen,
    // Note: Dart's List<String> _pdfPageModes maps indices to '/UseNone', '/UseOutlines', etc.
    // The enum members automatically get numeric values starting from 0 by default.
}

/**
 * Represents the PDF Catalog object.
 * The Catalog dictionary is the root of the PDF document's object hierarchy.
 */
export class PdfCatalog extends PdfObject<PdfDict> {
    /**
     * The PdfPageList object, which is the root of the document's page tree.
     */
    public readonly pdfPageList: PdfPageList;

    /**
     * The PdfOutline object, representing the document's bookmark hierarchy.
     */
    public outlines?: PdfOutline;

    /**
     * The document's metadata stream.
     */
    public metadata?: PdfMetadata;

    /**
     * Color profile output intent (for PDF/A compliance).
     */
    public colorProfile?: PdfaColorProfile;

    /**
     * Attached files dictionary (for PDF/A-3b compliance).
     */
    public attached?: PdfaAttachedFiles;

    /**
     * The initial page mode for the document.
     */
    public readonly pageMode?: PdfPageMode;

    /**
     * The Names dictionary, containing mappings for named destinations, embedded files, etc.
     */
    public names?: PdfNames;

    /**
     * The PageLabels object, defining how pages are numbered.
     */
    public pageLabels?: PdfPageLabels;

    /**
     * Internal mapping of PdfPageMode enum to PDF standard names.
     * The order matches the PdfPageMode enum's implicit numeric indices.
     */
    private static readonly _pdfPageModes: readonly string[] = [
        '/UseNone',
        '/UseOutlines',
        '/UseThumbs',
        '/FullScreen'
    ];

    /**
     * Constructs a Pdf Catalog object.
     * @param pdfDocument The PdfDocument instance this catalog belongs to.
     * @param pdfPageList The PdfPageList object for the document.
     * @param params.pageMode Optional initial page mode for the document.
     * @param params.objser Optional object serial number.
     * @param params.objgen Optional object generation number. Defaults to 0.
     */
    constructor(
        pdfDocument: PdfDocument,
        pdfPageList: PdfPageList,
        params: {
            pageMode?: PdfPageMode;
            objser?: number;
            objgen?: number;
        } = {}
    ) {
        super(
            pdfDocument,
            {
                params: PdfDict.values({ // Initialize with /Type /Catalog
                    '/Type': new PdfName('/Catalog'),
                }),
                objser: params.objser,
                objgen: params.objgen ?? 0,
            }
        );
        this.pdfPageList = pdfPageList;
        this.pageMode = params.pageMode;
    }

    /**
     * Prepares the Catalog object for output to the PDF document.
     * This method populates its internal PdfDict (`this.params`) with
     * all the necessary references and metadata.
     */
    public prepare(): void {
        super.prepare(); // Call superclass's prepare method

        // Set the PDF specification version if it overrides the header version
        this.params.set('/Version', new PdfName(`/${this.pdfDocument.versionString}`));

        // Reference to the document's page tree
        this.params.set('/Pages', this.pdfPageList.ref());

        // Reference to the Outlines (bookmarks) object, if present and not empty
        if (this.outlines != null && this.outlines.outlines.length > 0) {
            this.params.set('/Outlines', this.outlines.ref());
        }

        // Reference to the document's metadata stream, if present
        if (this.metadata != null) {
            this.params.set('/Metadata', this.metadata.ref());
        }

        // Attached files (PDF/A 3b)
        if (this.attached != null && this.attached.isNotEmpty) {
            // Merge attached files names into the main Names dictionary
            // Assumes `names` object is initialized or will be created.
            if (this.names) { // Only merge if names object already exists.
                this.names.params.merge(this.attached.catalogNames());
            } else {
                // If names is null, this would typically create a new Names object first
                // or assume that PdfaAttachedFiles.catalogNames() creates one with a default.
                // Following Dart, it assumes `names` is assigned externally if it exists.
                // If `names` is truly meant to be implicitly created, it needs more logic.
                console.warn("PdfCatalog: attached files exist but no PdfNames object to merge into.");
            }
            this.params.set('/AF', this.attached.catalogAF()); // Array of embedded file references
        }

        // Reference to the Names dictionary, if present
        if (this.names != null) {
            this.params.set('/Names', this.names.ref());
        }

        // Reference to the PageLabels object, if present and not empty
        if (this.pageLabels != null && this.pageLabels.labels.length > 0) {
            this.params.set('/PageLabels', this.pageLabels.ref());
        }

        // Set the initial page mode
        if (this.pageMode != null) {
            this.params.set('/PageMode', new PdfName(PdfCatalog._pdfPageModes[this.pageMode]));
        }

        // Digital Signature related entries
        if (this.pdfDocument.sign != null) {
            // Document Modification Policy (MDP)
            if (this.pdfDocument.sign.value && this.pdfDocument.sign.value.hasMDP) { // Check if .value exists
                this.params.set('/Perms', PdfDict.values({
                    '/DocMDP': this.pdfDocument.sign.ref(),
                }));
            }

            // Document Security Store (DSS)
            const dss = new PdfDict();
            if (this.pdfDocument.sign.crl.length > 0) {
                dss.set('/CRLs', PdfArray.fromObjects(this.pdfDocument.sign.crl));
            }
            if (this.pdfDocument.sign.cert.length > 0) {
                dss.set('/Certs', PdfArray.fromObjects(this.pdfDocument.sign.cert));
            }
            if (this.pdfDocument.sign.ocsp.length > 0) {
                dss.set('/OCSPs', PdfArray.fromObjects(this.pdfDocument.sign.ocsp));
            }
            if (dss.isNotEmpty) { // Check if DSS dict actually has entries
                this.params.set('/DSS', dss);
            }
        }

        // Collect all widget annotations from all pages
        const widgets: PdfAnnot[] = [];
        for (const page of this.pdfDocument.pdfPageList.pages) {
            for (const annot of page.annotations) {
                if (annot.annot.subtype === '/Widget') {
                    widgets.push(annot);
                }
            }
        }

        // If there are widget annotations, add AcroForm dictionary
        if (widgets.length > 0) {
            // Get or create /AcroForm dictionary
            let acroForm = this.params.get('/AcroForm');
            if (!(acroForm instanceof PdfDict)) {
                acroForm = new PdfDict();
                this.params.set('/AcroForm', acroForm);
            }
            // Add SigFlags (signature flags)
            const currentSigFlags = acroForm.get('/SigFlags');
            const currentSigFlagsNum = currentSigFlags instanceof PdfNum ? currentSigFlags : new PdfNum(0);
            const newSigFlagsValue = (this.pdfDocument.sign?.flagsValue ?? 0);
            acroForm.set('/SigFlags', currentSigFlagsNum.bitwiseOr(new PdfNum(newSigFlagsValue)));

            // Get or create /Fields array for form fields
            let fields = acroForm.get('/Fields');
            if (!(fields instanceof PdfArray)) {
                fields = new PdfArray();
                acroForm.set('/Fields', fields);
            }

            const fontRefs = new PdfDict(); // To collect font resources for form fields

            for (const widget of widgets) {
                // Special handling for PdfTextField to collect font references
                if (widget.annot && (widget.annot as any).font && (widget.annot as any).font.ref) {
                    // Type assertion to access font properties, assuming PdfTextField has them
                    const tf = widget.annot as any; // Using `any` to avoid complex type guarding here
                    fontRefs.set(tf.font.name, tf.font.ref());
                }

                const widgetRef = widget.ref();
                // Add widget reference to /Fields array if not already present
                // This requires iterating `fields.values` for value equality on `PdfObjectRef`
                if (!fields.values.some(val => val instanceof PdfObjectRef && val.obj === widgetRef.obj)) {
                    fields.add(widgetRef as any); // Add assumes PdfArray can take PdfObjectRef
                }
            }

            // If fonts were collected for form fields, add them to /DR (Document Resources)
            if (fontRefs.isNotEmpty) {
                acroForm.set('/DR', PdfDict.values({
                    '/Font': fontRefs
                }));
            }
        }

        // Output Intent for color profile (Pdf/A)
        if (this.colorProfile != null) {
            this.params.set('/OutputIntents', this.colorProfile.outputIntents());
        }
    }
}