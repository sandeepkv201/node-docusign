const config = require('config');

console.log('Running Environment', process.env.NODE_ENV);

console.log('integrationKey', config.get('DocuSign.integrationKey'));
console.log('userId', config.get('DocuSign.userId'));