export interface PasswordValidationResult {
    isValid: boolean;
    hasLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
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

    // 2. Check Uppercase
    const hasUppercase = /[A-Z]/.test(password);
    if (!hasUppercase) {
        errors.push("Password must contain at least one uppercase letter");
    }

    // 3. Check Lowercase
    const hasLowercase = /[a-z]/.test(password);
    if (!hasLowercase) {
        errors.push("Password must contain at least one lowercase letter");
    }

    // 4. Check Number
    const hasNumber = /\d/.test(password);
    if (!hasNumber) {
        errors.push("Password must contain at least one number");
    }

    // 5. Check Personal Info
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

    const isValid = hasLength && hasUppercase && hasLowercase && hasNumber && hasNoPersonalInfo;

    return {
        isValid,
        hasLength,
        hasUppercase,
        hasLowercase,
        hasNumber,
        hasNoPersonalInfo,
        errors
    };
};
