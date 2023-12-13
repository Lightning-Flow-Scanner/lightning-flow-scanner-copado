import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { getRelatedListRecords } from 'lightning/uiRelatedListApi';

import VERSION_DATA_FIELD from '@salesforce/schema/ContentVersion.VersionData';
import TITLE_FIELD from '@salesforce/schema/ContentDocumentLink.ContentDocument.Title';
import LATEST_PUBLISHED_VERSION_FIELD from '@salesforce/schema/ContentDocumentLink.ContentDocument.LatestPublishedVersionId';

import jsyamllib from "@salesforce/resourceUrl/jsyamlliblfs";
import { loadScript } from 'lightning/platformResourceLoader';

export default class flowScannerResultTable extends LightningElement {
    @api recordId;
    showTable = false;
    message = 'No Violations Found';
    @track relevantFormattedJson;
    _versionId;
    type;
    result = {};
    scriptsLoaded = false;
    formattedJson;

    @wire(getRelatedListRecords, {
        parentRecordId: '$recordId',
        relatedListId: 'ContentDocumentLinks',
        fields: [
            `${LATEST_PUBLISHED_VERSION_FIELD.objectApiName}.${LATEST_PUBLISHED_VERSION_FIELD.fieldApiName}`,
            `${TITLE_FIELD.objectApiName}.${TITLE_FIELD.fieldApiName}`
        ]
    })
    docLinksInfo({ data }) {
        if (data) {
            const logsDoc = data?.records?.find((doc) => getFieldValue(doc, TITLE_FIELD) === 'output.json'); // change the file name from where data should be fetched

            if (logsDoc) {
                this._versionId = getFieldValue(logsDoc, LATEST_PUBLISHED_VERSION_FIELD);
            }
        }
    }

    @wire(getRecord, { recordId: '$_versionId', fields: [VERSION_DATA_FIELD] })
    wiredVersion({ data }) {
        if (data) {
            const rawData = getFieldValue(data, VERSION_DATA_FIELD);
            const serializedJson = this.b64DecodeUnicode(rawData);
            const { type, formattedJson } = this.getFormattedData(serializedJson);
            if (formattedJson.length > 0) {
                this.showTable = true;
                this.type = type;
                this.formattedJson = formattedJson;
                this.relevantFormattedJson = formattedJson;
                return;
            }
            return;
        }
    }

    async connectedCallback() {
        if (!this.scriptsLoaded) {
            await loadScript(this, jsyamllib);
            this.scriptsLoaded = true;
        }
    }

    get yamlData() {
        if (this.isYAML && this.scriptsLoaded) {
            return jsyaml.dump(this.formattedJson);
        }

        return '';
    }

    get recordCount() {
        return this.relevantFormattedJson?.length;
    }

    get columns() {
        if (this.type !== 'Table') {
            return [];
        }

        const allKeys = this.formattedJson.reduce((keys, item) => {
            return keys.concat(Object.keys(item));
        }, []);
        const uniqueKeys = [...new Set(allKeys)];

        return uniqueKeys.map(key => {
            return {
                label: key.charAt(0).toUpperCase() + key.slice(1),
                fieldName: key,
                type: 'text'
            };
        });
    }


    get isTabular() {
        return (this.type === 'Table' && this.columns.length);
    }


    get isYAML() {
        return (this.type === 'YAML' && this.formattedJson);
    }


    get isString() {
        return (this.type === 'String' && this.formattedJson);
    }

    // Transformation function
    transformJson(parsedJson) {
        const violations = parsedJson.result.results;
        const transformedData = [];
        violations.forEach((violation) => {
            const transformedViolation = {
                'Flow Name': violation.flowName,
                'API Name': violation.name,
                'Flow Type': violation.flowType,
                severity: violation.severity,
                rule: violation.rule,
                'Rule Description': violation.ruleDescription,
                type: violation.type,
                metaType: violation.metaType,
            };
            transformedData.push(transformedViolation);
        });

        return transformedData;
    }

    getFormattedData(serializedJson) {
        try {
            const formattedJson = this.transformJson(JSON.parse(serializedJson));
            if (formattedJson?.length) {
                return {
                    type: 'Table', formattedJson
                };
            } else {
                return {
                    type: 'YAML', formattedJson
                };
            }
        } catch (error) {
            return {
                type: 'String',
                formattedJson: serializedJson
            };
        }
    }

    handleSearch(event) {
        const searchTerm = event.target.value ? event.target.value.trim().toLowerCase() : '';

        if (!searchTerm) {
            this._clearSearch();
        } else {
            this._applySearch(searchTerm);
        }
    }

    b64DecodeUnicode(str) {
        return decodeURIComponent(atob(str).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }

    _clearSearch() {
        this.relevantFormattedJson = this.formattedJson;
    }


    _applySearch(searchTerm) {
        this.relevantFormattedJson = this.formattedJson.filter((row) => {
            for (const key in row) {
                const value = '' + row[key] || '';
                if (value && value.toLowerCase()?.includes(searchTerm)) {
                    return true;
                }
            }
            return false;
        });
    }
}
