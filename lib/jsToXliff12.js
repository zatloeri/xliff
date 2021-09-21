import convert from "xml-js";
import ElementTypes12 from "./inline-elements/ElementTypes12.js";
import { makeElement, makeText, makeValue } from "./xml-js/objectToXml.js";

import escape from "./util/escape.js";

const CUSTOM_ATTRIBUTES_KEY = "additionalAttributes";
const CUSTOM_ELEMENT_TYPE_KEY = "elementType";

const jsToXliff12Clb = (obj, opt, cb) => {
    if (!cb && typeof opt === "function") {
        cb = opt;
        opt = { indent: "  " };
    }
    opt = opt || { indent: "  " };

    const options = {
        spaces: opt.indent !== undefined ? opt.indent : "  ",
        xmlLangAttr: !!opt.xmlLangAttr,
    };

    const specifiedRootAttributes = getAttributes(obj);
    const rootAttributes = {
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "xsi:schemaLocation":
            "urn:oasis:names:tc:xliff:document:1.2 http://docs.oasis-open.org/xliff/v1.2/os/xliff-core-1.2-strict.xsd",
        xmlns: "urn:oasis:names:tc:xliff:document:1.2",
        version: "1.2",
        ...(specifiedRootAttributes || {}),
    };
    const root = makeElement("xliff", rootAttributes, true);

    Object.keys(obj.resources).forEach((nsName) => {
        const fileObject = obj.resources[nsName];
        const bodyChildren = createUnitTags(fileObject, obj, options);
        const specifiedFileAttributes = getAttributes(obj.resources[nsName]);

        const b = makeElement("body", null, bodyChildren);
        const fileAttributes = {
            original: nsName,
            datatype: "plaintext",
            "source-language": obj.sourceLanguage,
            "target-language": obj.targetLanguage,
            ...(specifiedFileAttributes || {}),
        };
        // filter out entries that are anulled - adds the ability to remove some default attributes
        const validFileAttributes = clearFalsyValuesFromObject(fileAttributes);
        const f = makeElement("file", validFileAttributes, [b]);
        root.elements.push(f);
    });

    const xmlJs = {
        elements: [root],
    };

    const xml = convert.js2xml(xmlJs, options);
    if (cb) cb(null, xml);
    return xml;
};

function clearFalsyValuesFromObject(object) {
    const result = Object.keys(object).reduce((accumulator, currKey) => {
        if (!object[currKey]) {
            return accumulator;
        }
        return { ...accumulator, [currKey]: object[currKey] };
    }, {});
    return result;
}

function createUnitTags(unitElements, obj, options) {
    const elements = Object.keys(unitElements).map((key) => {
        if (unitElements[key].elementType === "group") {
            return createGroupUnitTag(key, unitElements[key], obj, options);
        } else if (
            key !== CUSTOM_ATTRIBUTES_KEY &&
            key !== CUSTOM_ELEMENT_TYPE_KEY
        ) {
            return createTransUnitTag(key, unitElements[key], obj, options);
        } else {
            // ignore attributes
            return false;
        }
    });
    // Only valid elements
    return elements.filter(Boolean);
}

function getAttributes(objectToCreateFrom) {
    return objectToCreateFrom[CUSTOM_ATTRIBUTES_KEY];
}

function createGroupUnitTag(key, resource, obj, options) {
    const additionalAttributes =
        resource.additionalAttributes != null
            ? resource.additionalAttributes
            : {};
    const groupUnits = createUnitTags(resource, obj, options);
    return makeElement(
        "group",
        clearFalsyValuesFromObject({
            ...{ id: escape(key) },
            ...additionalAttributes,
        }),
        groupUnits
    );
}

function createTransUnitTag(key, resource, obj, options) {
    const additionalAttributes =
        resource.additionalAttributes != null
            ? resource.additionalAttributes
            : {};
    const u = makeElement(
        "trans-unit",
        clearFalsyValuesFromObject({
            ...{ id: escape(key) },
            ...additionalAttributes,
        }),
        true
    );
    let sourceAttributes = null;
    if (options.xmlLangAttr) {
        sourceAttributes = {
            "xml:lang": obj.sourceLanguage,
        };
    }
    u.elements.push(
        makeElement(
            "source",
            sourceAttributes,
            makeValue(resource.source, ElementTypes12)
        )
    );
    if (resource.target != null) {
        let targetAttributes = null;
        if (options.xmlLangAttr && obj.targetLanguage) {
            targetAttributes = {
                "xml:lang": obj.targetLanguage,
            };
        }
        u.elements.push(
            makeElement(
                "target",
                targetAttributes,
                makeValue(resource.target, ElementTypes12)
            )
        );
    }
    if ("note" in resource) {
        u.elements.push(createNoteElement(resource.note));
    }

    return u;
}

const createNoteElement = (noteSpec) => {
    if (typeof noteSpec === "string") {
        return makeElement("note", null, [makeText(noteSpec)]);
    }
    return makeElement("note", { ...noteSpec[CUSTOM_ATTRIBUTES_KEY] }, [
        makeText(noteSpec.text),
    ]);
};

const jsToXliff12 = (obj, opt, cb) => {
    if (!cb && opt === undefined) {
        return new Promise((resolve, reject) =>
            jsToXliff12Clb(obj, opt, (err, ret) =>
                err ? reject(err) : resolve(ret)
            )
        );
    }
    if (!cb && typeof opt !== "function") {
        return new Promise((resolve, reject) =>
            jsToXliff12Clb(obj, opt, (err, ret) =>
                err ? reject(err) : resolve(ret)
            )
        );
    }
    return jsToXliff12Clb(obj, opt, cb);
};

jsToXliff12.jsToXliff12Clb = jsToXliff12Clb;

export default jsToXliff12;
