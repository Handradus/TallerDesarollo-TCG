const crypto = require('crypto');

/**
 * Hash a password using Node's native PBKDF2 algorithm
 * @param {string} password 
 * @returns {string} The formatted salt + hashed password
 */
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 * @param {string} password 
 * @param {string} hashedPassword The salt:hash formatted string
 * @returns {boolean} True if password matches, false otherwise
 */
function verifyPassword(password, hashedPassword) {
    if (!hashedPassword || !hashedPassword.includes(':')) {
        return false;
    }
    const [salt, originalHash] = hashedPassword.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === originalHash;
}

module.exports = {
    hashPassword,
    verifyPassword
};
