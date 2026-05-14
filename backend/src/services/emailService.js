const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendResetEmail = async (to, resetLink) => {
    try {
        await transporter.sendMail({
            from: `"ArtSphere" <${process.env.EMAIL_USER}>`,
            to,
            subject: 'Réinitialisation de votre mot de passe ArtSphere',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                    <h2 style="color: #003153;">ArtSphere</h2>
                    <p>Bonjour,</p>
                    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                    <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
                    <p><a href="${resetLink}" style="background-color: #003153; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Réinitialiser mon mot de passe</a></p>
                    <p>Ce lien expire dans 1 heure.</p>
                    <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
                    <hr />
                    <p style="font-size: 12px; color: #666;">ArtSphere - Plateforme d'art certifiée</p>
                </div>
            `
        });
        console.log(`✅ Email envoyé à ${to}`);
    } catch (error) {
        console.error('❌ Erreur envoi email:', error);
    }
};