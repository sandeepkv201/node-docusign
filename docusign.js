const docusign = require('docusign-esign');

/**
 * Instantiate a new ApiClient object. This object is used to make eSignature API calls to DocuSign.
 */
const apiClient = new docusign.ApiClient({
    // This basePath parameter tells the SDK the first part of the URL to use when making API calls. 
    basePath: docusign.ApiClient.RestApi.BasePath.DEMO,
    oAuthBasePath: docusign.ApiClient.OAuth.BasePath.DEMO
});

const jwtUserToken = await apiClient.requestJWTUserToken({
    integratorKey,
    userId,
    scopes,
    privateKeyFile,
    expiresIn: 5000
});

const userInfo = await apiClient.getUserInfo(jwtUserToken.body.access_token);
// Getting first account by default. 
// You can enable them to pick which DocuSign account they wish to use with the integration.
const accountId = userInfo.accounts[0].accountId;

// Provide the authentication information required to make API calls.
apiClient.addDefaultHeader('Authorization', `Bearer ${jwtUserToken.body.access_token}`);
// ApiClient object is used as a parameter on the constructors of all the API modules.
const envelopesApi = new docusign.EnvelopesApi(apiClient);

/**
 * Creates Document Definition.
 * @param {*} param0 
 * @returns 
 */
const createDocumentDefinition = ({ documentId, name, fileExtension, documentBase64 }) => {
    return new docusign.Document.constructFromObject({ documentId, name, fileExtension, documentBase64 });
};

/**
 * Creates DocuSign Signer Tabs Definition
 * @param {*} param0 
 * @returns 
 */
const createSignerTabsDefinition = ({ anchorString, name, recipientId, routingOrder, optional }) => {
    return [
        docusign.SignHere.constructFromObject({
            anchorString: anchorString + routingOrder,
            tabLabel: anchorString + routingOrder,
            name,
            recipientId: String(recipientId),
            anchorYOffset: '0',
            anchorXOffset: '0',
            anchorUnits: 'pixels',
            scaleValue: 1,
            optional
        })
    ];
};

/**
 * Creates DocuSign Signer Definition
 * @param {*} param0 
 * @returns 
 */
const createSignerDefinition = ({ signer, recipientId, routingOrder }) => {
    let signerDefinition = docusign.Signer.constructFromObject({ email: signer.email, name: signer.name, recipientId, routingOrder });
    signerDefinition.tabs = docusign.Tabs.constructFromObject({
        signHereTabs: createSignerTabsDefinition({ anchorString: 'dcSignatureTab', name: 'Plese Sign Here', recipientId, routingOrder, optional: 'false' }),
        fullNameTabs: createSignerTabsDefinition({ anchorString: 'dFullNameTab', name: 'Full Name', recipientId, routingOrder, optional: 'true' }),
        companyTabs: createSignerTabsDefinition({ anchorString: 'dcCompanyNameTab', name: 'Company Name', recipientId, routingOrder, optional: 'true' }),
        dateSignedTabs: createSignerTabsDefinition({ anchorString: 'dcDateSignedTab', name: 'Date Signed', recipientId, routingOrder, optional: 'false' }),
        titleTabs: createSignerTabsDefinition({ anchorString: 'dcTitleTab', name: 'Title', recipientId, routingOrder, optional: 'true' })
    });
    return signerDefinition;
};

/**
 * Creates DocuSign Envelopes Definition
 * @param {*} param0 
 * @returns 
 */
const createEnvelopeDefinition = ({ emailSubject, signers, filename, documentBase64 }) => {

    // Document which needs to be signed.
    const documentDefinition = createDocumentDefinition({ documentId: 1, name: filename, fileExtension: 'pdf', documentBase64 });

    // Recipients Definition
    const recipients = docusign.Recipients.constructFromObject({
        signers: signers.map((signer, signerIndex) => createSignerDefinition({
            signer,
            recipientId: signerIndex + 1,
            routingOrder: signerIndex + 1
        }))
    });

    // Envelop Definition Object.
    let envelop = new docusign.EnvelopeDefinition();

    // Set Mail Subject
    envelop.emailSubject = emailSubject;

    // Set Documents to be Signed
    envelop.documents = [documentDefinition];

    // Set Signers who will be signing Document
    envelop.recipients = recipients;

    // Set Status 
    envelop.status = 'Sent';

    return envelop;
};

// Create DocuSign Envelop Definition.
const envelope = createEnvelopeDefinition({
    emailSubject,
    signers: [signer1, signer2],
    filename,
    documentBase64
});

await envelopesApi.createEnvelope(accountId, { envelopeDefinition: envelope });