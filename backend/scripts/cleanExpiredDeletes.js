require('dotenv').config();
const deleteAccountController = require('../src/controllers/deleteAccountController');

async function run() {
    console.log('🧹 Nettoyage des comptes en attente de suppression...');
    await deleteAccountController.checkExpiredDeleteRequests();
    console.log('✅ Nettoyage terminé');
    process.exit(0);
}

run();