export interface PasswordValidationResult {
    isValid: boolean;
    hasLength: boolean;
    hasNumberOrSymbol: boolean;
    hasNoPersonalInfo: boolean;
    errors: string[];
}

export const validatePassword = (
    password: string,
    userData?: {
        firstName?: string;
        lastName?: string;
        email?: string
    }
): PasswordValidationResult => {
    const errors: string[] = [];

    // 1. Check Length
    const hasLength = password.length >= 8;
    if (!hasLength) {
        errors.push("Password must be at least 8 characters");
    }

    // 2. Check Number or Symbol
    const hasNumberOrSymbol = /[\d!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasNumberOrSymbol) {
        errors.push("Password must contain a number or symbol");
    }

    // 3. Check Personal Info
    let hasNoPersonalInfo = true;
    if (userData) {
        const lowerPassword = password.toLowerCase();
        const parts = [
            userData.firstName?.toLowerCase(),
            userData.lastName?.toLowerCase(),
            userData.email?.split("@")[0].toLowerCase(),
        ].filter((p): p is string => !!p && p.length > 2); // Only check parts > 2 chars

        for (const part of parts) {
            if (lowerPassword.includes(part)) {
                hasNoPersonalInfo = false;
                errors.push("Password cannot contain your name or email");
                break;
            }
        }
    }

    const isValid = hasLength && hasNumberOrSymbol && hasNoPersonalInfo;

    return {
        isValid,
        hasLength,
        hasNumberOrSymbol,
        hasNoPersonalInfo,
        errors
    };
};
