import { validatePassword } from "../utils/validation";

interface PasswordStrengthProps {
    password: string;
    userData?: {
        firstName?: string;
        lastName?: string;
        email?: string;
    };
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password, userData }) => {
    if (!password) return null;

    const { hasLength, hasNumberOrSymbol, hasNoPersonalInfo } = validatePassword(password, userData);

    // Calculate Strength Level (0-3)
    const checks = [hasLength, hasNumberOrSymbol, hasNoPersonalInfo];
    const passedChecks = checks.filter(Boolean).length;

    let strengthLabel = "Weak";
    let color = "bg-red-500";
    let width = "w-1/3";

    if (passedChecks === 3) {
        strengthLabel = "Strong";
        color = "bg-green-500";
        width = "w-full";
    }

    return (
        <div className="mt-2 space-y-2 text-sm">
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-1">
                <span>Password strength: <span className={`${passedChecks === 3 ? "text-green-600" : "text-red-500"}`}>{strengthLabel}</span></span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${width} ${color} transition-all duration-300`} />
            </div>

            {/* Requirements List */}
            <ul className="space-y-1 text-gray-500 text-xs">
                <li className={`flex items-center gap-2 ${hasNoPersonalInfo ? "text-green-600" : "text-gray-500"}`}>
                    <span className="material-symbols-outlined text-[16px]">
                        {hasNoPersonalInfo ? "check_circle" : "cancel"}
                    </span>
                    Can't contain your name or email address
                </li>
                <li className={`flex items-center gap-2 ${hasLength ? "text-green-600" : "text-gray-500"}`}>
                    <span className="material-symbols-outlined text-[16px]">
                        {hasLength ? "check_circle" : "cancel"}
                    </span>
                    At least 8 characters
                </li>
                <li className={`flex items-center gap-2 ${hasNumberOrSymbol ? "text-green-600" : "text-gray-500"}`}>
                    <span className="material-symbols-outlined text-[16px]">
                        {hasNumberOrSymbol ? "check_circle" : "cancel"}
                    </span>
                    Contains a number or symbol
                </li>
            </ul>
        </div>
    );
};

export default PasswordStrength;
